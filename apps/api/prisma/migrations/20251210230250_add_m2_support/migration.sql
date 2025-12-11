-- CreateEnum
CREATE TYPE "UnitType" AS ENUM ('M2', 'UNIDADE');

-- AlterTable budget_items: Add new columns for m² support
ALTER TABLE "budget_items" ADD COLUMN "height" DECIMAL(10,4),
ADD COLUMN "unitType" "UnitType",
ADD COLUMN "width" DECIMAL(10,4);

-- AlterTable products: Convert string unitType to enum safely
-- Step 1: Rename the old column
ALTER TABLE "products" RENAME COLUMN "unitType" TO "unitType_old";

-- Step 2: Add the new enum column with default
ALTER TABLE "products" ADD COLUMN "unitType" "UnitType" NOT NULL DEFAULT 'UNIDADE';

-- Step 3: Migrate existing data (convert 'm2' to 'M2', anything else to 'UNIDADE')
UPDATE "products" SET "unitType" = 
  CASE 
    WHEN LOWER("unitType_old") = 'm2' THEN 'M2'::"UnitType"
    ELSE 'UNIDADE'::"UnitType"
  END;

-- Step 4: Drop the old column
ALTER TABLE "products" DROP COLUMN "unitType_old";
