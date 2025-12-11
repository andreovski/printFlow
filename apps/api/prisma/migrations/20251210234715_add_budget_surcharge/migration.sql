-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "surchargeType" "DiscountType",
ADD COLUMN     "surchargeValue" DECIMAL(10,2);
