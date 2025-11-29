/*
  Warnings:

  - The values [PRODUCTION] on the enum `TagScope` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TagScope_new" AS ENUM ('GLOBAL', 'BUDGET', 'BOARD');
ALTER TABLE "tags" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "tags" ALTER COLUMN "scope" TYPE "TagScope_new" USING ("scope"::text::"TagScope_new");
ALTER TYPE "TagScope" RENAME TO "TagScope_old";
ALTER TYPE "TagScope_new" RENAME TO "TagScope";
DROP TYPE "TagScope_old";
ALTER TABLE "tags" ALTER COLUMN "scope" SET DEFAULT 'GLOBAL';
COMMIT;
