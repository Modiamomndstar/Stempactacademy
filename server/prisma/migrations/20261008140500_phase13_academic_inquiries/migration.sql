-- CreateTable AcademicInquiry
CREATE TABLE IF NOT EXISTS "AcademicInquiry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT NOT NULL DEFAULT 'Program & Syllabus Inquiries',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "respondedById" TEXT,
    "respondedAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AcademicInquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "AcademicInquiry_status_idx" ON "AcademicInquiry"("status");
CREATE INDEX IF NOT EXISTS "AcademicInquiry_email_idx" ON "AcademicInquiry"("email");
CREATE INDEX IF NOT EXISTS "AcademicInquiry_createdAt_idx" ON "AcademicInquiry"("createdAt");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'AcademicInquiry_respondedById_fkey'
    ) THEN
        ALTER TABLE "AcademicInquiry" ADD CONSTRAINT "AcademicInquiry_respondedById_fkey" FOREIGN KEY ("respondedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;
