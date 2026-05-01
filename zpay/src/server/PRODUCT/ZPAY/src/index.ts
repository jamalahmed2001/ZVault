import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from './config';
import { setupDb } from './db';
import { AppError, InternalServerError, NotFoundError } from './errors';
import { resumePendingWorkflows, shutdownWorkflows } from './orchestration/workflow-engine';

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
        // Register CORS
        await server.register(import('@fastify/cors'), {
             origin: "*", // Configure allowed origins properly for production
             methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        });
        server.log.info('CORS enabled');

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

        // Graceful Shutdown Handling
        const signals = ['SIGINT', 'SIGTERM'];
        signals.forEach((signal) => {
            process.on(signal, async () => {
                server.log.info(`Received ${signal}, shutting down gracefully...`);
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
