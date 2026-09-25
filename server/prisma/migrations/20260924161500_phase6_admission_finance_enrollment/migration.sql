-- Phase 6: Admission, Finance & Enrollment Architecture Additive Migration

-- CreateEnum
CREATE TYPE "AdmissionStatus" AS ENUM ('PENDING', 'OFFERED', 'ISSUED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'EXPIRED', 'FINANCIALLY_CLEARED', 'ENROLLED');

-- AlterTable Admission
ALTER TABLE "Admission" ADD COLUMN IF NOT EXISTS "academicSessionId" TEXT,
ADD COLUMN IF NOT EXISTS "acceptedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "assessmentAttemptId" TEXT,
ADD COLUMN IF NOT EXISTS "conditions" TEXT,
ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "curriculumVersionId" TEXT,
ADD COLUMN IF NOT EXISTS "declinedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "declinedReason" TEXT,
ADD COLUMN IF NOT EXISTS "issuedById" TEXT,
ADD COLUMN IF NOT EXISTS "notes" TEXT,
ADD COLUMN IF NOT EXISTS "placementId" TEXT,
ADD COLUMN IF NOT EXISTS "programId" TEXT,
ADD COLUMN IF NOT EXISTS "programVersionId" TEXT,
ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "withdrawnAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "withdrawnById" TEXT,
ADD COLUMN IF NOT EXISTS "withdrawnReason" TEXT;

ALTER TABLE "Admission" ALTER COLUMN "studentIdNumber" DROP NOT NULL;
ALTER TABLE "Admission" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Admission" ALTER COLUMN "status" TYPE "AdmissionStatus" USING ("status"::text::"AdmissionStatus");
ALTER TABLE "Admission" ALTER COLUMN "status" SET DEFAULT 'OFFERED';

-- AlterTable FinancialClearance
ALTER TABLE "FinancialClearance" ADD COLUMN IF NOT EXISTS "admissionId" TEXT,
ADD COLUMN IF NOT EXISTS "clearedById" TEXT,
ADD COLUMN IF NOT EXISTS "invoiceId" TEXT,
ADD COLUMN IF NOT EXISTS "waivedAt" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "waivedById" TEXT,
ADD COLUMN IF NOT EXISTS "waiverAmount" DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS "waiverReason" TEXT;

-- AlterTable Invoice
ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "admissionId" TEXT,
ADD COLUMN IF NOT EXISTS "cohortId" TEXT;

-- AlterTable StudentCohortEnrollment
ALTER TABLE "StudentCohortEnrollment" ADD COLUMN IF NOT EXISTS "academicSessionId" TEXT,
ADD COLUMN IF NOT EXISTS "admissionId" TEXT,
ADD COLUMN IF NOT EXISTS "applicationId" TEXT,
ADD COLUMN IF NOT EXISTS "curriculumVersionId" TEXT,
ADD COLUMN IF NOT EXISTS "enrolledById" TEXT,
ADD COLUMN IF NOT EXISTS "programId" TEXT,
ADD COLUMN IF NOT EXISTS "programVersionId" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Admission_cohortId_idx" ON "Admission"("cohortId");
CREATE INDEX IF NOT EXISTS "Admission_status_idx" ON "Admission"("status");
CREATE INDEX IF NOT EXISTS "Admission_placementId_idx" ON "Admission"("placementId");
CREATE INDEX IF NOT EXISTS "Admission_programId_idx" ON "Admission"("programId");
CREATE INDEX IF NOT EXISTS "Admission_programVersionId_idx" ON "Admission"("programVersionId");
CREATE INDEX IF NOT EXISTS "Admission_curriculumVersionId_idx" ON "Admission"("curriculumVersionId");
CREATE INDEX IF NOT EXISTS "Admission_issuedById_idx" ON "Admission"("issuedById");

CREATE INDEX IF NOT EXISTS "FinancialClearance_admissionId_idx" ON "FinancialClearance"("admissionId");
CREATE INDEX IF NOT EXISTS "FinancialClearance_invoiceId_idx" ON "FinancialClearance"("invoiceId");

CREATE INDEX IF NOT EXISTS "Invoice_studentId_idx" ON "Invoice"("studentId");
CREATE INDEX IF NOT EXISTS "Invoice_applicationId_idx" ON "Invoice"("applicationId");
CREATE INDEX IF NOT EXISTS "Invoice_admissionId_idx" ON "Invoice"("admissionId");
CREATE INDEX IF NOT EXISTS "Invoice_cohortId_idx" ON "Invoice"("cohortId");

CREATE INDEX IF NOT EXISTS "StudentCohortEnrollment_admissionId_idx" ON "StudentCohortEnrollment"("admissionId");
CREATE INDEX IF NOT EXISTS "StudentCohortEnrollment_applicationId_idx" ON "StudentCohortEnrollment"("applicationId");
CREATE INDEX IF NOT EXISTS "StudentCohortEnrollment_programVersionId_idx" ON "StudentCohortEnrollment"("programVersionId");
CREATE INDEX IF NOT EXISTS "StudentCohortEnrollment_curriculumVersionId_idx" ON "StudentCohortEnrollment"("curriculumVersionId");

-- AddForeignKey
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_assessmentAttemptId_fkey" FOREIGN KEY ("assessmentAttemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_programVersionId_fkey" FOREIGN KEY ("programVersionId") REFERENCES "ProgramVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Admission" ADD CONSTRAINT "Admission_withdrawnById_fkey" FOREIGN KEY ("withdrawnById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_programVersionId_fkey" FOREIGN KEY ("programVersionId") REFERENCES "ProgramVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_academicSessionId_fkey" FOREIGN KEY ("academicSessionId") REFERENCES "AcademicSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_enrolledById_fkey" FOREIGN KEY ("enrolledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialClearance" ADD CONSTRAINT "FinancialClearance_admissionId_fkey" FOREIGN KEY ("admissionId") REFERENCES "Admission"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialClearance" ADD CONSTRAINT "FinancialClearance_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialClearance" ADD CONSTRAINT "FinancialClearance_clearedById_fkey" FOREIGN KEY ("clearedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FinancialClearance" ADD CONSTRAINT "FinancialClearance_waivedById_fkey" FOREIGN KEY ("waivedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
