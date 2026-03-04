import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function transactionsRoute(fastify: FastifyInstance) {
  fastify.get('/transactions', async (request: FastifyRequest, reply: FastifyReply) => {
    const client = await fastify.pg.connect();
    try {
      // Check for query param to include old/cancelled transactions
      const includeOld = request.query && (request.query as any).include_old === 'true';
      let sql;
      let params: any[] = [];
      if (includeOld) {
        sql = 'SELECT * FROM "Transaction" ORDER BY "createdAt" DESC';
      } else {
        sql = `SELECT * FROM "Transaction"
          WHERE NOT (
            "createdAt" < NOW() - INTERVAL '24 hours'
            AND ("txHashes" IS NULL OR array_length("txHashes", 1) = 0)
            AND ("addressesUsed" IS NULL OR array_length("addressesUsed", 1) = 0)
            AND "completedAt" IS NULL
          )
          ORDER BY "createdAt" DESC`;
      }
      const { rows: transactions } = await client.query(sql, params);

      // SQL for statistics
      const allTimeSql = 'SELECT COUNT(*) as count FROM "Transaction"';
      const todaySql = `SELECT COUNT(*) as count FROM "Transaction" WHERE "createdAt" >= date_trunc('day', CURRENT_TIMESTAMP)`;
      // PostgreSQL date_trunc('week', ...) considers Monday the first day of the week.
      const thisWeekSql = `SELECT COUNT(*) as count FROM "Transaction" WHERE "createdAt" >= date_trunc('week', CURRENT_TIMESTAMP)`;
      const thisMonthSql = `SELECT COUNT(*) as count FROM "Transaction" WHERE "createdAt" >= date_trunc('month', CURRENT_TIMESTAMP)`;

      // Execute count queries
      const [allTimeResult, todayResult, thisWeekResult, thisMonthResult] = await Promise.all([
        client.query(allTimeSql),
        client.query(todaySql),
        client.query(thisWeekSql),
        client.query(thisMonthSql),
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
