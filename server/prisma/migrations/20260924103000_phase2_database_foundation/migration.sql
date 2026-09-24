-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ENROLLED', 'ACTIVE', 'DEFERRED', 'COMPLETED', 'WITHDRAWN', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "FinancialClearanceStatus" AS ENUM ('PENDING', 'PARTIAL', 'CLEARED', 'WAIVED', 'REVOKED');

-- CreateEnum
CREATE TYPE "GuardianRelationshipType" AS ENUM ('FATHER', 'MOTHER', 'GUARDIAN', 'SPONSOR', 'OTHER');

-- AlterTable
ALTER TABLE "Admission" ALTER COLUMN "whatsappGroupUrl" SET DEFAULT 'https://chat.whatsapp.com/C1ntPtG3qkh1Aguvh5zxN9';

-- CreateTable
CREATE TABLE "StudentCohortEnrollment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ENROLLED',
    "financialClearanceId" TEXT,
    "completionDate" TIMESTAMP(3),
    "withdrawalReason" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "deferralReason" TEXT,
    "deferredAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentCohortEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialClearance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT,
    "applicationId" TEXT,
    "status" "FinancialClearanceStatus" NOT NULL DEFAULT 'PENDING',
    "amountRequired" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimumRequiredPercentage" DOUBLE PRECISION NOT NULL DEFAULT 50.0,
    "clearancePercentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clearedBy" TEXT,
    "clearedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialClearance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentGuardianRelation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "parentId" TEXT NOT NULL,
    "relationshipType" "GuardianRelationshipType" NOT NULL DEFAULT 'GUARDIAN',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "canAccessAcademicRecords" BOOLEAN NOT NULL DEFAULT true,
    "canReceiveBillingInformation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentGuardianRelation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentCohortEnrollment_financialClearanceId_key" ON "StudentCohortEnrollment"("financialClearanceId");

-- CreateIndex
CREATE INDEX "StudentCohortEnrollment_studentId_idx" ON "StudentCohortEnrollment"("studentId");

-- CreateIndex
CREATE INDEX "StudentCohortEnrollment_cohortId_idx" ON "StudentCohortEnrollment"("cohortId");

-- CreateIndex
CREATE INDEX "StudentCohortEnrollment_status_idx" ON "StudentCohortEnrollment"("status");

-- CreateIndex
CREATE INDEX "StudentCohortEnrollment_enrollmentDate_idx" ON "StudentCohortEnrollment"("enrollmentDate");

-- CreateIndex
CREATE UNIQUE INDEX "StudentCohortEnrollment_studentId_cohortId_key" ON "StudentCohortEnrollment"("studentId", "cohortId");

-- CreateIndex
CREATE INDEX "FinancialClearance_studentId_idx" ON "FinancialClearance"("studentId");

-- CreateIndex
CREATE INDEX "FinancialClearance_applicationId_idx" ON "FinancialClearance"("applicationId");

-- CreateIndex
CREATE INDEX "FinancialClearance_status_idx" ON "FinancialClearance"("status");

-- CreateIndex
CREATE INDEX "FinancialClearance_createdAt_idx" ON "FinancialClearance"("createdAt");

-- CreateIndex
CREATE INDEX "StudentGuardianRelation_studentId_idx" ON "StudentGuardianRelation"("studentId");

-- CreateIndex
CREATE INDEX "StudentGuardianRelation_parentId_idx" ON "StudentGuardianRelation"("parentId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentGuardianRelation_studentId_parentId_key" ON "StudentGuardianRelation"("studentId", "parentId");

-- AddForeignKey
ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentCohortEnrollment" ADD CONSTRAINT "StudentCohortEnrollment_financialClearanceId_fkey" FOREIGN KEY ("financialClearanceId") REFERENCES "FinancialClearance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialClearance" ADD CONSTRAINT "FinancialClearance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialClearance" ADD CONSTRAINT "FinancialClearance_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardianRelation" ADD CONSTRAINT "StudentGuardianRelation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGuardianRelation" ADD CONSTRAINT "StudentGuardianRelation_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ParentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
