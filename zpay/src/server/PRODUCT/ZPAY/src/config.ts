import dotenv from 'dotenv';
import path from 'path';
import { LogLevel } from 'fastify';

dotenv.config(); // Load .env file

const requiredEnv = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        console.error(`Error: Missing required environment variable: ${key}`);
        process.exit(1);
    }
    return value;
};

export const config = {
    databaseUrl: requiredEnv('DATABASE_URL'),
    dockerImageName: requiredEnv('DOCKER_IMAGE_NAME'),
    sharedBaseDir: path.resolve(process.env.SHARED_BASE_DIR || './shared'),
    cmcApiKey: process.env.CMC_API_KEY,
    logLevel: (process.env.LOG_LEVEL || 'info') as LogLevel,
    apiPort: parseInt(process.env.API_PORT || '5001', 10),
    host: process.env.HOST || '0.0.0.0',
    decimalPrecision: 20,
    zecQuantizer: '0.00000001',

    // Host zingo-cli config (for /fund endpoint)
    zingoBinaryPath: process.env.ZINGO_CLI_PATH || 'zingo-cli',
    zingoDataDir: path.resolve(process.env.ZINGO_DATA_DIR || './zingo-wallet'),
    lightwalletdServer: process.env.LIGHTWALLETD_SERVER || undefined,

    // CORS: comma-separated allowlist of origins. Default locks to the
    // production AnswerMePro origins so the public Funnel can't be hit
    // from arbitrary browsers. Set CORS_ALLOWED_ORIGINS=* explicitly
    // only for dev/admin testing.
    corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS
        || 'https://answerme.pro,https://www.answerme.pro,https://admin.answerme.pro'
    ).split(',').map(s => s.trim()).filter(Boolean),

    // Seed escrow public key for encrypting per-invoice wallet seeds.
    // Format: age recipient (`age1...`). Master private key MUST live
    // off-host (Exodus / 1Password / cold paper). Optional — if unset,
    // workflow runs without escrow (legacy behaviour, recovery impossible).
    seedEscrowPubkey: process.env.ZVAULT_SEED_ESCROW_PUBKEY || undefined,

    // Webhook signing secret (HMAC). Optional — if unset, webhook signing
    // is skipped and the merchant should fall back to bearer-only auth.
    // Both sides must share this secret.
    webhookSigningSecret: process.env.ZVAULT_WEBHOOK_SIGNING_SECRET || undefined,
};

// Ensure shared base directory exists on startup
import fs from 'fs';
try {
    if (!fs.existsSync(config.sharedBaseDir)) {
        // Setting mode 0o777 might be too permissive for production
        fs.mkdirSync(config.sharedBaseDir, { recursive: true, mode: 0o777 });
        console.log(`Created base shared directory: ${config.sharedBaseDir}`);
    }
} catch (error) {
    console.error(`CRITICAL: Failed to create base shared directory '${config.sharedBaseDir}': ${error}. File operations will likely fail.`);
    // Optionally exit if this directory is absolutely required
    // process.exit(1);
}
