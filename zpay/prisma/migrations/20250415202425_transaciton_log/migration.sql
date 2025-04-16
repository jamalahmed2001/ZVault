/*
  Warnings:

  - You are about to drop the column `geoLocation` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `ipAddress` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `memo` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `recipientAddress` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `senderAddress` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `Transaction` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Transaction_recipientAddress_idx";

-- DropIndex
DROP INDEX "Transaction_senderAddress_idx";

-- DropIndex
DROP INDEX "Transaction_txHash_key";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "geoLocation",
DROP COLUMN "ipAddress",
DROP COLUMN "memo",
DROP COLUMN "recipientAddress",
DROP COLUMN "senderAddress",
DROP COLUMN "txHash",
DROP COLUMN "userAgent",
ADD COLUMN     "addressesUsed" TEXT[],
ADD COLUMN     "apiKeyId" TEXT,
ADD COLUMN     "clientUserId" TEXT,
ADD COLUMN     "invoiceId" TEXT,
ADD COLUMN     "txHashes" TEXT[];

-- CreateIndex
CREATE INDEX "Transaction_apiKeyId_idx" ON "Transaction"("apiKeyId");

-- CreateIndex
CREATE INDEX "Transaction_invoiceId_idx" ON "Transaction"("invoiceId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "ApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;
