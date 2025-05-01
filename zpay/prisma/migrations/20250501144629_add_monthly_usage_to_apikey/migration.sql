/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_createdById_fkey";

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "monthlyUsage" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "Post";
