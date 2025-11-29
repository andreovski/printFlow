-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "address" TEXT,
ADD COLUMN     "addressNumber" TEXT,
ADD COLUMN     "cep" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "complement" TEXT,
ADD COLUMN     "country" TEXT DEFAULT 'Brasil',
ADD COLUMN     "enterpriseName" TEXT,
ADD COLUMN     "fantasyName" TEXT,
ADD COLUMN     "mainEmail" TEXT,
ADD COLUMN     "mainPhone" TEXT,
ADD COLUMN     "neighborhood" TEXT,
ADD COLUMN     "state" TEXT;
