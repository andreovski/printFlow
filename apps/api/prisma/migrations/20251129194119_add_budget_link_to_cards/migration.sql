-- AlterTable
ALTER TABLE "cards" ADD COLUMN     "budgetId" TEXT;

-- CreateIndex
CREATE INDEX "cards_budgetId_idx" ON "cards"("budgetId");

-- AddForeignKey
ALTER TABLE "cards" ADD CONSTRAINT "cards_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "budgets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
