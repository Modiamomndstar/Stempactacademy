-- AlterTable: Application (Additive financial preference fields)
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "requestedPaymentPlan" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "fundingSourcePreference" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "sponsorshipDetails" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "scholarshipRequested" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "financialAssistanceReason" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "financialNotes" TEXT;

-- AlterTable: Invoice (Additive breakdown and payer fields)
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "baseAmount" DOUBLE PRECISION;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "scholarshipAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sponsorAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "adjustmentsJson" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "payerType" TEXT DEFAULT 'STUDENT';
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "payerName" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "payerEmail" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "sponsorOrganization" TEXT;

-- AlterTable: Payment (Additive payer attribution and notes)
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "payerType" TEXT DEFAULT 'STUDENT';
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "payerName" TEXT;
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- AlterTable: FinancialClearance (Additive approved arrangement and funding attribution)
ALTER TABLE "FinancialClearance" ALTER COLUMN "minimumRequiredPercentage" SET DEFAULT 100.0;
ALTER TABLE "FinancialClearance" ADD COLUMN IF NOT EXISTS "approvedPlanType" TEXT DEFAULT 'FULL';
ALTER TABLE "FinancialClearance" ADD COLUMN IF NOT EXISTS "requiredInitialPayment" DOUBLE PRECISION;
ALTER TABLE "FinancialClearance" ADD COLUMN IF NOT EXISTS "installmentScheduleJson" TEXT;
ALTER TABLE "FinancialClearance" ADD COLUMN IF NOT EXISTS "fundingSource" TEXT DEFAULT 'SELF';
ALTER TABLE "FinancialClearance" ADD COLUMN IF NOT EXISTS "sponsorName" TEXT;
ALTER TABLE "FinancialClearance" ADD COLUMN IF NOT EXISTS "approvedById" TEXT;

-- AddForeignKey for FinancialClearance.approvedById -> User.id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'FinancialClearance_approvedById_fkey'
  ) THEN
    ALTER TABLE "FinancialClearance" ADD CONSTRAINT "FinancialClearance_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "FinancialClearance_approvedById_idx" ON "FinancialClearance"("approvedById");
