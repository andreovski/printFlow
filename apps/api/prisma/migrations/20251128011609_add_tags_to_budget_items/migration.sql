-- CreateTable
CREATE TABLE "_BudgetItemToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_BudgetItemToTag_AB_unique" ON "_BudgetItemToTag"("A", "B");

-- CreateIndex
CREATE INDEX "_BudgetItemToTag_B_index" ON "_BudgetItemToTag"("B");

-- AddForeignKey
ALTER TABLE "_BudgetItemToTag" ADD CONSTRAINT "_BudgetItemToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "budget_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BudgetItemToTag" ADD CONSTRAINT "_BudgetItemToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;
