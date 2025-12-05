/*
  Warnings:

  - You are about to drop the column `logoId` on the `organizations` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_logoId_fkey";

-- DropIndex
DROP INDEX "organizations_logoId_key";

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "logoId";

-- CreateTable
CREATE TABLE "short_urls" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "targetUrl" TEXT NOT NULL,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "budgetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "short_urls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "short_urls_code_key" ON "short_urls"("code");

-- CreateIndex
CREATE INDEX "short_urls_code_idx" ON "short_urls"("code");
