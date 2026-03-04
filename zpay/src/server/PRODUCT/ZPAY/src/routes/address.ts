import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import { getUserConfigByApiKey, getTransactionByUserInvoice } from '../db'; // Only needed for auth/dbUserId
import { getContainerStatus } from '../docker';
import { getUserAddressFromFile } from '../shared';
import { getSafeDockerName } from '../utils';
import { config } from '../config';
import { BadRequestError, UnauthorizedError, NotFoundError, AppError } from '../errors';

interface AddressRequestParams {
    api_key?: string;
    user_id?: string; // client user id
    invoice_id?: string;
}

// Type guard for the request body/query
function isValidAddressRequest(data: any): data is { api_key: string; user_id: string; invoice_id: string } {
    return data &&
           typeof data.api_key === 'string' && data.api_key.trim() !== '' &&
           typeof data.user_id === 'string' && data.user_id.trim() !== '' &&
           typeof data.invoice_id === 'string' && data.invoice_id.trim() !== '';
}


export default async function addressRoute(fastify: FastifyInstance) {

    // Use GET as it's idempotent retrieval
    fastify.get('/address', async (request: FastifyRequest<{ Querystring: AddressRequestParams }>, reply: FastifyReply) => {
        const log = request.log;
        const query = request.query;

        // --- Validation ---
        if (!isValidAddressRequest(query)) {
             const missing = ['api_key', 'user_id', 'invoice_id']
                 .filter(k => !(query as any)?.[k] || String((query as any)[k]).trim() === '');
            throw new BadRequestError(`Missing or empty required query parameters: ${missing.join(', ')}`);
        }

        const { api_key: apiKey, user_id: clientUserId, invoice_id: invoiceId } = query;

        // Basic numeric check (adjust if IDs aren't numbers)
         try {
             if (!/^[0-9]+$/.test(clientUserId)) log.warn(`/address received non-numeric clientUserId: ${clientUserId}`);
             if (!/^[0-9]+$/.test(invoiceId)) log.warn(`/address received non-numeric invoiceId: ${invoiceId}`);
         } catch (e: any) {
             throw new BadRequestError(`Invalid parameter format: user_id and invoice_id must be numeric-like strings.`);
         }


        // --- API Key Lookup (mainly for dbUserId) ---
        // We don't strictly need the full config here, but it authenticates the request
        const userConfig = await getUserConfigByApiKey(fastify, apiKey); // Throws on error/not found
        const { dbUserId } = userConfig;

        // --- Construct Paths ---
        const containerName = getSafeDockerName(dbUserId, clientUserId, invoiceId);
        const userSharedDir = path.join(config.sharedBaseDir, dbUserId, clientUserId, invoiceId);

        // --- Get Address (from file) ---
        // This might return null if the file isn't created yet or has errors
        const address = await getUserAddressFromFile(log, userSharedDir);

        // --- Get ZEC Amount from Transaction ---
        let zecAmount: string | null = null;
        try {
          const tx = await getTransactionByUserInvoice(fastify, dbUserId, clientUserId, invoiceId);
          if (tx) zecAmount = tx.amount;
        } catch (e) {
          log.warn(`Could not fetch ZEC amount for address: ${(e as any).message}`);
        }

        // --- Get Container Status ---
        const { status: containerStatus, runtimeMinutes } = await getContainerStatus(log, containerName);

        // --- Return Result ---
        return reply.code(200).send({
            address: address ?? "Not Available Yet", // Indicate if address hasn't been written
            zec_amount: zecAmount,
            container_status: containerStatus,
            runtime_minutes: runtimeMinutes,
            not_found: containerStatus === 'Not Found' || containerStatus === 'Not Found / Removed',
        });
    });
}
