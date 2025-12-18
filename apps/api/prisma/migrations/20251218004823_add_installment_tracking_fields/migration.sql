-- AlterTable
ALTER TABLE "accounts_payable" ADD COLUMN     "installmentNumber" INTEGER,
ADD COLUMN     "installmentOf" INTEGER,
ADD COLUMN     "parentId" TEXT;

-- CreateIndex
CREATE INDEX "accounts_payable_parentId_idx" ON "accounts_payable"("parentId");

-- CreateIndex
CREATE INDEX "accounts_payable_installmentNumber_idx" ON "accounts_payable"("installmentNumber");

-- AddForeignKey
ALTER TABLE "accounts_payable" ADD CONSTRAINT "accounts_payable_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "accounts_payable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
