/*
  Warnings:

  - A unique constraint covering the columns `[name,organizationId]` on the table `templates` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "templates_name_organizationId_key" ON "templates"("name", "organizationId");
