-- ZPAY Database Schema (idempotent — safe to re-run without data loss)

-- 1. TransactionStatus enum
DO $$ BEGIN
    CREATE TYPE public."TransactionStatus" AS ENUM ('PENDING', 'RECEIVED', 'PROCESSING', 'COMPLETED', 'FAILED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

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
    url character varying(191),
    secret character varying(191),
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

-- Constraints and Indexes (idempotent using IF NOT EXISTS / DO blocks)
DO $$ BEGIN
    ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS "ApiKey_key_key" ON "ApiKey" USING btree (key);

DO $$ BEGIN
    ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_apiKeyId_fkey"
        FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"(id) ON UPDATE CASCADE ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS "Transaction_apiKeyId_idx" ON "Transaction" USING btree ("apiKeyId");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx" ON "Transaction" USING btree ("createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_invoiceId_idx" ON "Transaction" USING btree ("invoiceId");
CREATE INDEX IF NOT EXISTS "Transaction_status_idx" ON "Transaction" USING btree (status);
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx" ON "Transaction" USING btree ("userId");

CREATE UNIQUE INDEX IF NOT EXISTS "User_email_key" ON "User" USING btree (email);
CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User" USING btree (username);

DO $$ BEGIN
    ALTER TABLE "WebhookConfig" ADD CONSTRAINT "WebhookConfig_userId_key" UNIQUE ("userId");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE "WebhookConfig" ADD CONSTRAINT "WebhookConfig_apiKeyId_fkey"
        FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
    ALTER TABLE "WebhookConfig" ADD CONSTRAINT "WebhookConfig_userId_fkey"
        FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Workflow columns on Transaction (for deterministic orchestration)
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "workflowStage" text;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "workflowData" jsonb;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "containerName" text;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "failureReason" text;

CREATE INDEX IF NOT EXISTS "Transaction_workflowStage_idx"
  ON "Transaction" USING btree ("workflowStage")
  WHERE "workflowStage" IS NOT NULL;

-- Seed default user + API key (only if not already present)
INSERT INTO "User" (id, "zcashAddress")
VALUES ('userid1', 'test')
ON CONFLICT (id) DO NOTHING;

INSERT INTO "ApiKey" (id, key, "userId", "transactionFee", "isActive", "updatedAt")
VALUES ('apikey1', 'zv_test_1dmRO_7pFFnCAXGfmqKSnnWdGWbDZkaa', 'userid1', 2.5, TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;
