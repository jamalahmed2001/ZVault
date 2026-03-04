import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

export default async function healthRoute(fastify: FastifyInstance) {
  fastify.get('/health', async (_request: FastifyRequest, reply: FastifyReply) => {
    const checks: Record<string, string> = { api: 'ok' };
    let healthy = true;

    try {
      const client = await fastify.pg.connect();
      const { rows } = await client.query('SELECT current_database(), current_timestamp');
      checks.database = `ok (${rows[0].current_database})`;
      client.release();
    } catch (err: any) {
      checks.database = `error: ${err.message}`;
      healthy = false;
    }

    return reply.status(healthy ? 200 : 503).send(checks);
  });
}
