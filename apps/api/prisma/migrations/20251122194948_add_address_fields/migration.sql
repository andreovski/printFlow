/*
  Warnings:

  - Added the required column `address` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `addressNumber` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cep` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `clients` table without a default value. This is not possible if the table is not empty.
  - Made the column `state` on table `clients` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "AddressType" AS ENUM ('COMERCIAL', 'RESIDENCIAL');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "addressNumber" TEXT NOT NULL,
ADD COLUMN     "addressType" "AddressType",
ADD COLUMN     "cep" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'Brasil',
ADD COLUMN     "neighborhood" TEXT,
ALTER COLUMN "state" SET NOT NULL;
