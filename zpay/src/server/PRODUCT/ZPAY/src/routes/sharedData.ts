import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import fs from 'fs';
import { getUserConfigByApiKey } from '../db';
import { config } from '../config';
import { BadRequestError, UnauthorizedError, NotFoundError, InternalServerError } from '../errors';

interface SharedDataRequestParams {
    api_key?: string;
    user_id?: string;
    invoice_id?: string;
}

function isValidSharedDataRequest(data: any): data is { api_key: string; user_id: string; invoice_id: string } {
    return data &&
        typeof data.api_key === 'string' && data.api_key.trim() !== '' &&
        typeof data.user_id === 'string' && data.user_id.trim() !== '' &&
        typeof data.invoice_id === 'string' && data.invoice_id.trim() !== '';
}

export default async function sharedDataRoute(fastify: FastifyInstance) {
    fastify.get('/shared-log', async (request: FastifyRequest<{ Querystring: SharedDataRequestParams }>, reply: FastifyReply) => {
        const log = request.log;
        const query = request.query;
        try {
            // --- Validation ---
            if (!isValidSharedDataRequest(query)) {
                const missing = ['api_key', 'user_id', 'invoice_id']
                    .filter(k => !(query as any)?.[k] || String((query as any)[k]).trim() === '');
                throw new BadRequestError(`Missing or empty required query parameters: ${missing.join(', ')}`);
            }
            const { api_key: apiKey, user_id: clientUserId, invoice_id: invoiceId } = query;

            // Numeric check for IDs
            if (!/^[0-9]+$/.test(clientUserId)) log.warn(`/shared-log received non-numeric clientUserId: ${clientUserId}`);
            if (!/^[0-9]+$/.test(invoiceId)) log.warn(`/shared-log received non-numeric invoiceId: ${invoiceId}`);

            // --- API Key Lookup ---
            const userConfig = await getUserConfigByApiKey(fastify, apiKey); // Throws on error/not found
            const { dbUserId } = userConfig;

            // --- Construct Log File Path ---
            const userSharedDir = path.join(config.sharedBaseDir, dbUserId, clientUserId, invoiceId);
            const logFilePath = path.join(userSharedDir, 'shielding-process.log');

            // --- Check if File Exists ---
            if (!fs.existsSync(logFilePath)) {
                throw new NotFoundError('Log file not found for this transaction.');
            }

            // --- Stream File ---
            reply.header('Content-Type', 'text/plain');
            reply.header('Content-Disposition', `attachment; filename="shielding-process.log"`);
            const stream = fs.createReadStream(logFilePath);
            return reply.send(stream);
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
                log.error(`Unexpected error in /shared-log: ${err.message || err}`);
                return reply.code(500).send({ error: 'internal_server_error', message: 'An unexpected error occurred.' });
            }
        }
    });
}
