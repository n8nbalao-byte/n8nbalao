-- AlterTable
ALTER TABLE "CompanyInfo" ADD COLUMN "geminiApiKey" TEXT;
ALTER TABLE "CompanyInfo" ADD COLUMN "openaiApiKey" TEXT;

-- AlterTable
ALTER TABLE "SaleItem" ADD COLUMN "observation" TEXT;
