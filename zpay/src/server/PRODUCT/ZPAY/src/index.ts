import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from './config';
import { setupDb } from './db';
import { AppError, InternalServerError, NotFoundError } from './errors';
import { resumePendingWorkflows, retryUndeliveredWebhooks, shutdownWorkflows } from './orchestration/workflow-engine';

// Import route handlers
import createRoute from './routes/create';
import addressRoute from './routes/address';
import sharedDataRoute from './routes/sharedData';
import transactionsRoute from './routes/transactions';
import userConfigRoute from './routes/userConfig';
import updateRoute from './routes/update';
import payoutRoute from './routes/payout';
import fundRoute from './routes/fund';
import healthRoute from './routes/health';

const server: FastifyInstance = Fastify({
    logger: {
        level: config.logLevel,
        // Use pino-pretty in development for nice logs
        ...(process.env.NODE_ENV !== 'production' && {
            transport: {
                target: 'pino-pretty',
                options: {
                    translateTime: 'HH:MM:ss Z',
                    ignore: 'pid,hostname',
                },
            },
        }),
    },
});

async function main() {
    try {
        // Register CORS — locked down to a configurable allowlist.
        // Server-to-server callers (AnswerMePro Vercel functions) don't
        // send Origin headers, so they're allowed transparently. Browsers
        // get a strict origin check.
        const allowed = config.corsAllowedOrigins;
        const allowAll = allowed.length === 1 && allowed[0] === '*';
        await server.register(import('@fastify/cors'), {
             origin: (origin, cb) => {
                 if (!origin) return cb(null, true);   // server-to-server / curl
                 if (allowAll) return cb(null, true);
                 if (allowed.includes(origin)) return cb(null, true);
                 return cb(null, false);
             },
             methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        });
        server.log.info(`CORS enabled (origins=${allowAll ? '*' : allowed.join(',')})`);

        // Setup Database Connection Pool
        await setupDb(server); // setupDb logs success/failure

        // Register Routes
        await server.register(createRoute);
        await server.register(addressRoute);
        await server.register(sharedDataRoute);
        await server.register(transactionsRoute);
        await server.register(userConfigRoute);
        await server.register(updateRoute);
        await server.register(payoutRoute);
        await server.register(fundRoute);
        await server.register(healthRoute);
        server.log.info('Routes registered');

        // Global Error Handler
        server.setErrorHandler((error: Error, request: FastifyRequest, reply: FastifyReply) => {
            request.log.error(error); // Log the full error

            if (error instanceof AppError) {
                // Handle known application errors
                reply.status(error.statusCode).send({
                    error: {
                        code: error.errorCode,
                        message: error.message,
                    },
                });
            } else if ((error as any).validation) {
                // Handle Fastify validation errors (if using schema validation)
                 reply.status(400).send({
                     error: {
                         code: 'VALIDATION_ERROR',
                         message: 'Request validation failed',
                         details: (error as any).validation,
                     }
                 });
            }
             else {
                // Handle unknown errors
                reply.status(500).send({
                    error: {
                        code: 'INTERNAL_SERVER_ERROR',
                        message: 'An unexpected internal server error occurred.',
                    },
                });
            }
        });

         // Not Found Handler
         server.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
             const { url, method } = request;
             request.log.warn(`Route not found: ${method} ${url}`);
             reply.status(404).send({
                 error: {
                     code: 'NOT_FOUND',
                     message: `Route ${method} ${url} not found`,
                 },
             });
         });


        // Start Listening
        await server.listen({ port: config.apiPort, host: config.host });

        // Resume any workflows that were in-flight when the server last stopped
        resumePendingWorkflows(server).catch(err => {
            server.log.error(`Failed to resume pending workflows: ${err.message}`);
        });

        // Periodic recovery for terminal-but-undelivered webhooks. Runs forever
        // every 60s; each pass picks up at most 50 transactions and re-POSTs.
        const WEBHOOK_RETRY_INTERVAL_MS = 60_000;
        const webhookRetryTimer = setInterval(() => {
            retryUndeliveredWebhooks(server, server.log)
                .then(({ retried, delivered }) => {
                    if (retried > 0) {
                        server.log.info(`Webhook retry sweep: retried=${retried} delivered=${delivered}`);
                    }
                })
                .catch(err => server.log.warn(`Webhook retry sweep failed: ${err.message}`));
        }, WEBHOOK_RETRY_INTERVAL_MS);

        // Graceful Shutdown Handling
        const signals = ['SIGINT', 'SIGTERM'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                server.log.info(`Received ${signal}, shutting down gracefully...`);
                clearInterval(webhookRetryTimer);
                shutdownWorkflows();
                await server.close();
                server.log.info('Server shut down complete.');
                process.exit(0);
            });
        });

    } catch (err) {
        server.log.fatal(err, 'Server failed to start');
        process.exit(1);
    }
}

main();
