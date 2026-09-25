-- AlterTable ProgramVersion
ALTER TABLE "ProgramVersion" ADD COLUMN "isCurrent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ProgramVersion" ADD COLUMN "effectiveFrom" TIMESTAMP(3);
ALTER TABLE "ProgramVersion" ADD COLUMN "effectiveTo" TIMESTAMP(3);
ALTER TABLE "ProgramVersion" ADD COLUMN "curriculumVersionId" TEXT;

-- AlterTable CurriculumVersion
ALTER TABLE "CurriculumVersion" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable Course
ALTER TABLE "Course" ADD COLUMN "curriculumVersionId" TEXT;

-- AlterTable Competency
ALTER TABLE "Competency" ADD COLUMN "curriculumVersionId" TEXT;

-- AlterTable Cohort
ALTER TABLE "Cohort" ADD COLUMN "programVersionId" TEXT;
ALTER TABLE "Cohort" ADD COLUMN "curriculumVersionId" TEXT;

-- CreateIndex
CREATE INDEX "Course_programId_idx" ON "Course"("programId");
CREATE INDEX "Course_curriculumVersionId_idx" ON "Course"("curriculumVersionId");

-- CreateIndex
CREATE INDEX "Module_courseId_idx" ON "Module"("courseId");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_idx" ON "Lesson"("moduleId");

-- CreateIndex
CREATE INDEX "Competency_programId_idx" ON "Competency"("programId");
CREATE INDEX "Competency_curriculumVersionId_idx" ON "Competency"("curriculumVersionId");

-- CreateIndex
CREATE INDEX "Cohort_programId_idx" ON "Cohort"("programId");
CREATE INDEX "Cohort_programVersionId_idx" ON "Cohort"("programVersionId");
CREATE INDEX "Cohort_curriculumVersionId_idx" ON "Cohort"("curriculumVersionId");
CREATE INDEX "Cohort_academicSessionId_idx" ON "Cohort"("academicSessionId");

-- CreateIndex
CREATE INDEX "ProgramVersion_programId_isCurrent_idx" ON "ProgramVersion"("programId", "isCurrent");
CREATE INDEX "ProgramVersion_curriculumVersionId_idx" ON "ProgramVersion"("curriculumVersionId");

-- CreateIndex
CREATE INDEX "Curriculum_programId_idx" ON "Curriculum"("programId");

-- CreateIndex
CREATE UNIQUE INDEX "CurriculumVersion_curriculumId_versionNumber_key" ON "CurriculumVersion"("curriculumId", "versionNumber");
CREATE INDEX "CurriculumVersion_curriculumId_idx" ON "CurriculumVersion"("curriculumId");

-- AddForeignKey
ALTER TABLE "ProgramVersion" ADD CONSTRAINT "ProgramVersion_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competency" ADD CONSTRAINT "Competency_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_programVersionId_fkey" FOREIGN KEY ("programVersionId") REFERENCES "ProgramVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_curriculumVersionId_fkey" FOREIGN KEY ("curriculumVersionId") REFERENCES "CurriculumVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
