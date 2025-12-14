-- Migration: Migrate existing INACTIVE budgets to DONE status
-- This must run in a separate transaction after the enum value was added

UPDATE "budgets" SET "status" = 'DONE' WHERE "status" = 'INACTIVE';
