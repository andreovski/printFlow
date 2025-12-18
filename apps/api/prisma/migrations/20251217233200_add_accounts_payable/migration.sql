/*
  Warnings:

  - You are about to drop the column `search_vector` on the `budgets` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `cards` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `search_vector` on the `products` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountsPayableStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');

-- AlterEnum
ALTER TYPE "TagScope" ADD VALUE 'PAYABLES';

-- Drop triggers and functions BEFORE dropping columns (prevents orphaned triggers)
DROP TRIGGER IF EXISTS client_update_budgets_search ON clients;
DROP TRIGGER IF EXISTS budget_search_vector_update ON budgets;
DROP FUNCTION IF EXISTS update_budgets_on_client_change();
DROP FUNCTION IF EXISTS update_budget_search_vector();

-- DropIndex
DROP INDEX "budgets_search_vector_idx";

-- DropIndex
DROP INDEX "cards_search_vector_idx";

-- DropIndex
DROP INDEX "clients_search_vector_idx";

-- DropIndex
DROP INDEX "products_search_vector_idx";

-- AlterTable
ALTER TABLE "budgets" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "cards" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "clients" DROP COLUMN "search_vector";

-- AlterTable
ALTER TABLE "products" DROP COLUMN "search_vector";

-- CreateTable
CREATE TABLE "accounts_payable" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "icon" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" "AccountsPayableStatus" NOT NULL DEFAULT 'PENDING',
    "installments" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "description" TEXT,
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "accounts_payable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_AccountsPayableToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "accounts_payable_organizationId_idx" ON "accounts_payable"("organizationId");

-- CreateIndex
CREATE INDEX "accounts_payable_dueDate_idx" ON "accounts_payable"("dueDate");

-- CreateIndex
CREATE INDEX "accounts_payable_status_idx" ON "accounts_payable"("status");

-- CreateIndex
CREATE UNIQUE INDEX "_AccountsPayableToTag_AB_unique" ON "_AccountsPayableToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_AccountsPayableToTag_B_index" ON "_AccountsPayableToTag"("B");

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountsPayableToTag" ADD CONSTRAINT "_AccountsPayableToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AccountsPayableToTag" ADD CONSTRAINT "_AccountsPayableToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
