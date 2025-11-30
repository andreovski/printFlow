-- CreateEnum
CREATE TYPE "PaymentType" AS ENUM ('PIX', 'CREDIT_CARD', 'DEBIT_CARD', 'BOLETO', 'CASH', 'TRANSFER');

-- AlterTable
ALTER TABLE "budgets" ADD COLUMN     "paymentType" "PaymentType";
