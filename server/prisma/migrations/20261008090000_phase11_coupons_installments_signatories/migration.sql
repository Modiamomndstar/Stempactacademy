-- Phase 11 Migration: Coupons, Installments & Institutional Settings
DO $$ BEGIN
    CREATE TYPE "CouponType" AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "Coupon" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "discountType" "CouponType" NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "maxDiscount" DOUBLE PRECISION,
    "minInvoiceTotal" DOUBLE PRECISION,
    "maxUses" INTEGER,
    "usedCount" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "programId" TEXT,
    "cohortId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Coupon_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Coupon_code_key" ON "Coupon"("code");
CREATE INDEX IF NOT EXISTS "Coupon_isActive_idx" ON "Coupon"("isActive");

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "couponId" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "couponCode" TEXT;
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "selectedPlanType" TEXT DEFAULT 'FULL';
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "installmentScheduleJson" TEXT;
CREATE INDEX IF NOT EXISTS "Invoice_couponId_idx" ON "Invoice"("couponId");
CREATE INDEX IF NOT EXISTS "Invoice_couponCode_idx" ON "Invoice"("couponCode");

CREATE TABLE IF NOT EXISTS "InstitutionalSettings" (
    "id" TEXT NOT NULL DEFAULT 'default-institution-settings',
    "institutionName" TEXT NOT NULL DEFAULT 'STEMPACT Academy',
    "institutionMotto" TEXT NOT NULL DEFAULT 'Premier STEM, Vocational & Emerging Technology Academy',
    "campusAddress" TEXT NOT NULL DEFAULT 'Campus & Hubs: Ile-Ife Main Innovation Hub • Training Center Network • Virtual Global Campus',
    "logoUrl" TEXT,
    "sealBadgeUrl" TEXT,
    "primarySignatoryName" TEXT NOT NULL DEFAULT 'Dr. Kehinde Adeleke',
    "primarySignatoryTitle" TEXT NOT NULL DEFAULT 'Dean of Academic Affairs & Faculty',
    "primarySignatoryRole" TEXT NOT NULL DEFAULT 'STEMPACT Academy Directorate',
    "primarySignatorySignature" TEXT,
    "secondarySignatoryName" TEXT NOT NULL DEFAULT 'Office of the Registrar',
    "secondarySignatoryTitle" TEXT NOT NULL DEFAULT 'Registrar & Student Records',
    "secondarySignatoryRole" TEXT NOT NULL DEFAULT 'Accredited Academic Registry',
    "secondarySignatorySignature" TEXT,
    "endorsingPartnerName" TEXT DEFAULT 'National Technology Innovation Consortium',
    "endorsingPartnerTitle" TEXT DEFAULT 'Accreditation & Quality Assurance Council',
    "endorsingPartnerLogo" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InstitutionalSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "InstitutionalSettings" ("id", "institutionName", "primarySignatoryName", "primarySignatoryTitle", "secondarySignatoryName", "secondarySignatoryTitle")
VALUES ('default-institution-settings', 'STEMPACT Academy', 'Dr. Kehinde Adeleke', 'Dean of Academic Affairs & Faculty', 'Office of the Registrar', 'Registrar & Student Records')
ON CONFLICT ("id") DO NOTHING;
