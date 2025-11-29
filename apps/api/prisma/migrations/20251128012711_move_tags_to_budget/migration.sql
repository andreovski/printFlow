/*
  Warnings:

  - You are about to drop the `_BudgetItemToTag` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_BudgetItemToTag" DROP CONSTRAINT "_BudgetItemToTag_A_fkey";

-- DropForeignKey
ALTER TABLE "_BudgetItemToTag" DROP CONSTRAINT "_BudgetItemToTag_B_fkey";

-- DropTable
DROP TABLE "_BudgetItemToTag";

-- CreateTable
CREATE TABLE "_BudgetToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BudgetToTag_AB_unique" ON "_BudgetToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_BudgetToTag_B_index" ON "_BudgetToTag"("B");

-- AddForeignKey
ALTER TABLE "_BudgetToTag" ADD CONSTRAINT "_BudgetToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "budgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BudgetToTag" ADD CONSTRAINT "_BudgetToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
