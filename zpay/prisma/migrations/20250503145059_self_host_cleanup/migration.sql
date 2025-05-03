/*
  Warnings:

  - You are about to drop the column `limit` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the column `usage` on the `ApiKey` table. All the data in the column will be lost.
  - You are about to drop the `Transaction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WebhookConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_apiKeyId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- DropForeignKey
ALTER TABLE "WebhookConfig" DROP CONSTRAINT "WebhookConfig_apiKeyId_fkey";

-- DropForeignKey
ALTER TABLE "WebhookConfig" DROP CONSTRAINT "WebhookConfig_userId_fkey";

-- AlterTable
ALTER TABLE "ApiKey" DROP COLUMN "limit",
DROP COLUMN "usage",
ADD COLUMN     "totalUsage" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "usageLimit" INTEGER NOT NULL DEFAULT 250;

-- DropTable
DROP TABLE "Transaction";

-- DropTable
DROP TABLE "WebhookConfig";

-- DropEnum
DROP TYPE "TransactionStatus";
