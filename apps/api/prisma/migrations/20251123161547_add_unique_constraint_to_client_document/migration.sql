/*
  Warnings:

  - A unique constraint covering the columns `[document]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "clients_document_key" ON "clients"("document");
