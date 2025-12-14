/*
  Warnings:

  - You are about to drop the column `budgetAutoDone` on the `organizations` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "budgetAutoDone",
ADD COLUMN     "budgetAutoInactive" BOOLEAN NOT NULL DEFAULT false;
