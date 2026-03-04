import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { updateTransactionSharedData } from '../db';
import { UnauthorizedError, BadRequestError, InternalServerError, NotFoundError } from '../errors';

interface UpdateRequestBody {
    dbUserId?: string;
    userId?: string;
    invoiceId?: string;
    txHashes?: string[];
    addressesUsed?: string[];
    status?: string;
}

function isValidUpdateRequest(data: any): data is { dbUserId: string; userId: string; invoiceId: string; txHashes: string[]; addressesUsed: string[]; status?: string } {
    return data &&
        typeof data.dbUserId === 'string' && data.dbUserId.trim() !== '' &&
        typeof data.userId === 'string' && data.userId.trim() !== '' &&
        typeof data.invoiceId === 'string' && data.invoiceId.trim() !== '' &&
        Array.isArray(data.txHashes) &&
        Array.isArray(data.addressesUsed) &&
        (data.status === undefined || typeof data.status === 'string');
}

const EXPECTED_WEBHOOK_SECRET = "whsec_CVKiH9Jhz0kyRLZ8NKRClnqVY1tSKTR19R8TjyDbuak";

export default async function updateRoute(fastify: FastifyInstance) {
    fastify.post('/update', async (request: FastifyRequest<{ Body: { json: UpdateRequestBody } }>, reply: FastifyReply) => {
        const log = request.log;
        try {
            // --- Auth ---
            const authHeader = request.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new UnauthorizedError('Missing or malformed Authorization header.');
            }
            const token = authHeader.substring(7);
            if (token !== EXPECTED_WEBHOOK_SECRET) {
                throw new UnauthorizedError('Invalid webhook token.');
            }

            // --- Validation ---
            const data = request.body && request.body.json;
            if (!isValidUpdateRequest(data)) {
                const missingOrInvalidFields = ['dbUserId', 'userId', 'invoiceId', 'txHashes', 'addressesUsed']
                    .filter(k => !(data as any)?.[k] || ((k === 'txHashes' || k === 'addressesUsed') && !Array.isArray((data as any)[k])));
                if (data && data.status !== undefined && typeof data.status !== 'string') {
                    missingOrInvalidFields.push('status (if provided, must be a string)');
                }
                throw new BadRequestError(`Missing or invalid required parameters: ${missingOrInvalidFields.join(', ')}`);
            }
            const { dbUserId, userId: clientUserId, invoiceId, txHashes, addressesUsed, status } = data;

            log.info(`Processing update for dbUserId: ${dbUserId}, clientUserId: ${clientUserId}, invoiceId: ${invoiceId}, status: ${status || 'N/A'}`);
            log.debug({ txHashes, addressesUsed, status }, 'Transaction data being processed.');

            // --- Update Transaction ---
            const statusToUpdate = status === 'complete' ? 'complete' : undefined;

            const updated = await updateTransactionSharedData(
                fastify,
                dbUserId,
                clientUserId,
                invoiceId,
                addressesUsed,
                txHashes,
                statusToUpdate
            );
            if (updated) {
                log.info(`Successfully updated transaction for invoiceId: ${invoiceId}`);
                return reply.status(200).send({ success: true, message: 'Transaction details updated successfully.' });
            } else {
                log.warn(`No transaction found to update for invoiceId: ${invoiceId} (dbUserId: ${dbUserId}, clientUserId: ${clientUserId})`);
                throw new NotFoundError('No matching transaction found to update.');
            }
        } catch (err: any) {
            if (err instanceof BadRequestError) {
                return reply.code(400).send({ error: 'bad_request', message: err.message });
            } else if (err instanceof UnauthorizedError) {
                return reply.code(401).send({ error: 'unauthorized', message: err.message });
            } else if (err instanceof NotFoundError) {
                return reply.code(404).send({ error: 'not_found', message: err.message });
            } else if (err instanceof InternalServerError) {
                return reply.code(500).send({ error: 'internal_server_error', message: err.message });
            } else {
                log.error(`Unexpected error in /update: ${err.message || err}`);
                return reply.code(500).send({ error: 'internal_server_error', message: 'An unexpected error occurred.' });
            }
        }
    });
}
