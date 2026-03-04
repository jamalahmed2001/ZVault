import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserConfigByApiKey, updateUserConfigByApiKey } from '../db';

export default async function userConfigRoute(fastify: FastifyInstance) {
  fastify.get('/user-config', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKey = (request.query as any).api_key;
    if (!apiKey) {
      return reply.status(400).send({ error: 'Missing api_key query parameter' });
    }
    try {
      const config = await getUserConfigByApiKey(fastify, apiKey);
      // Add real usage counts
      let totalUsage = null;
      let monthlyUsage = null;
      try {
        totalUsage = await (await import('../db')).getTransactionCountByUser(fastify, config.dbUserId);
      } catch (e) {
        fastify.log.warn('Failed to fetch total usage: ' + ((e as any)?.message || String(e)));
      }
      try {
        monthlyUsage = await (await import('../db')).getTransactionCountByUserThisMonth(fastify, config.dbUserId);
      } catch (e) {
        fastify.log.warn('Failed to fetch monthly usage: ' + ((e as any)?.message || String(e)));
      }
      // Convert Decimal fields to string for JSON serialization
      let licenseKeyDetailsSerialized = undefined;
      if (config.licenseKeyDetails) {
        licenseKeyDetailsSerialized = {
          ...config.licenseKeyDetails,
          expiresAt: config.licenseKeyDetails.expiresAt instanceof Date
            ? config.licenseKeyDetails.expiresAt.toISOString()
            : config.licenseKeyDetails.expiresAt,
        };
      }
      const result = {
        ...config,
        transactionFee: config.transactionFee.toString(),
        totalUsage,
        monthlyUsage,
        licenseKeyDetails: licenseKeyDetailsSerialized,
      };
      return reply.send(result);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(404).send({ error: err.message || 'User config not found' });
    }
  });

  // Add POST endpoint for updating user config
  fastify.post('/user-config', async (request: FastifyRequest, reply: FastifyReply) => {
    const { api_key, ...updates } = request.body as any;
    if (!api_key) {
      return reply.status(400).send({ error: 'Missing api_key in request body' });
    }
    try {
      await updateUserConfigByApiKey(fastify, api_key, updates);
      // Return updated config
      const config = await getUserConfigByApiKey(fastify, api_key);
      let licenseKeyDetailsSerialized = undefined;
      if (config.licenseKeyDetails) {
        licenseKeyDetailsSerialized = {
          ...config.licenseKeyDetails,
          expiresAt: config.licenseKeyDetails.expiresAt instanceof Date
            ? config.licenseKeyDetails.expiresAt.toISOString()
            : config.licenseKeyDetails.expiresAt,
        };
      }
      const result = {
        ...config,
        transactionFee: config.transactionFee.toString(),
        licenseKeyDetails: licenseKeyDetailsSerialized,
      };
      return reply.send(result);
    } catch (err: any) {
      fastify.log.error(err);
      return reply.status(400).send({ error: err.message || 'Failed to update user config' });
    }
  });
} 