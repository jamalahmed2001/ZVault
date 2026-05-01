import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import path from 'path';
import { getUserConfigByApiKey, getTransactionByUserInvoice } from '../db';
import { getContainerStatus } from '../docker';
import { getUserAddressesFromFile } from '../shared';
import { getSafeDockerName } from '../utils';
import { config } from '../config';
import { BadRequestError } from '../errors';

interface AddressRequestParams {
    api_key?: string;
    user_id?: string;
    invoice_id?: string;
}

function isValidAddressRequest(data: any): data is { api_key: string; user_id: string; invoice_id: string } {
    return data &&
           typeof data.api_key === 'string' && data.api_key.trim() !== '' &&
           typeof data.user_id === 'string' && data.user_id.trim() !== '' &&
           typeof data.invoice_id === 'string' && data.invoice_id.trim() !== '';
}

export default async function addressRoute(fastify: FastifyInstance) {

    fastify.get('/address', async (request: FastifyRequest<{ Querystring: AddressRequestParams }>, reply: FastifyReply) => {
        const log = request.log;
        const query = request.query;

        if (!isValidAddressRequest(query)) {
             const missing = ['api_key', 'user_id', 'invoice_id']
                 .filter(k => !(query as any)?.[k] || String((query as any)[k]).trim() === '');
            throw new BadRequestError(`Missing or empty required query parameters: ${missing.join(', ')}`);
        }

        const { api_key: apiKey, user_id: clientUserId, invoice_id: invoiceId } = query;

        try {
            if (!/^[0-9]+$/.test(clientUserId)) log.warn(`/address received non-numeric clientUserId: ${clientUserId}`);
            if (!/^[0-9]+$/.test(invoiceId)) log.warn(`/address received non-numeric invoiceId: ${invoiceId}`);
        } catch (e: any) {
            throw new BadRequestError(`Invalid parameter format: user_id and invoice_id must be numeric-like strings.`);
        }

        const userConfig = await getUserConfigByApiKey(fastify, apiKey);
        const { dbUserId } = userConfig;

        const containerName = getSafeDockerName(dbUserId, clientUserId, invoiceId);
        const userSharedDir = path.join(config.sharedBaseDir, dbUserId, clientUserId, invoiceId);

        // Read addresses from shared file
        const addresses = await getUserAddressesFromFile(log, userSharedDir);

        // Get ZEC amount and workflow state from DB
        let zecAmount: string | null = null;
        let workflowStage: string | null = null;
        let failureReason: string | null = null;
        try {
          const client = await fastify.pg.connect();
          try {
            const { rows } = await client.query(
              `SELECT amount, "workflowStage", "failureReason" FROM "Transaction"
               WHERE "userId" = $1 AND "clientUserId" = $2 AND "invoiceId" = $3
               LIMIT 1`,
              [dbUserId, String(clientUserId), String(invoiceId)],
            );
            if (rows[0]) {
              zecAmount = rows[0].amount;
              workflowStage = rows[0].workflowStage;
              failureReason = rows[0].failureReason;
            }
          } finally {
            client.release();
          }
        } catch (e) {
          log.warn(`Could not fetch transaction data for address: ${(e as any).message}`);
        }

        // Container status (for backward compat)
        const { status: containerStatus, runtimeMinutes } = await getContainerStatus(log, containerName);

        return reply.code(200).send({
            address: addresses.transparent ?? "Not Available Yet",
            shielded_address: addresses.shielded ?? "Not Available Yet",
            zec_amount: zecAmount,
            container_status: containerStatus,
            runtime_minutes: runtimeMinutes,
            not_found: containerStatus === 'Not Found' || containerStatus === 'Not Found / Removed',
            workflow_stage: workflowStage,
            failure_reason: failureReason,
        });
    });
}
