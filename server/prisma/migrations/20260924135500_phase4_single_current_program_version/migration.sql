-- 1. Safely resolve existing CSE-01 duplicate-current state so only the latest version remains current
WITH ranked_versions AS (
  SELECT id, "programId", "versionNumber",
         ROW_NUMBER() OVER (PARTITION BY "programId" ORDER BY "versionNumber" DESC) as rn
  FROM "ProgramVersion"
  WHERE "isCurrent" = true
)
UPDATE "ProgramVersion"
SET "isCurrent" = false
WHERE id IN (
  SELECT id FROM ranked_versions WHERE rn > 1
);

-- 2. Add PostgreSQL partial unique index ensuring each Program can have at most one isCurrent = true ProgramVersion
CREATE UNIQUE INDEX "ProgramVersion_programId_isCurrent_unique" 
ON "ProgramVersion"("programId") 
WHERE ("isCurrent" = true);
