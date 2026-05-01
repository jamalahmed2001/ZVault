import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getUserConfigByApiKey } from '../db';

export default async function transactionsRoute(fastify: FastifyInstance) {
  fastify.get('/transactions', async (request: FastifyRequest, reply: FastifyReply) => {
    const client = await fastify.pg.connect();
    try {
      const q = (request.query || {}) as Record<string, string | undefined>;

      // Auth: require a valid api_key on every call. The route used to be
      // wide-open which leaked the full transaction history to anyone who
      // knew the URL. Closes the T0 audit gap.
      const apiKey = q.api_key
        || (request.headers.authorization?.startsWith('Bearer ')
              ? request.headers.authorization.slice(7) : '');
      let merchant;
      try {
        merchant = await getUserConfigByApiKey(fastify, apiKey);
      } catch {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Direct lookup by invoice_id — used by AnswerMePro's verifyAndActivate
      // (and any third-party merchant doing the same). Returns
      // { transaction: <row|null> } (singular shape). Scoped to the
      // calling merchant's api key id so one tenant cannot read another's
      // invoices.
      if (q.invoice_id) {
        const { rows } = await client.query(
          `SELECT * FROM "Transaction"
            WHERE "invoiceId" = $1
              AND "apiKeyId" = $2
            LIMIT 1`,
          [q.invoice_id, merchant.apiKeyId],
        );
        return reply.send({ transaction: rows[0] ?? null });
      }

      // List query — also scoped to the calling merchant.
      const includeOld = q.include_old === 'true';
      const baseFilter = includeOld
        ? `"apiKeyId" = $1`
        : `"apiKeyId" = $1 AND NOT (
              "createdAt" < NOW() - INTERVAL '24 hours'
              AND ("txHashes" IS NULL OR array_length("txHashes", 1) = 0)
              AND ("addressesUsed" IS NULL OR array_length("addressesUsed", 1) = 0)
              AND "completedAt" IS NULL
            )`;
      const params: any[] = [merchant.apiKeyId];
      const { rows: transactions } = await client.query(
        `SELECT * FROM "Transaction" WHERE ${baseFilter} ORDER BY "createdAt" DESC`,
        params,
      );

      // Stats also scoped to merchant.
      const statSqls = (clause: string) =>
        `SELECT COUNT(*) AS count FROM "Transaction" WHERE "apiKeyId" = $1 ${clause}`;
      const [allTimeResult, todayResult, thisWeekResult, thisMonthResult] = await Promise.all([
        client.query(statSqls(''), [merchant.apiKeyId]),
        client.query(statSqls(`AND "createdAt" >= date_trunc('day', CURRENT_TIMESTAMP)`), [merchant.apiKeyId]),
        client.query(statSqls(`AND "createdAt" >= date_trunc('week', CURRENT_TIMESTAMP)`), [merchant.apiKeyId]),
        client.query(statSqls(`AND "createdAt" >= date_trunc('month', CURRENT_TIMESTAMP)`), [merchant.apiKeyId]),
      ]);

      const statistics = {
        allTime: parseInt(allTimeResult.rows[0].count, 10) || 0,
        thisMonth: parseInt(thisMonthResult.rows[0].count, 10) || 0,
        thisWeek: parseInt(thisWeekResult.rows[0].count, 10) || 0,
        today: parseInt(todayResult.rows[0].count, 10) || 0,
      };

      return reply.send({ statistics, transactions });
    } catch (err) {
      fastify.log.error(err);
      return reply.status(500).send({ error: 'Failed to fetch transactions' });
    } finally {
      client.release();
    }
  });
}
