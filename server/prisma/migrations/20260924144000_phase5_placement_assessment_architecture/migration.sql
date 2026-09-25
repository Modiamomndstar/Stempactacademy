-- CreateTable
CREATE TABLE "AssessmentVersion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 30,
    "passingScore" INTEGER NOT NULL DEFAULT 60,
    "status" "WorkflowStatus" NOT NULL DEFAULT 'PUBLISHED',
    "isCurrent" BOOLEAN NOT NULL DEFAULT true,
    "questionsSnapshot" JSONB,
    "programVersionId" TEXT,
    "curriculumVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentVersion_pkey" PRIMARY KEY ("id")
);

-- AlterTable Assessment
ALTER TABLE "Assessment" ADD COLUMN "currentVersionNumber" INTEGER NOT NULL DEFAULT 1;

-- AlterTable AssessmentQuestion
ALTER TABLE "AssessmentQuestion" ADD COLUMN "assessmentVersionId" TEXT;

-- AlterTable AssessmentAttempt
ALTER TABLE "AssessmentAttempt" ADD COLUMN "assessmentVersionId" TEXT;
ALTER TABLE "AssessmentAttempt" ADD COLUMN "questionsSnapshot" JSONB;
ALTER TABLE "AssessmentAttempt" ADD COLUMN "ruleVersion" TEXT DEFAULT 'STEMPACT_RULES_V1';
ALTER TABLE "AssessmentAttempt" ADD COLUMN "recommendedLevelCode" "AcademicLevel";
ALTER TABLE "AssessmentAttempt" ADD COLUMN "recommendedProgramId" TEXT;
ALTER TABLE "AssessmentAttempt" ADD COLUMN "recommendedProgramVersionId" TEXT;
ALTER TABLE "AssessmentAttempt" ADD COLUMN "recommendedCurriculumVersionId" TEXT;

-- AlterTable Placement
ALTER TABLE "Placement" ADD COLUMN "programId" TEXT;
ALTER TABLE "Placement" ADD COLUMN "programVersionId" TEXT;
ALTER TABLE "Placement" ADD COLUMN "curriculumVersionId" TEXT;
ALTER TABLE "Placement" ADD COLUMN "recommendedCohortId" TEXT;
ALTER TABLE "Placement" ADD COLUMN "approvedCohortId" TEXT;
ALTER TABLE "Placement" ADD COLUMN "recommendedLevelCode" "AcademicLevel";
ALTER TABLE "Placement" ADD COLUMN "approvedLevelCode" "AcademicLevel";
ALTER TABLE "Placement" ADD COLUMN "ruleVersion" TEXT DEFAULT 'STEMPACT_RULES_V1';
ALTER TABLE "Placement" ADD COLUMN "reviewerId" TEXT;
ALTER TABLE "Placement" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable PlacementDecision
CREATE TABLE "PlacementDecision" (
    "id" TEXT NOT NULL,
    "placementId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "reviewerName" TEXT NOT NULL,
    "reviewerRole" TEXT NOT NULL,
    "approvedProgramId" TEXT,
    "approvedProgramVersionId" TEXT,
    "approvedCurriculumVersionId" TEXT,
    "approvedLevel" TEXT,
    "approvedLevelCode" "AcademicLevel",
    "approvedCohortId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentVersion_assessmentId_versionNumber_key" ON "AssessmentVersion"("assessmentId", "versionNumber");
CREATE UNIQUE INDEX "AssessmentVersion_assessmentId_isCurrent_unique" ON "AssessmentVersion"("assessmentId") WHERE ("isCurrent" = true);
CREATE INDEX "AssessmentVersion_assessmentId_idx" ON "AssessmentVersion"("assessmentId");
CREATE INDEX "AssessmentVersion_programVersionId_idx" ON "AssessmentVersion"("programVersionId");
CREATE INDEX "AssessmentVersion_curriculumVersionId_idx" ON "AssessmentVersion"("curriculumVersionId");

CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");
CREATE INDEX "AssessmentQuestion_assessmentVersionId_idx" ON "AssessmentQuestion"("assessmentVersionId");

CREATE INDEX "AssessmentAttempt_applicationId_idx" ON "AssessmentAttempt"("applicationId");
CREATE INDEX "AssessmentAttempt_assessmentId_idx" ON "AssessmentAttempt"("assessmentId");
CREATE INDEX "AssessmentAttempt_assessmentVersionId_idx" ON "AssessmentAttempt"("assessmentVersionId");
CREATE INDEX "AssessmentAttempt_recommendedProgramId_idx" ON "AssessmentAttempt"("recommendedProgramId");
CREATE INDEX "AssessmentAttempt_recommendedProgramVersionId_idx" ON "AssessmentAttempt"("recommendedProgramVersionId");
CREATE INDEX "AssessmentAttempt_recommendedCurriculumVersionId_idx" ON "AssessmentAttempt"("recommendedCurriculumVersionId");

CREATE INDEX "Placement_programId_idx" ON "Placement"("programId");
CREATE INDEX "Placement_programVersionId_idx" ON "Placement"("programVersionId");
CREATE INDEX "Placement_curriculumVersionId_idx" ON "Placement"("curriculumVersionId");
CREATE INDEX "Placement_recommendedCohortId_idx" ON "Placement"("recommendedCohortId");
CREATE INDEX "Placement_approvedCohortId_idx" ON "Placement"("approvedCohortId");
CREATE INDEX "Placement_reviewerId_idx" ON "Placement"("reviewerId");

CREATE INDEX "PlacementDecision_placementId_idx" ON "PlacementDecision"("placementId");
CREATE INDEX "PlacementDecision_reviewerId_idx" ON "PlacementDecision"("reviewerId");
CREATE INDEX "PlacementDecision_createdAt_idx" ON "PlacementDecision"("createdAt");

-- AddForeignKey
ALTER TABLE "AssessmentVersion" ADD CONSTRAINT "AssessmentVersion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AssessmentVersion" ADD CONSTRAINT "AssessmentVersion_programVersionId_fkey" FOREIGN KEY ("programVersionId") REFERENCES "ProgramVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentVersion" ADD CONSTRAINT "AssessmentVersion_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentVersionId_fkey" FOREIGN KEY ("assessmentVersionId") REFERENCES "AssessmentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentVersionId_fkey" FOREIGN KEY ("assessmentVersionId") REFERENCES "AssessmentVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_recommendedProgramId_fkey" FOREIGN KEY ("recommendedProgramId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_recommendedProgramVersionId_fkey" FOREIGN KEY ("recommendedProgramVersionId") REFERENCES "ProgramVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_recommendedCurriculumVersionId_fkey" FOREIGN KEY ("recommendedCurriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Placement" ADD CONSTRAINT "Placement_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_programVersionId_fkey" FOREIGN KEY ("programVersionId") REFERENCES "ProgramVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_recommendedCohortId_fkey" FOREIGN KEY ("recommendedCohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_approvedCohortId_fkey" FOREIGN KEY ("approvedCohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Placement" ADD CONSTRAINT "Placement_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlacementDecision" ADD CONSTRAINT "PlacementDecision_placementId_fkey" FOREIGN KEY ("placementId") REFERENCES "Placement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlacementDecision" ADD CONSTRAINT "PlacementDecision_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PlacementDecision" ADD CONSTRAINT "PlacementDecision_approvedProgramId_fkey" FOREIGN KEY ("approvedProgramId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlacementDecision" ADD CONSTRAINT "PlacementDecision_approvedProgramVersionId_fkey" FOREIGN KEY ("approvedProgramVersionId") REFERENCES "ProgramVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlacementDecision" ADD CONSTRAINT "PlacementDecision_approvedCurriculumVersionId_fkey" FOREIGN KEY ("approvedCurriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlacementDecision" ADD CONSTRAINT "PlacementDecision_approvedCohortId_fkey" FOREIGN KEY ("approvedCohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data Backfill for Existing Baseline Records
-- 1. Create AssessmentVersion v1 for each existing Assessment
INSERT INTO "AssessmentVersion" (
    "id", "assessmentId", "versionNumber", "title", "instructions", "durationMinutes", "passingScore", "status", "isCurrent", "programVersionId", "curriculumVersionId", "createdAt", "updatedAt"
)
SELECT 
    gen_random_uuid()::text,
    a.id,
    1,
    a.title,
    a.instructions,
    a."durationMinutes",
    a."passingScore",
    'PUBLISHED'::"WorkflowStatus",
    true,
    pv.id,
    pv."curriculumVersionId",
    NOW(),
    NOW()
FROM "Assessment" a
LEFT JOIN "ProgramVersion" pv ON pv."programId" = a."programId" AND pv."isCurrent" = true;

-- 2. Link AssessmentQuestions to their corresponding AssessmentVersion
UPDATE "AssessmentQuestion" aq
SET "assessmentVersionId" = av.id
FROM "AssessmentVersion" av
WHERE av."assessmentId" = aq."assessmentId" AND av."isCurrent" = true;

-- 3. Link existing AssessmentAttempts to AssessmentVersion, Program, ProgramVersion, CurriculumVersion, LevelCode
UPDATE "AssessmentAttempt" att
SET 
    "assessmentVersionId" = av.id,
    "recommendedProgramId" = a."programId",
    "recommendedProgramVersionId" = av."programVersionId",
    "recommendedCurriculumVersionId" = av."curriculumVersionId",
    "recommendedLevelCode" = 'LEVEL_2_INTERMEDIATE'::"AcademicLevel",
    "ruleVersion" = 'STEMPACT_RULES_V1'
FROM "Assessment" a
JOIN "AssessmentVersion" av ON av."assessmentId" = a.id AND av."isCurrent" = true
WHERE att."assessmentId" = a.id;

-- 4. Update existing Placement with relational references
UPDATE "Placement" pl
SET 
    "programId" = a."programId",
    "programVersionId" = av."programVersionId",
    "curriculumVersionId" = av."curriculumVersionId",
    "recommendedLevelCode" = 'LEVEL_2_INTERMEDIATE'::"AcademicLevel",
    "ruleVersion" = 'STEMPACT_RULES_V1'
FROM "AssessmentAttempt" att
JOIN "Assessment" a ON a.id = att."assessmentId"
JOIN "AssessmentVersion" av ON av."assessmentId" = a.id AND av."isCurrent" = true
WHERE pl."assessmentAttemptId" = att.id;
