-- Drop type and tables for idempotency (dev only, remove in prod!)
DROP TYPE IF EXISTS public."TransactionStatus" CASCADE;
DROP TABLE IF EXISTS "WebhookConfig" CASCADE;
DROP TABLE IF EXISTS "Transaction" CASCADE;
DROP TABLE IF EXISTS "LicenseKey" CASCADE;
DROP TABLE IF EXISTS "ApiKey" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- 1. Add TransactionStatus enum type
CREATE TYPE public."TransactionStatus" AS ENUM ('PENDING', 'RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED');

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Table
CREATE TABLE IF NOT EXISTS "User" (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT,
    password TEXT,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "isAdmin" boolean DEFAULT false NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "zcashAddress" TEXT
);

-- ApiKey Table
CREATE TABLE IF NOT EXISTS "ApiKey" (
    id TEXT PRIMARY KEY,
    key TEXT NOT NULL,
    name TEXT,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" TEXT NOT NULL,
    "transactionFee" numeric(5,2) DEFAULT 1 NOT NULL
);

-- WebhookConfig Table
CREATE TABLE IF NOT EXISTS "WebhookConfig" (
    id character varying(191) DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    url character varying(191) NOT NULL,
    secret character varying(191) NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" character varying(191) NOT NULL,
    "apiKeyId" character varying(191)
);

-- Transaction Table
CREATE TABLE IF NOT EXISTS "Transaction" (
    id text PRIMARY KEY,
    amount numeric(12,4) NOT NULL,
    status public."TransactionStatus" DEFAULT 'PENDING'::public."TransactionStatus" NOT NULL,
    fee numeric(12,4),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "completedAt" timestamp(3) without time zone,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text NOT NULL,
    "addressesUsed" text[],
    "apiKeyId" text,
    "clientUserId" text,
    "invoiceId" text,
    "txHashes" text[]
);

-- LicenseKey Table
CREATE TABLE IF NOT EXISTS "LicenseKey" (
    id character varying(1024) DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    key character varying(1024) NOT NULL UNIQUE,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "accessToken" text
);

-- Constraints and Indexes (no IF NOT EXISTS for constraints)
ALTER TABLE "ApiKey"
    ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_key_key" ON "ApiKey" USING btree (key);

ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"(id) ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "Transaction"
    ADD CONSTRAINT "Transaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS "Transaction_apiKeyId_idx" ON "Transaction" USING btree ("apiKeyId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction" USING btree ("createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_invoiceId_idx" ON "Transaction" USING btree ("invoiceId");
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction" USING btree (status);
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction" USING btree ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User" USING btree (username);

ALTER TABLE "WebhookConfig"
    ADD CONSTRAINT "WebhookConfig_userId_key" UNIQUE ("userId");
ALTER TABLE "WebhookConfig"
    ADD CONSTRAINT "WebhookConfig_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"(id) ON DELETE SET NULL;
ALTER TABLE "WebhookConfig"
    ADD CONSTRAINT "WebhookConfig_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;

-- (Leave this out if you want to always use the script for inserts)
WITH new_user AS (
    INSERT INTO "User" (id, "zcashAddress")
    VALUES ('userid1', 'test')
    RETURNING id
)
INSERT INTO "ApiKey" (id, key, "userId", "transactionFee", "isActive", "updatedAt")
VALUES ('apikey1', 'zv_test_1dmRO_7pFFnCAXGfmqKSnnWdGWbDZkaa', (SELECT id FROM new_user), 2.5, TRUE, CURRENT_TIMESTAMP);