-- =========================================================
-- Phase 9 Migration: Multi-Level Progression, Learning Centers & Program Enrichment
-- =========================================================

-- 1. Enums
DO $$ BEGIN
    CREATE TYPE "CenterType" AS ENUM ('MAIN_CAMPUS', 'SATELLITE_CENTER', 'GOVERNMENT_SPONSORED', 'CORPORATE_PARTNER', 'VIRTUAL_GLOBAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Table: LearningCenter
CREATE TABLE IF NOT EXISTS "LearningCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "centerType" "CenterType" NOT NULL DEFAULT 'MAIN_CAMPUS',
    "country" TEXT NOT NULL DEFAULT 'Nigeria',
    "stateOrRegion" TEXT NOT NULL DEFAULT 'Osun State',
    "cityOrTown" TEXT NOT NULL DEFAULT 'Ile-Ife',
    "neighborhood" TEXT,
    "address" TEXT NOT NULL,
    "landmark" TEXT,
    "sponsorPartnerName" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'Africa/Lagos',
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LearningCenter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "LearningCenter_code_key" ON "LearningCenter"("code");

-- 3. Program Table: Add missing fields
ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "isKidsTrack" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "targetAgeGroup" TEXT;
ALTER TABLE "Program" ADD COLUMN IF NOT EXISTS "totalLevels" INTEGER NOT NULL DEFAULT 4;

-- 4. Lesson Table: Add missing fields
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "videoDurationMin" INTEGER;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "videoSummary" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "interactiveLabType" TEXT;

-- 5. Application Table: Add preferredCenterId
ALTER TABLE "Application" ADD COLUMN IF NOT EXISTS "preferredCenterId" TEXT;
CREATE INDEX IF NOT EXISTS "Application_preferredCenterId_idx" ON "Application"("preferredCenterId");

-- 6. Cohort Table: Add learningCenterId, sponsorName, levelCode
ALTER TABLE "Cohort" ADD COLUMN IF NOT EXISTS "levelCode" "AcademicLevel" DEFAULT 'LEVEL_1_FOUNDATION';
ALTER TABLE "Cohort" ADD COLUMN IF NOT EXISTS "learningCenterId" TEXT;
ALTER TABLE "Cohort" ADD COLUMN IF NOT EXISTS "sponsorName" TEXT;
CREATE INDEX IF NOT EXISTS "Cohort_levelCode_idx" ON "Cohort"("levelCode");
CREATE INDEX IF NOT EXISTS "Cohort_learningCenterId_idx" ON "Cohort"("learningCenterId");

-- 7. ClassSession Table: Add learningCenterId
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "learningCenterId" TEXT;
CREATE INDEX IF NOT EXISTS "ClassSession_learningCenterId_idx" ON "ClassSession"("learningCenterId");

-- 8. Assignment Table: Add rubricJson and aiGradingEnabled
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "rubricJson" JSONB;
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "aiGradingEnabled" BOOLEAN NOT NULL DEFAULT true;

-- 9. Submission Table: Add AI and rubric fields
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "aiSuggestedGrade" DOUBLE PRECISION;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "aiFeedbackDraft" TEXT;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "rubricScoresJson" JSONB;

-- 10. Create Table: CohortInstructor
CREATE TABLE IF NOT EXISTS "CohortInstructor" (
    "id" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'LEAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CohortInstructor_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CohortInstructor_cohortId_instructorId_key" ON "CohortInstructor"("cohortId", "instructorId");
CREATE INDEX IF NOT EXISTS "CohortInstructor_cohortId_idx" ON "CohortInstructor"("cohortId");
CREATE INDEX IF NOT EXISTS "CohortInstructor_instructorId_idx" ON "CohortInstructor"("instructorId");

-- 11. Create Table: ProgressionEligibility
DROP TABLE IF EXISTS "ProgressionEligibility" CASCADE;

CREATE TABLE "ProgressionEligibility" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "completedLevel" "AcademicLevel" NOT NULL DEFAULT 'LEVEL_1_FOUNDATION',
    "eligibleLevel" "AcademicLevel" NOT NULL DEFAULT 'LEVEL_2_INTERMEDIATE',
    "completedCohortId" TEXT NOT NULL,
    "certificateId" TEXT,
    "clearedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "claimedCohortId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgressionEligibility_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProgressionEligibility_studentId_idx" ON "ProgressionEligibility"("studentId");
CREATE INDEX IF NOT EXISTS "ProgressionEligibility_programId_idx" ON "ProgressionEligibility"("programId");
CREATE INDEX IF NOT EXISTS "ProgressionEligibility_status_idx" ON "ProgressionEligibility"("status");
