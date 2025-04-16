-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "transactionFee" DECIMAL(5,2) NOT NULL DEFAULT 2.5;
