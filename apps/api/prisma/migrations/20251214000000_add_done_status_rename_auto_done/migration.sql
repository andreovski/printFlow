-- Migration: Add DONE status to BudgetStatus enum and rename budgetAutoInactive to budgetAutoDone

-- Step 1: Add 'DONE' value to BudgetStatus enum
-- Note: Cannot use the new enum value in the same transaction, data migration will be done separately
ALTER TYPE "BudgetStatus" ADD VALUE IF NOT EXISTS 'DONE';

-- Step 2: Rename column budgetAutoInactive to budgetAutoDone in organizations table
ALTER TABLE "organizations" RENAME COLUMN "budgetAutoInactive" TO "budgetAutoDone";
