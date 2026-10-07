-- Phase 10 Migration: Intended Academic Level, Certificates & Placement Level Codes
ALTER TYPE "CertificateType" ADD VALUE IF NOT EXISTS 'DIPLOMA';

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "intendedLevel" "AcademicLevel" DEFAULT 'LEVEL_1_FOUNDATION';
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "preferredCenterId" TEXT;

ALTER TABLE "AssessmentAttempt" ADD COLUMN IF NOT EXISTS "recommendedLevelCode" "AcademicLevel";

ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "recommendedLevelCode" "AcademicLevel";
ALTER TABLE "Placement" ADD COLUMN IF NOT EXISTS "approvedLevelCode" "AcademicLevel";

ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "levelCode" "AcademicLevel";
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "isTrackDiploma" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "endorsingPartner" TEXT;
ALTER TABLE "Certificate" ADD COLUMN IF NOT EXISTS "accreditationNote" TEXT;
