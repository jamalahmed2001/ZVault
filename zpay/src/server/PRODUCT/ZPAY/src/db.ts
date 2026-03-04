import { FastifyInstance } from 'fastify';
import { PoolClient, QueryResult } from 'pg';
import Decimal from 'decimal.js';
import { UserConfig, TransactionRecord } from './types';
import { quantizeDecimal, generateCuid } from './utils';
import { config } from './config';
import { NotFoundError, InternalServerError, UnprocessableEntityError, UnauthorizedError } from './errors';

export async function setupDb(fastify: FastifyInstance) {
    try {
        await fastify.register(import('@fastify/postgres'), {
            connectionString: config.databaseUrl,
            
            // Other pool options if needed (e.g., max, idleTimeoutMillis)
        });
        fastify.log.info('Database connection pool initialized.');

        // Test connection
        const client = await fastify.pg.connect();
        const { rows } = await client.query('SELECT current_database()');
        fastify.log.info(`Successfully connected to PostgreSQL DB: ${rows[0].current_database}`);
        client.release();
    } catch (err) {
        fastify.log.error(`Failed to connect to database: ${err}`);
        // Optionally exit if DB connection is critical
        // process.exit(1);
        throw new InternalServerError('Database connection failed');
    }
}

// Type guard for UserConfig raw query result
function isRawUserConfig(row: any): row is {
    dbUserId: string;
    apiKeyId: string;
    transactionFee: string | number | null; // Comes from DB as string or number (potentially)
    zcashAddress: string;
    webhookUrl: string | null;
    webhookSecret: string | null;
    // limit: number | null; // Remove from type guard, as it may not exist in DB
} {
    return row &&
        typeof row.dbUserId === 'string' &&
        typeof row.apiKeyId === 'string' &&
        (row.transactionFee === null || typeof row.transactionFee === 'string' || typeof row.transactionFee === 'number') &&
        typeof row.zcashAddress === 'string';
        // webhookUrl and webhookSecret can be null
}


export async function getUserConfigByApiKey(fastify: FastifyInstance, apiKey: string): Promise<UserConfig & { licenseKeyDetails?: { accessToken: string, expiresAt: Date } | null }> {
    if (!apiKey) {
        fastify.log.warn("API key lookup attempted with empty key.");
        throw new UnauthorizedError('API key cannot be empty.');
    }

    const sql = `
        SELECT
            u.id as "dbUserId",
            ak.id as "apiKeyId",
            ak."transactionFee",
            u."zcashAddress",
            wc.url as "webhookUrl",
            wc.secret as "webhookSecret"
        FROM
            "ApiKey" ak
        JOIN
            "User" u ON ak."userId" = u.id
        LEFT JOIN
            "WebhookConfig" wc ON u.id = wc."userId"
        WHERE
            ak.key = $1
            AND ak."isActive" = TRUE;
    `;

    let client: PoolClient | null = null;
    try {
        client = await fastify.pg.connect();
        const { rows }: QueryResult = await client.query(sql, [apiKey]);

        if (rows.length === 0) {
            fastify.log.warn(`API key not found or inactive: ...${apiKey.slice(-4)}`);
            throw new UnauthorizedError('Invalid or inactive API key.');
        }

        const row = rows[0];

        if (!isRawUserConfig(row)) {
             fastify.log.error(`API key valid but database returned unexpected data structure for key ending ...${apiKey.slice(-4)}`, row);
             throw new InternalServerError('Invalid data structure received from database for user config.');
        }

        // Validate and convert transactionFee
        let transactionFeeDecimal: Decimal;
        const feeValue = row.transactionFee;

        if (feeValue === null) {
             fastify.log.error(`API key valid but transactionFee is NULL for ApiKey ID ${row.apiKeyId}, key ending ...${apiKey.slice(-4)}`);
             throw new UnprocessableEntityError('API key configuration is missing transaction fee.');
        }

        try {
            transactionFeeDecimal = new Decimal(feeValue);
            if (transactionFeeDecimal.isNaN()) {
                throw new Error('Fee is NaN');
            }
            if (transactionFeeDecimal.isNegative()) {
                fastify.log.error(`API key valid but transactionFee is negative (${transactionFeeDecimal}) for ApiKey ID ${row.apiKeyId}, key ending ...${apiKey.slice(-4)}`);
                throw new UnprocessableEntityError('Invalid transaction fee configuration (negative value).');
            }
            // Optional: Add upper bound check
             if (transactionFeeDecimal.greaterThan(100)) {
                 fastify.log.warn(`TransactionFee (${transactionFeeDecimal}%) seems high for ApiKey ID ${row.apiKeyId}, key ending ...${apiKey.slice(-4)}`);
             }

        } catch (e) {
            fastify.log.error(`API key valid but transactionFee has invalid format or value ('${feeValue}', type: ${typeof feeValue}) for ApiKey ID ${row.apiKeyId}, key ending ...${apiKey.slice(-4)}`);
            throw new UnprocessableEntityError('Invalid transaction fee configuration format.');
        }

        // Check other essential data
        if (!row.dbUserId || !row.apiKeyId || !row.zcashAddress) {
             const missing: string[] = [];
             if (!row.dbUserId) missing.push("User.id");
             if (!row.apiKeyId) missing.push("ApiKey.id");
             if (!row.zcashAddress) missing.push("User.zcashAddress");
             fastify.log.error(`API key valid but associated data is missing: ${missing.join(', ')} for key ending ...${apiKey.slice(-4)}`);
             throw new UnprocessableEntityError(`Associated user configuration is incomplete: Missing ${missing.join(', ')}.`);
        }

        fastify.log.info(`Found config for API key ending ...${apiKey.slice(-4)} (User DB ID: ${row.dbUserId}, ApiKey ID: ${row.apiKeyId}, Fee %: ${transactionFeeDecimal.toString()})`);

        // Fetch license key details if available
        let licenseKeyDetails = null;
        try {
            licenseKeyDetails = await getValidLicenseKey(fastify, apiKey);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            fastify.log.warn(`Could not fetch license key details for API key ...${apiKey.slice(-4)}: ${msg}`);
        }

        return {
            dbUserId: row.dbUserId,
            apiKeyId: row.apiKeyId,
            transactionFee: transactionFeeDecimal, // Percentage as Decimal
            zcashAddress: row.zcashAddress,
            webhookUrl: row.webhookUrl ?? null,
            webhookSecret: row.webhookSecret ?? null,
            limit: 1000, // Default value, or fetch from DB if you add the column
            apiKey: apiKey,
            licenseKeyDetails,
        };

    } catch (err: any) {
         // Re-throw specific app errors that might have been thrown during validation or connection
         if (err instanceof UnauthorizedError || err instanceof UnprocessableEntityError || err instanceof InternalServerError) {
             throw err;
         }
         // Log any other unexpected database errors
        fastify.log.error(`Database error during API key lookup: ${err.message || err}`, { apiKeyEnding: apiKey.slice(-4), stack: err.stack });
        throw new InternalServerError(`Database error during API key validation: ${err.message || err}`);
    } finally {
        client?.release();
    }
}

/**
 * Update user config fields (zcashAddress, webhookUrl, webhookSecret, transactionFee) for the user identified by apiKey.
 * Only updates fields provided in the update object.
 */
export async function updateUserConfigByApiKey(
  fastify: FastifyInstance,
  apiKey: string,
  updates: Partial<{
    zcashAddress: string;
    webhookUrl: string | null;
    webhookSecret: string | null;
    transactionFee: string | number;
  }>
): Promise<void> {
  if (!apiKey) throw new UnauthorizedError('API key cannot be empty.');
  if (!updates || Object.keys(updates).length === 0) return;

  // Get user IDs
  const sqlUser = `
    SELECT u.id as "dbUserId", ak.id as "apiKeyId"
    FROM "ApiKey" ak
    JOIN "User" u ON ak."userId" = u.id
    WHERE ak.key = $1 AND ak."isActive" = TRUE;
  `;
  let client: PoolClient | null = null;
  try {
    client = await fastify.pg.connect();
    const { rows } = await client.query(sqlUser, [apiKey]);
    if (!rows.length) throw new UnauthorizedError('Invalid or inactive API key.');
    const { dbUserId, apiKeyId } = rows[0];

    // Update User table fields
    if (updates.zcashAddress) {
      await client.query('UPDATE "User" SET "zcashAddress" = $1 WHERE id = $2', [updates.zcashAddress, dbUserId]);
    }
    // Update WebhookConfig table fields
    const cuid = generateCuid();
    await client.query(`
      INSERT INTO "WebhookConfig" (id, "userId", url, secret, "updatedAt")
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT ("userId") DO UPDATE SET
        url = COALESCE(EXCLUDED.url, "WebhookConfig".url),
        secret = COALESCE(EXCLUDED.secret, "WebhookConfig".secret),
        "updatedAt" = NOW()
    `, [cuid, dbUserId, updates.webhookUrl ?? null, updates.webhookSecret ?? null]);
    // Update ApiKey table fields
    if (typeof updates.transactionFee !== 'undefined') {
      await client.query('UPDATE "ApiKey" SET "transactionFee" = $1 WHERE id = $2', [updates.transactionFee, apiKeyId]);
    }
  } catch (err: any) {
    fastify.log.error(err, 'Failed to update user config');
    throw new InternalServerError('Failed to update user config');
  } finally {
    client?.release();
  }
}

export async function insertTransactionRecord(
    fastify: FastifyInstance,
    dbUserId: string,
    invoiceId: string,
    clientUserId: string,
    amountZec: Decimal,
    feeZec: Decimal,
    apiKeyId: string | null
): Promise<string> {
    const newTransactionId = generateCuid();
    const currentTimeUtc = new Date();

    // Define quantization precision
    const quantizerZec = new Decimal(config.zecQuantizer);
    const amountQuantized = quantizeDecimal(amountZec, quantizerZec);
    const feeQuantized = quantizeDecimal(feeZec, quantizerZec); // Quantize fee too

    fastify.log.info(`ℹ️ (insertTransactionRecord) Inserting Transaction ID: ${newTransactionId}`);
    fastify.log.info(`   DB User ID: ${dbUserId}, Invoice ID: ${invoiceId}, Client User ID: ${clientUserId}`);
    fastify.log.info(`   Amount (ZEC): ${amountQuantized}, Fee (ZEC): ${feeQuantized}`);
    fastify.log.info(`   Timestamp (UTC): ${currentTimeUtc.toISOString()}`);
    fastify.log.info(`   ApiKey ID: ${apiKeyId}`);

    const sql = `
        INSERT INTO "Transaction" (
            id, amount, status, fee, "invoiceId", "clientUserId", "txHashes", "addressesUsed", "userId", "createdAt", "updatedAt", "apiKeyId"
        ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
        ) RETURNING id;
    `;
    const params = [
        newTransactionId,
        amountQuantized.toString(), // Store as string or numeric in DB? Assuming numeric/decimal type. Use toString() if text.
        'PENDING', // Initial status
        feeQuantized.toString(), // Store fee as string or numeric
        String(invoiceId),
        String(clientUserId),
        [], // GOOD: empty JS array for text[] or int[] columns
        [], // GOOD: empty JS array for text[] or int[] columns
        String(dbUserId),
        currentTimeUtc,
        currentTimeUtc,
        apiKeyId // Can be null
    ];

    let client: PoolClient | null = null;
    try {
        client = await fastify.pg.connect();
        const { rows } = await client.query(sql, params);
        fastify.log.info(`✅ (insertTransactionRecord) Successfully inserted transaction record ID: ${rows[0].id} into database.`);
        return rows[0].id; // Return the newly created ID
    } catch (err: any) {
        const sqlstate = err.code; // pg error code
        fastify.log.error(`❌ ERROR (insertTransactionRecord): Database error (Code: ${sqlstate}) during transaction insert: ${err.message || err}`, { stack: err.stack });
        // Handle specific errors like unique constraints if needed
        throw new InternalServerError('Failed to create transaction record in database.');
    } finally {
        client?.release();
    }
}


export async function updateTransactionSharedData(
    fastify: FastifyInstance,
    dbUserId: string,
    clientUserId: string,
    invoiceId: string,
    addresses: string[],
    txHashes: string[],
    statusToUpdate?: string
): Promise<boolean> {
    const currentTimeUtc = new Date();
    fastify.log.info(`Attempting to update DB for UID: ${clientUserId}, IID: ${invoiceId} (User: ${dbUserId})`);
    fastify.log.debug(`  Addresses: ${JSON.stringify(addresses)}`);
    fastify.log.debug(`  TX Hashes: ${JSON.stringify(txHashes)}`);

    const sql = `
        UPDATE "Transaction"
        SET
            "addressesUsed" = $1,
            "txHashes" = $2,
            "updatedAt" = $3,
            "completedAt" = $4,
            "status" = $5
        WHERE
            "userId" = $6
            AND "clientUserId" = $7
            AND "invoiceId" = $8
            -- Maybe add AND status = 'PENDING' or status = 'PROCESSING'?
        RETURNING id; -- Return ID to check if update occurred
    `;
    const params = [
        addresses,
        txHashes,
        currentTimeUtc,
        currentTimeUtc,
        statusToUpdate,
        dbUserId,
        String(clientUserId),
        String(invoiceId)
    ];

    let client: PoolClient | null = null;
    try {
        client = await fastify.pg.connect();
        const { rowCount } = await client.query(sql, params); // rowCount indicates affected rows

        if (rowCount !== null && rowCount > 0) {
            fastify.log.info(`✅ Successfully updated ${rowCount} transaction record(s) in DB for UID: ${clientUserId}, IID: ${invoiceId}.`);
            return true;
        } else {
            fastify.log.warn(`⚠️ No matching transaction record found in DB to update for UID: ${clientUserId}, IID: ${invoiceId} (User: ${dbUserId}).`);
            // This isn't necessarily an error, the record might not exist or match criteria
            return false; // Indicate no record was updated
        }
    } catch (err: any) {
        const sqlstate = err.code;
        fastify.log.error(`❌ ERROR: Database error (Code: ${sqlstate}) during transaction update for UID: ${clientUserId}, IID: ${invoiceId}: ${err.message || err}`, { stack: err.stack });
        throw new InternalServerError(`Database error during transaction update.`);
    } finally {
        client?.release();
    }
}

// Basic User ID lookup (used in /shared-data if full config fails)
export async function getBasicUserIdByApiKey(fastify: FastifyInstance, apiKey: string): Promise<string | null> {
     const sql = `
        SELECT u.id as "dbUserId"
        FROM "ApiKey" ak
        JOIN "User" u ON ak."userId" = u.id
        WHERE ak.key = $1 AND ak."isActive" = TRUE;
     `;
     let client: PoolClient | null = null;
     try {
        client = await fastify.pg.connect();
        const { rows } = await client.query(sql, [apiKey]);
        if (rows.length > 0) {
            return rows[0].dbUserId;
        }
        return null;
     } catch (err: any) {
         fastify.log.error(`Database error during basic user ID lookup: ${err.message || err}`, { apiKeyEnding: apiKey.slice(-4) });
         // Don't throw InternalServerError here, let the caller decide how to handle null
         return null;
     } finally {
         client?.release();
     }
}

// Fetch a transaction by dbUserId, clientUserId, and invoiceId
export async function getTransactionByUserInvoice(
  fastify: FastifyInstance,
  dbUserId: string,
  clientUserId: string,
  invoiceId: string
): Promise<{ amount: string, addressesUsed: string[] } | null> {
  const sql = `
    SELECT amount, "addressesUsed" FROM "Transaction"
    WHERE "userId" = $1 AND "clientUserId" = $2 AND "invoiceId" = $3
    LIMIT 1;
  `;
  let client: PoolClient | null = null;
  try {
    client = await fastify.pg.connect();
    const { rows } = await client.query(sql, [dbUserId, String(clientUserId), String(invoiceId)]);
    if (!rows.length) return null;
    return {
      amount: rows[0].amount,
      addressesUsed: rows[0].addressesUsed || [],
    };
  } catch (err: any) {
    fastify.log.error(`Error fetching transaction for user/invoice: ${err.message}`);
    return null;
  } finally {
    client?.release();
  }
}

// Returns the number of transactions for a specific user
export async function getTransactionCountByUser(fastify: FastifyInstance, dbUserId: string): Promise<number> {
  const sql = 'SELECT COUNT(*) FROM "Transaction" WHERE "userId" = $1';
  let client: PoolClient | null = null;
  try {
    client = await fastify.pg.connect();
    const { rows } = await client.query(sql, [dbUserId]);
    return parseInt(rows[0].count, 10);
  } catch (err: any) {
    fastify.log.error(`Error counting transactions for user: ${err.message}`);
    throw new InternalServerError('Failed to count user transactions');
  } finally {
    client?.release();
  }
}

// Returns the number of transactions for a specific user in the current calendar month
export async function getTransactionCountByUserThisMonth(fastify: FastifyInstance, dbUserId: string): Promise<number> {
  const sql = `SELECT COUNT(*) FROM "Transaction" WHERE "userId" = $1 AND date_trunc('month', "createdAt") = date_trunc('month', CURRENT_DATE)`;
  let client: PoolClient | null = null;
  try {
    client = await fastify.pg.connect();
    const { rows } = await client.query(sql, [dbUserId]);
    return parseInt(rows[0].count, 10);
  } catch (err: any) {
    fastify.log.error(`Error counting transactions for user this month: ${err.message}`);
    throw new InternalServerError('Failed to count user transactions for this month');
  } finally {
    client?.release();
  }
}

// --- License Key Helpers ---

/**
 * Get a valid license key (1h) for a key string.
 * Returns null if not found, expired, or inactive.
 */
export async function getValidLicenseKey(fastify: FastifyInstance, key: string): Promise<{ id: string, accessToken: string, expiresAt: Date } | null> {
    const sql = `SELECT id, "accessToken", "expiresAt" FROM "LicenseKey" WHERE key = $1 AND "expiresAt" > NOW() AND "isActive" = TRUE LIMIT 1;`;
    let client: PoolClient | null = null;
    try {
        client = await fastify.pg.connect();
        const { rows } = await client.query(sql, [key]);
        if (!rows.length) return null;
        return { id: rows[0].id, accessToken: rows[0].accessToken, expiresAt: rows[0].expiresAt };
    } catch (err: any) {
        fastify.log.error(`Error fetching license key: ${err.message}`);
        return null;
    } finally {
        client?.release();
    }
}

/**
 * Upsert a license key (1h) for a key string.
 */
export async function upsertLicenseKey(fastify: FastifyInstance, key: string, accessToken: string, expiresAt: Date): Promise<void> {
    const sql = `
        INSERT INTO "LicenseKey" (key, "accessToken", "expiresAt")
        VALUES ($1, $2, $3)
        ON CONFLICT (key) DO UPDATE SET "accessToken" = EXCLUDED."accessToken", "expiresAt" = EXCLUDED."expiresAt", "isActive" = TRUE;
    `;
    let client: PoolClient | null = null;
    try {
        if (!(expiresAt instanceof Date) || isNaN(expiresAt.getTime())) {
            fastify.log.error(`Invalid expiresAt value for license key: ${expiresAt} (type: ${typeof expiresAt})`);
            throw new InternalServerError('Invalid expiresAt value for license key');
        }
        fastify.log.info(`Upserting license key: ${key}, expiresAt: ${expiresAt.toISOString()}`);
        client = await fastify.pg.connect();
        await client.query(sql, [key, accessToken, expiresAt]);
    } catch (err: any) {
        fastify.log.error(`Error upserting license key: ${err.message}`);
        throw new InternalServerError('Failed to upsert license key');
    } finally {
        client?.release();
    }
}
