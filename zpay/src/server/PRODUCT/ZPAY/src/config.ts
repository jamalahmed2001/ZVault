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
    sharedBaseDir: path.resolve(process.env.SHARED_BASE_DIR || './shared'), // Ensure absolute path
    cmcApiKey: process.env.CMC_API_KEY, // Optional
    logLevel: (process.env.LOG_LEVEL || 'info') as LogLevel,
    apiPort: parseInt(process.env.API_PORT || '5001', 10),
    host: process.env.HOST || '0.0.0.0',
    decimalPrecision: 20, // Precision for Decimal calculations
    zecQuantizer: '0.00000001', // 8 decimal places for ZEC
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
