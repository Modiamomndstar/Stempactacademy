-- AlterTable Application
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "marketingStatus" TEXT DEFAULT 'NEW_LEAD';
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "marketingNotes" TEXT;
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "lastContactedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Application_marketingStatus_idx" ON "Application"("marketingStatus");

-- AlterTable InstitutionalSettings
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "paystackEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "flutterwaveEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "stripeEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "bankTransferEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "cryptoTransferEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "bankName" TEXT NOT NULL DEFAULT 'Access Bank Plc';
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT NOT NULL DEFAULT '1234567890';
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "bankAccountName" TEXT NOT NULL DEFAULT 'STEMPACT Academy Ltd';
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "bankSortCode" TEXT;
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "bankTransferInstructions" TEXT DEFAULT 'Include your Application Reference Number or Full Name in the transfer narration.';
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "cryptoCurrency" TEXT DEFAULT 'USDT (TRC-20)';
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "cryptoNetwork" TEXT DEFAULT 'TRON (TRC20)';
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "cryptoWalletAddress" TEXT DEFAULT '';
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "cryptoInstructions" TEXT DEFAULT 'Please send exact USDT equivalent to this wallet. After payment, paste the Transaction Hash (TxID) and upload screenshot proof.';
ALTER TABLE "InstitutionalSettings" ADD COLUMN IF NOT EXISTS "customPaymentMethodsJson" TEXT DEFAULT '[]';

-- CreateTable LeadFollowUp
CREATE TABLE IF NOT EXISTS "LeadFollowUp" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "recordedById" TEXT NOT NULL,
    "contactChannel" TEXT NOT NULL DEFAULT 'PHONE_CALL',
    "contactTarget" TEXT NOT NULL DEFAULT 'APPLICANT',
    "outcome" TEXT NOT NULL DEFAULT 'CONNECTED_INTERESTED',
    "notes" TEXT NOT NULL,
    "nextFollowUpDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadFollowUp_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "LeadFollowUp_applicationId_idx" ON "LeadFollowUp"("applicationId");
CREATE INDEX IF NOT EXISTS "LeadFollowUp_recordedById_idx" ON "LeadFollowUp"("recordedById");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'LeadFollowUp_applicationId_fkey'
    ) THEN
        ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'LeadFollowUp_recordedById_fkey'
    ) THEN
        ALTER TABLE "LeadFollowUp" ADD CONSTRAINT "LeadFollowUp_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
