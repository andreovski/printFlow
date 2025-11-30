/*
  Warnings:

  - A unique constraint covering the columns `[approvalToken]` on the table `budgets` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "approvalToken" TEXT,
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedByClient" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejectionReason" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "budgets_approvalToken_key" ON "budgets"("approvalToken");
