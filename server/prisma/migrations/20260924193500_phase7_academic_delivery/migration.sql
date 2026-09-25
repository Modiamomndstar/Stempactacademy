-- =========================================================
-- Phase 7 Migration: Academic Delivery & Student Experience
-- =========================================================

-- 1. AlterTable: ClassSession
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "courseId" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "moduleId" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "lessonId" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "meetingUrl" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "recordingUrl" TEXT;
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SCHEDULED';
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "ClassSession" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 2. AlterTable: Attendance
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Attendance" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 3. AlterTable: Assignment
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "moduleId" TEXT;
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "curriculumVersionId" TEXT;
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "instructorId" TEXT;
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'PUBLISHED';
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Assignment" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 4. AlterTable: Submission
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "isLatest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'SUBMITTED';
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "gradedById" TEXT;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 5. AlterTable: Project
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "curriculumVersionId" TEXT;
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'COMPLETED';
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 6. AlterTable: StudentCompetency
ALTER TABLE "StudentCompetency" ADD COLUMN IF NOT EXISTS "score" DOUBLE PRECISION;
ALTER TABLE "StudentCompetency" ADD COLUMN IF NOT EXISTS "evidenceNotes" TEXT;
ALTER TABLE "StudentCompetency" ADD COLUMN IF NOT EXISTS "evaluatorId" TEXT;
ALTER TABLE "StudentCompetency" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "StudentCompetency" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 7. CreateTable: StudentLessonProgress
CREATE TABLE IF NOT EXISTS "StudentLessonProgress" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "completedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "timeSpentMinutes" INTEGER DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentLessonProgress_pkey" PRIMARY KEY ("id")
);

-- 8. Constraints & Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "Attendance_classSessionId_studentId_key" ON "Attendance"("classSessionId", "studentId");
CREATE INDEX IF NOT EXISTS "Attendance_studentId_idx" ON "Attendance"("studentId");
CREATE INDEX IF NOT EXISTS "Attendance_classSessionId_idx" ON "Attendance"("classSessionId");

CREATE INDEX IF NOT EXISTS "ClassSession_cohortId_idx" ON "ClassSession"("cohortId");
CREATE INDEX IF NOT EXISTS "ClassSession_instructorId_idx" ON "ClassSession"("instructorId");
CREATE INDEX IF NOT EXISTS "ClassSession_courseId_idx" ON "ClassSession"("courseId");
CREATE INDEX IF NOT EXISTS "ClassSession_status_idx" ON "ClassSession"("status");

CREATE INDEX IF NOT EXISTS "Assignment_cohortId_idx" ON "Assignment"("cohortId");
CREATE INDEX IF NOT EXISTS "Assignment_courseId_idx" ON "Assignment"("courseId");
CREATE INDEX IF NOT EXISTS "Assignment_moduleId_idx" ON "Assignment"("moduleId");
CREATE INDEX IF NOT EXISTS "Assignment_curriculumVersionId_idx" ON "Assignment"("curriculumVersionId");
CREATE INDEX IF NOT EXISTS "Assignment_status_idx" ON "Assignment"("status");

CREATE INDEX IF NOT EXISTS "Submission_assignmentId_idx" ON "Submission"("assignmentId");
CREATE INDEX IF NOT EXISTS "Submission_studentId_idx" ON "Submission"("studentId");
CREATE INDEX IF NOT EXISTS "Submission_isLatest_idx" ON "Submission"("isLatest");
CREATE INDEX IF NOT EXISTS "Submission_status_idx" ON "Submission"("status");

CREATE INDEX IF NOT EXISTS "Project_cohortId_idx" ON "Project"("cohortId");
CREATE INDEX IF NOT EXISTS "Project_programId_idx" ON "Project"("programId");
CREATE INDEX IF NOT EXISTS "Project_curriculumVersionId_idx" ON "Project"("curriculumVersionId");

CREATE INDEX IF NOT EXISTS "StudentCompetency_studentId_idx" ON "StudentCompetency"("studentId");
CREATE INDEX IF NOT EXISTS "StudentCompetency_competencyId_idx" ON "StudentCompetency"("competencyId");
CREATE INDEX IF NOT EXISTS "StudentCompetency_evaluatorId_idx" ON "StudentCompetency"("evaluatorId");

CREATE UNIQUE INDEX IF NOT EXISTS "StudentLessonProgress_studentId_lessonId_key" ON "StudentLessonProgress"("studentId", "lessonId");
CREATE INDEX IF NOT EXISTS "StudentLessonProgress_studentId_idx" ON "StudentLessonProgress"("studentId");
CREATE INDEX IF NOT EXISTS "StudentLessonProgress_lessonId_idx" ON "StudentLessonProgress"("lessonId");

-- 9. Foreign Key References
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassSession_courseId_fkey') THEN
        ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassSession_moduleId_fkey') THEN
        ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ClassSession_lessonId_fkey') THEN
        ALTER TABLE "ClassSession" ADD CONSTRAINT "ClassSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Assignment_moduleId_fkey') THEN
        ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Assignment_curriculumVersionId_fkey') THEN
        ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Assignment_instructorId_fkey') THEN
        ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Submission_gradedById_fkey') THEN
        ALTER TABLE "Submission" ADD CONSTRAINT "Submission_gradedById_fkey" FOREIGN KEY ("gradedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Project_curriculumVersionId_fkey') THEN
        ALTER TABLE "Project" ADD CONSTRAINT "Project_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentCompetency_evaluatorId_fkey') THEN
        ALTER TABLE "StudentCompetency" ADD CONSTRAINT "StudentCompetency_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentLessonProgress_studentId_fkey') THEN
        ALTER TABLE "StudentLessonProgress" ADD CONSTRAINT "StudentLessonProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'StudentLessonProgress_lessonId_fkey') THEN
        ALTER TABLE "StudentLessonProgress" ADD CONSTRAINT "StudentLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
