import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
    getUserConfigByApiKey,
    insertTransactionRecord,
    getValidLicenseKey,
    upsertLicenseKey,
    getTransactionCountByUser,
    getTransactionCountByUserThisMonth
} from '../db';
import { startUserContainer } from '../docker';
import { config } from '../config';
import path from 'path';
import fs from 'fs';
import Decimal from 'decimal.js';
import { BadRequestError, UnauthorizedError, InternalServerError, AppError } from '../errors';
import { CreateContainerJobData } from '../types';
import { getAccessToken, verifyToken, incrementUsage } from '../utils';
import { getUserAddressFromFile } from '../shared';

interface PayoutRequestBody {
    api_key?: string;
    user_id?: string; // client user id
    invoice_id?: string;
    payout_address?: string; // t or z address for the payout
}

// Type guard for the request body
function isValidPayoutRequest(data: any): data is { api_key: string; user_id: string; invoice_id: string; payout_address: string } {
    return data &&
           typeof data.api_key === 'string' && data.api_key.trim() !== '' &&
           typeof data.user_id === 'string' && data.user_id.trim() !== '' &&
           typeof data.invoice_id === 'string' && data.invoice_id.trim() !== '' &&
           typeof data.payout_address === 'string' && data.payout_address.trim() !== ''; // Basic validation for address
}

export default async function payoutRoute(fastify: FastifyInstance) {
    fastify.post('/payout', async (request: FastifyRequest<{ Body: PayoutRequestBody }>, reply: FastifyReply) => {
        const log = request.log;
        const data = request.body;

        try {
            // --- Validation ---
            if (!isValidPayoutRequest(data)) {
                const missingOrInvalid = ['api_key', 'user_id', 'invoice_id', 'payout_address']
                    .filter(k => !(data as any)?.[k] || String((data as any)[k]).trim() === '');
                // Add more specific address validation if needed (e.g., regex for t/z addresses)
                if (data?.payout_address && (data.payout_address.trim().length < 10)) { // Arbitrary minimum length
                     throw new BadRequestError('Invalid payout_address format.');
                }
                throw new BadRequestError(`Missing or empty required parameters: ${missingOrInvalid.join(', ')}`);
            }

            const { api_key: apiKey, user_id: clientUserId, invoice_id: invoiceId, payout_address: payoutAddress } = data;

            // --- API Key & User Config Lookup ---
            const userConfig = await getUserConfigByApiKey(fastify, apiKey); // Throws on error/not found
            const { dbUserId, webhookUrl, webhookSecret, apiKeyId, transactionFee: feePercentageDb, zcashAddress: defaultUserZcashAddress } = userConfig;

            // --- Create Transaction Record for Payout ---
            // For payouts, amount and fee might be 0 or represent a service charge.
            // Here, we'll log it with 0 amount/fee, and a 'payout' type.
            // This assumes the actual payout amount is handled by the container.
            const payoutAmountForRecord = new Decimal(0); // Placeholder or specific payout service fee
            const payoutFeeForRecord = new Decimal(0);    // Placeholder or specific payout service fee

            const transactionId = await insertTransactionRecord(
                fastify,
                dbUserId,
                invoiceId,
                clientUserId,
                payoutAmountForRecord,
                payoutFeeForRecord,
                apiKeyId // Use apiKeyId from userConfig
            );
            log.info(`Payout transaction record ${transactionId} created for UID: ${clientUserId}, IID: ${invoiceId}. (Status will be default)`);

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
            // Assuming payouts count towards usage. If not, this block can be conditional or removed.
            try {
                await incrementUsage({
                    apiKey,
                    instanceId: invoiceId,
                    version: '1', // Or appropriate version for payouts
                    totalTransactions,
                    calendarMonthUsage
                });
            } catch (e: any) {
                log.warn(`Failed to increment usage for payout: ${e.message}`);
            }

            // --- Get and Verify License Token ---
            let accessToken: string | undefined;
            // let tokenExpires: Date | undefined; // Not explicitly used later in this route currently
            try {
                const cached = await getValidLicenseKey(fastify, apiKey);
                let licenseKey: string;
                let expiresAt: number; // Milliseconds since epoch

                if (cached) {
                    licenseKey = cached.accessToken;
                    expiresAt = cached.expiresAt.getTime();
                } else {
                    const license = await getAccessToken({
                        apiKey,
                        instanceId: invoiceId,
                        version: '1', // Or appropriate version
                        totalTransactions,
                        calendarMonthUsage
                    });
                    licenseKey = license.accessToken;
                    expiresAt = license.expiresAt; // This is expected to be milliseconds from the getAccessToken response
                    
                    // Ensure expiresAt is a valid number before creating Date
                    if (typeof expiresAt !== 'number' || isNaN(expiresAt)) {
                        throw new InternalServerError('Invalid expiration timestamp received from license server.');
                    }
                    // The getAccessToken is expected to return timestamp in ms. If it's in seconds, multiply by 1000.
                    // Assuming it's already in ms as per create.ts's corrected logic.
                    await upsertLicenseKey(fastify, apiKey, licenseKey, new Date(expiresAt));
                    // tokenExpires = new Date(expiresAt);
                }

                const publicKeyPath = path.join(process.cwd(), 'jwt-public.pem');
                const publicKey = fs.readFileSync(publicKeyPath, 'utf8');
                try {
                    verifyToken(licenseKey, publicKey);
                    accessToken = licenseKey;
                } catch (verifyErr: any) {
                    log.warn(`Initial token verification failed for payout: ${verifyErr.message}. Attempting to fetch a new one.`);
                    const license = await getAccessToken({
                        apiKey,
                        instanceId: invoiceId,
                        version: '1',
                        totalTransactions,
                        calendarMonthUsage
                    });
                    licenseKey = license.accessToken;
                    expiresAt = license.expiresAt;

                    if (typeof expiresAt !== 'number' || isNaN(expiresAt)) {
                        throw new InternalServerError('Invalid expiration timestamp received from license server on retry.');
                    }
                    await upsertLicenseKey(fastify, apiKey, licenseKey, new Date(expiresAt));
                    verifyToken(licenseKey, publicKey); // Throws if still invalid
                    accessToken = licenseKey;
                    // tokenExpires = new Date(expiresAt);
                }
                log.info(`License token verified for payout UID: ${clientUserId}, IID: ${invoiceId}.`);

            } catch (e: any) {
                log.error(`Payout license activation or verification failed: ${e.message}`);
                throw new UnauthorizedError('Payout license activation or verification failed.');
            }

            // --- Prepare for Asynchronous Container Creation ---
            const userSharedDir = path.join(config.sharedBaseDir, dbUserId, clientUserId, invoiceId);

            // Fee percentage for payout container jobData.
            // If payouts have a fee, it should come from userConfig.transactionFee.
            // If not, "0" is appropriate. Assuming it uses the same fee structure for now.
            const feePercentageForJob = feePercentageDb != null ? feePercentageDb.toFixed() : "0";
            // Destination for fees. Using the user's default zcash address or an empty string if not applicable.
            const feeDestinationForJob = feePercentageDb != null && feePercentageDb.gt(0) ? defaultUserZcashAddress : "";


            const jobData: CreateContainerJobData = {
                dbUserId,
                clientUserId,
                invoiceId,
                userSharedDir,
                exodusWallet: payoutAddress, // This is the crucial Payout Destination Address
                webhookUrl,
                webhookSecret,
                // Use feePercentage from userConfig, defaulting to "0" if not set or not applicable
                feePercentage: feePercentageForJob,
                // Destination for fees, could be user's main wallet or specific if payout has distinct fee logic
                feeDestinationAddr: feeDestinationForJob,
                containerTimeout: 1800, // Or a different timeout for payout containers
                // operationType: "payout" // Add this if your container distinguishes operations
                // accessToken: accessToken // Pass if container needs it directly, create.ts doesn't
            };

            // --- Start Container Asynchronously ---
            await startUserContainer(fastify, jobData);

            // --- Try to get address/status if available (for immediate feedback) ---
            let initialStatusMessage: string | null = null;
            try {
                // For payouts, `getUserAddressFromFile` might not be the right function
                // if the file content or name differs. Assuming a generic status or the target address might be written.
                // If a specific status file is written by payout containers, use that.
                // For now, let's assume it might write the payoutAddress or a status.
                const statusFromFile = await getUserAddressFromFile(log, userSharedDir); // This might need adjustment
                if (statusFromFile) {
                     initialStatusMessage = `Payout initiated. Current status: ${statusFromFile}. Monitor via /address endpoint.`;
                }
            } catch (e: any) {
                log.warn(`Could not fetch initial status from file for payout: ${e.message}`);
            }

            log.info(`Payout container creation initiated for UID: ${clientUserId}, IID: ${invoiceId} to address ${payoutAddress}.`);

            return reply.code(202).send({
                status: 'processing_payout',
                message: initialStatusMessage || 'Payout container creation initiated. Monitor container status for payout confirmation via /address endpoint.',
                transaction_id: transactionId,
                client_user_id: clientUserId,
                invoice_id: invoiceId,
                payout_address: payoutAddress
            });

        } catch (err: any) {
            if (err instanceof BadRequestError) {
                return reply.code(400).send({ error: 'bad_request', message: err.message });
            } else if (err instanceof UnauthorizedError) {
                return reply.code(401).send({ error: 'unauthorized', message: err.message });
            } else if (err instanceof InternalServerError) {
                return reply.code(500).send({ error: 'internal_server_error', message: err.message });
            } else if (err instanceof AppError && err.statusCode) {
                return reply.code(err.statusCode).send({ error: 'app_error', message: err.message });
            } else {
                request.log.error(`Unexpected error in /payout: ${err.message || err}`);
                return reply.code(500).send({ error: 'internal_server_error', message: 'An unexpected error occurred during payout processing.' });
            }
        }
    });
} 