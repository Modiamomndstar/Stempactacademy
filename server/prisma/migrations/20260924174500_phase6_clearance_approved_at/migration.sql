-- AlterTable: FinancialClearance (Add approvedAt timestamp)
ALTER TABLE "FinancialClearance" ADD COLUMN IF NOT EXISTS "approvedAt" TIMESTAMP(3);
