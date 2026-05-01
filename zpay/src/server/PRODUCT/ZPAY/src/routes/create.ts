import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserConfigByApiKey, insertTransactionRecord, getTransactionCountByUser, getTransactionCountByUserThisMonth, getValidLicenseKey, upsertLicenseKey } from '../db';
import { getZecPriceForGbpAmount } from '../price';
import { startUserContainer } from '../docker';
import { quantizeDecimal, getSafeDockerName } from '../utils';
import { config } from '../config';
import Decimal from 'decimal.js';
import path from 'path';
import { BadRequestError, UnauthorizedError, UnprocessableEntityError, InternalServerError, AppError } from '../errors';
import { CreateContainerJobData } from '../types';
import { getAccessToken, verifyToken, incrementUsage } from '../utils';
import fs from 'fs';
import { initiateSwap } from '../exolix';
import { getUserAddressFromFile, getUserAddressesFromFile } from '../shared';
import { WorkflowStage, WorkflowData } from '../orchestration/types';
import { startWorkflow } from '../orchestration/workflow-engine';

interface CreateRequestBody {
    api_key?: string;
    user_id?: string; // client user id
    invoice_id?: string;
    amount?: string | number; // GBP Cents
}

// Type guard for the request body/query
function isValidCreateRequest(data: any): data is { api_key: string; user_id: string; invoice_id: string; amount: string | number } {
    return data &&
           typeof data.api_key === 'string' && data.api_key.trim() !== '' &&
           typeof data.user_id === 'string' && data.user_id.trim() !== '' &&
           typeof data.invoice_id === 'string' && data.invoice_id.trim() !== '' &&
           (typeof data.amount === 'string' || typeof data.amount === 'number') &&
           String(data.amount).trim() !== '';
}

export default async function createRoute(fastify: FastifyInstance) {

    fastify.post('/create', async (request: FastifyRequest<{ Body: CreateRequestBody }>, reply: FastifyReply) => {
        const log = request.log;
        const data = request.body;
        try {
            // --- Validation ---
            if (!isValidCreateRequest(data)) {
                const missing = ['api_key', 'user_id', 'invoice_id', 'amount']
                    .filter(k => !(data as any)?.[k] || String((data as any)[k]).trim() === '');
                throw new BadRequestError(`Missing or empty required parameters: ${missing.join(', ')}`);
            }

            const { api_key: apiKey, user_id: clientUserId, invoice_id: invoiceId, amount: amountGbpCents } = data;

            // Further validation (numeric-like IDs, positive amount)
            let amountDecimal: Decimal;
            try {
                if (!/^[0-9]+$/.test(clientUserId)) log.warn(`/create received non-numeric clientUserId: ${clientUserId}`);
                if (!/^[0-9]+$/.test(invoiceId)) log.warn(`/create received non-numeric invoiceId: ${invoiceId}`);

                amountDecimal = new Decimal(amountGbpCents);
                if (amountDecimal.isNaN() || amountDecimal.isNegative() || amountDecimal.isZero()) {
                    throw new Error("Amount must be a positive number.");
                }
            } catch (e: any) {
                throw new BadRequestError(`Invalid parameter format: user_id/invoice_id should be numeric-like, amount must be a valid positive number. Details: ${e.message}`);
            }

            // --- API Key & User Config Lookup ---
            const userConfig = await getUserConfigByApiKey(fastify, apiKey); // Throws on error/not found

            const { dbUserId, apiKeyId, transactionFee: feePercentageDb, zcashAddress: exodusWallet, webhookUrl, webhookSecret } = userConfig;
            log.info(`Using Transaction Fee for ApiKey ${apiKeyId}: ${feePercentageDb}%`);

            // --- Calculate ZEC Price ---
            const initialZecAmount = await getZecPriceForGbpAmount(fastify, amountDecimal); // Throws on error

            // --- Calculate Fee (for DB storage) ---
            let feeZecQuantized: Decimal;
            try {
                const feeRate = feePercentageDb.dividedBy(100); // feePercentageDb is Decimal
                if (feeRate.isNegative()) {
                    log.error(`Invalid negative fee rate (${feeRate}) derived from transactionFee ${feePercentageDb} for ApiKey ${apiKeyId}.`);
                    throw new InternalServerError('Invalid fee configuration for API key.');
                }

                const feeZec = initialZecAmount.times(feeRate);
                const quantizerFee = new Decimal(config.zecQuantizer);
                feeZecQuantized = quantizeDecimal(feeZec, quantizerFee);
                log.info(`Calculated Fee Amount (ZEC) for DB: ${feeZecQuantized}`);

            } catch (feeCalcErr: any) {
                log.error(`Error calculating fee for DB using transactionFee ${feePercentageDb}: ${feeCalcErr.message || feeCalcErr}`);
                throw new InternalServerError('Internal error during fee calculation.');
            }

            // --- Create Transaction Record in Database ---
            const transactionId = await insertTransactionRecord(
                fastify,
                dbUserId,
                invoiceId,
                clientUserId,
                initialZecAmount,
                feeZecQuantized,
                apiKeyId
            ); // Throws on DB error

            // --- Get Real Total Transactions for User ---
            let totalTransactions = 1;
            let calendarMonthUsage = 1;
            try {
                totalTransactions = await getTransactionCountByUser(fastify, dbUserId);
            } catch (e: any) {
                log.warn(`Failed to get transaction count for user: ${e.message}`);
            }
            try {
                calendarMonthUsage = await getTransactionCountByUserThisMonth(fastify, dbUserId);
            } catch (e: any) {
                log.warn(`Failed to get calendar month transaction count for user: ${e.message}`);
            }

            // --- Increment Usage on License Server ---
            try {
                await incrementUsage({
                    apiKey,
                    instanceId: invoiceId,
                    version: '1',
                    totalTransactions,
                    calendarMonthUsage
                });
            } catch (e: any) {
                log.warn(`Failed to increment usage: ${e.message}`);
            }

            // --- Prepare for Asynchronous Container Creation ---
            const userSharedDir = path.join(config.sharedBaseDir, dbUserId, clientUserId, invoiceId);
            const feePercentageStr = feePercentageDb.toFixed();

            // --- Get and Verify License Token ---
            let accessToken: string | undefined;
            let tokenExpires: Date | undefined;
            try {
                // Try to get a valid cached token
                const cached = await getValidLicenseKey(fastify, apiKey);
                let licenseKey: string;
                let expiresAt: number;
                if (cached) {
                    licenseKey = cached.accessToken;
                    expiresAt = cached.expiresAt.getTime();
                } else {
                    // No valid cached token, fetch a new one
                    const license = await getAccessToken({
                        apiKey,
                        instanceId: invoiceId,
                        version: '1',
                        totalTransactions,
                        calendarMonthUsage
                    });
                    licenseKey = license.accessToken;
                    expiresAt = license.expiresAt;
                    console.log('licenseKey', licenseKey);
                    // Store in DB
                    let expiresAtValue = expiresAt;
                    if (expiresAtValue < 1e12) expiresAtValue = expiresAtValue * 1000;
                    await upsertLicenseKey(fastify, apiKey, licenseKey, new Date(expiresAtValue));
                    tokenExpires = new Date(expiresAt);
                }
                // Verify the token using the public key
                const publicKeyPath = path.join(process.cwd(),  'jwt-public.pem');
                const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
                try {
                    verifyToken(licenseKey, publicKey);
                    accessToken = licenseKey;
                } catch (verifyErr) {
                    // If verification fails, try to fetch a new token and upsert
                    const license = await getAccessToken({
                        apiKey,
                        instanceId: invoiceId,
                        version: '1',
                        totalTransactions,
                        calendarMonthUsage
                    });
                    licenseKey = license.accessToken;
                    expiresAt = license.expiresAt;
                    let expiresAtValue = expiresAt;
                    if (expiresAtValue < 1e12) expiresAtValue = expiresAtValue * 1000;
                    await upsertLicenseKey(fastify, apiKey, licenseKey, new Date(expiresAtValue));
                    verifyToken(licenseKey, publicKey); // Throws if still invalid
                    accessToken = licenseKey;
                    tokenExpires = new Date(expiresAt);
                }
            } catch (e: any) {
                log.error(`License activation or verification failed: ${e.message}`);
                throw new UnauthorizedError('License activation or verification failed.');
            }

            const jobData: CreateContainerJobData = {
                dbUserId,
                clientUserId,
                invoiceId,
                userSharedDir,
                exodusWallet,
                webhookUrl,
                webhookSecret,
                feePercentage: feePercentageStr,
                feeDestinationAddr: exodusWallet,
                containerTimeout: 1800
            };

            // --- Start Container Asynchronously ---
            const containerName = getSafeDockerName(dbUserId, clientUserId, invoiceId);
            await startUserContainer(fastify, jobData);

            // --- Initialize workflow state in DB ---
            const workflowData: WorkflowData = {
              feePercentage: feePercentageStr,
              exodusWallet,
              feeDestinationAddr: exodusWallet,
              webhookUrl: webhookUrl ?? null,
              webhookSecret: webhookSecret ?? null,
            };

            const pgClient = await fastify.pg.connect();
            try {
              await pgClient.query(
                `UPDATE "Transaction"
                 SET "workflowStage" = $1, "workflowData" = $2, "containerName" = $3, "updatedAt" = NOW()
                 WHERE id = $4`,
                [WorkflowStage.BOOTSTRAP_CONTAINER, JSON.stringify(workflowData), containerName, transactionId],
              );
            } finally {
              pgClient.release();
            }

            // --- Kick off deterministic orchestration (async, non-blocking) ---
            startWorkflow(fastify, transactionId, containerName);

            // --- Try to get addresses if available ---
            let addresses = { transparent: null as string | null, shielded: null as string | null };
            try {
                addresses = await getUserAddressesFromFile(log, userSharedDir);
            } catch (e: any) {
                log.warn(`Could not fetch addresses at create: ${e.message}`);
            }

            log.info(`Transaction ${transactionId} created and workflow initiated for UID: ${clientUserId}, IID: ${invoiceId}.`);

            const quantizerDisplay = new Decimal(config.zecQuantizer);
            const zecDisplayAmount = quantizeDecimal(initialZecAmount, quantizerDisplay);
            const hasAddress = addresses.transparent || addresses.shielded;

            return reply.code(202).send({
                status: 'processing',
                message: hasAddress ? 'Transaction accepted, address available.' : 'Transaction accepted, address generation in progress. Please poll the /address endpoint.',
                transaction_id: transactionId,
                zec_amount_initial: parseFloat(zecDisplayAmount.toString()),
                address: addresses.transparent || undefined,
                shielded_address: addresses.shielded || undefined,
            });
        } catch (err: any) {
            // Handle all errors gracefully and return proper error code
            if (err instanceof BadRequestError) {
                return reply.code(400).send({ error: 'bad_request', message: err.message });
            } else if (err instanceof UnauthorizedError) {
                return reply.code(401).send({ error: 'unauthorized', message: err.message });
            } else if (err instanceof UnprocessableEntityError) {
                return reply.code(422).send({ error: 'unprocessable_entity', message: err.message });
            } else if (err instanceof InternalServerError) {
                return reply.code(500).send({ error: 'internal_server_error', message: err.message });
            } else if (err instanceof AppError && err.statusCode) {
                return reply.code(err.statusCode).send({ error: 'app_error', message: err.message });
            } else {
                request.log.error(`Unexpected error in /create: ${err.message || err}`);
                return reply.code(500).send({ error: 'internal_server_error', message: 'An unexpected error occurred.' });
            }
        }
    });

    // --- Exolix Swap Endpoint ---
    fastify.post('/swap', async (request: FastifyRequest, reply: FastifyReply) => {
        const { api_key, from_currency, amount, user_id, invoice_id } = request.body as any;
        if (!api_key || !from_currency || !amount || !user_id || !invoice_id) {
            const missing = ['api_key', 'from_currency', 'amount', 'user_id', 'invoice_id']
                .filter(k => !(request.body as any)?.[k] || String((request.body as any)[k]).trim() === '');
            return reply.status(400).send({ error: `Missing or empty required parameters: ${missing.join(', ')}` });
        }
        // Authenticate API key (reuse getUserConfigByApiKey)
        let userConfig;
        try {
            userConfig = await getUserConfigByApiKey(fastify, api_key);
        } catch (e: any) {
            return reply.status(401).send({ error: 'Invalid API key' });
        }
        // Derive userSharedDir and try to get wallet1 transparent address
        const { dbUserId, zcashAddress, webhookUrl, webhookSecret, transactionFee, apiKeyId } = userConfig;
        const userSharedDir = path.join(config.sharedBaseDir, dbUserId, user_id, invoice_id);
        const log = request.log;
        let payoutAddress = await getUserAddressFromFile(log, userSharedDir);
        if (!payoutAddress) {
            // Start the container if not already started
            const feePercentageStr = transactionFee.toFixed();
            const jobData: CreateContainerJobData = {
                dbUserId,
                clientUserId: user_id,
                invoiceId: invoice_id,
                userSharedDir,
                exodusWallet: zcashAddress,
                webhookUrl,
                webhookSecret,
                feePercentage: feePercentageStr,
                feeDestinationAddr: zcashAddress,
                containerTimeout: 3600
            };
            try {
                await startUserContainer(fastify, jobData);
            } catch (e: any) {
                log.error(`Failed to start container: ${e.message}`);
                return reply.status(500).send({ error: 'Failed to start container for swap' });
            }
            // Wait for the address file to appear (retry up to 10 times, 500ms apart)
            for (let i = 0; i < 10; i++) {
                await new Promise(res => setTimeout(res, 500));
                payoutAddress = await getUserAddressFromFile(log, userSharedDir);
                if (payoutAddress) break;
            }
        }
        if (!payoutAddress) {
            return reply.status(404).send({ error: 'Container wallet1 transparent address not available yet. Please try again later.' });
        }
        // --- Calculate ZEC Price and Fee, then log transaction ---
        let amountDecimal: Decimal;
        try {
            amountDecimal = new Decimal(amount);
            if (amountDecimal.isNaN() || amountDecimal.isNegative() || amountDecimal.isZero()) {
                throw new Error("Amount must be a positive number.");
            }
        } catch (e: any) {
            return reply.status(400).send({ error: `Invalid amount: ${e.message}` });
        }
        let initialZecAmount: Decimal;
        try {
            initialZecAmount = await getZecPriceForGbpAmount(fastify, amountDecimal);
        } catch (e: any) {
            return reply.status(500).send({ error: `Failed to calculate ZEC amount: ${e.message}` });
        }
        let feeZecQuantized: Decimal;
        try {
            const feeRate = transactionFee.dividedBy(100);
            if (feeRate.isNegative()) {
                log.error(`Invalid negative fee rate (${feeRate}) derived from transactionFee ${transactionFee} for ApiKey ${apiKeyId}.`);
                throw new Error('Invalid fee configuration for API key.');
            }
            const feeZec = initialZecAmount.times(feeRate);
            const quantizerFee = new Decimal(config.zecQuantizer);
            feeZecQuantized = quantizeDecimal(feeZec, quantizerFee);
        } catch (feeCalcErr: any) {
            log.error(`Error calculating fee for DB using transactionFee ${transactionFee}: ${feeCalcErr.message || feeCalcErr}`);
            return reply.status(500).send({ error: 'Internal error during fee calculation.' });
        }
        let transactionId: string;
        try {
            transactionId = await insertTransactionRecord(
                fastify,
                dbUserId,
                invoice_id,
                user_id,
                initialZecAmount,
                feeZecQuantized,
                apiKeyId
            );
        } catch (e: any) {
            log.error(`Failed to insert transaction record for swap: ${e.message}`);
            return reply.status(500).send({ error: 'Failed to log swap transaction.' });
        }
        try {
            const swap = await initiateSwap({
                fromCurrency: from_currency,
                toCurrency: 'zec',
                amount: String(amount),
                payoutAddress,
            });
            return reply.send({ swap, transaction_id: transactionId });
        } catch (e: any) {
            return reply.status(500).send({ error: e.message || 'Swap initiation failed', transaction_id: transactionId });
        }
    });
}
