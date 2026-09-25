-- AlterTable AssessmentAttempt
ALTER TABLE "AssessmentAttempt" ADD COLUMN "recommendedCohortId" TEXT;

-- AlterTable PlacementDecision
ALTER TABLE "PlacementDecision" ADD COLUMN "assessmentAttemptId" TEXT;

-- CreateIndex
CREATE INDEX "AssessmentAttempt_recommendedCohortId_idx" ON "AssessmentAttempt"("recommendedCohortId");
CREATE INDEX "PlacementDecision_assessmentAttemptId_idx" ON "PlacementDecision"("assessmentAttemptId");

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_recommendedCohortId_fkey" FOREIGN KEY ("recommendedCohortId") REFERENCES "Cohort"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlacementDecision" ADD CONSTRAINT "PlacementDecision_assessmentAttemptId_fkey" FOREIGN KEY ("assessmentAttemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE SET NULL ON UPDATE CASCADE;
