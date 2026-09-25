-- =========================================================
-- Phase 7 Migration: Enrollment-Scoped Academic Evidence
-- =========================================================

-- 1. AlterTable: StudentLessonProgress (Add enrollmentId)
ALTER TABLE "StudentLessonProgress" ADD COLUMN IF NOT EXISTS "enrollmentId" TEXT;
CREATE INDEX IF NOT EXISTS "StudentLessonProgress_enrollmentId_idx" ON "StudentLessonProgress"("enrollmentId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentLessonProgress_enrollmentId_fkey') THEN
        ALTER TABLE "StudentLessonProgress" ADD CONSTRAINT "StudentLessonProgress_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentCohortEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 2. AlterTable: StudentCompetency (Add enrollmentId)
ALTER TABLE "StudentCompetency" ADD COLUMN IF NOT EXISTS "enrollmentId" TEXT;
CREATE INDEX IF NOT EXISTS "StudentCompetency_enrollmentId_idx" ON "StudentCompetency"("enrollmentId");

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentCompetency_enrollmentId_fkey') THEN
        ALTER TABLE "StudentCompetency" ADD CONSTRAINT "StudentCompetency_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "StudentCohortEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
