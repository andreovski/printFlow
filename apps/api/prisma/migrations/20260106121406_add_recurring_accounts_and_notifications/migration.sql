-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('RECURRING_JOB_COMPLETED', 'RECURRING_JOB_FAILED', 'GENERAL');

-- AlterTable
ALTER TABLE "accounts_payable" ADD COLUMN     "creationJobStatus" "JobStatus",
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurringParentId" TEXT,
ADD COLUMN     "recurringPosition" INTEGER;

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_read_idx" ON "notifications"("userId", "read");

-- CreateIndex
CREATE INDEX "notifications_createdAt_idx" ON "notifications"("createdAt");

-- CreateIndex
CREATE INDEX "accounts_payable_recurringParentId_idx" ON "accounts_payable"("recurringParentId");

-- CreateIndex
CREATE INDEX "accounts_payable_recurringPosition_idx" ON "accounts_payable"("recurringPosition");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_recurringParentId_fkey" FOREIGN KEY ("recurringParentId") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
