-- Step 1: Add settingsId column to projects table (nullable first)
ALTER TABLE "projects" ADD COLUMN "settingsId" TEXT;

-- Step 2: Create ProjectSettings for projects that don't have one yet (with projectId)
INSERT INTO "project_settings" ("id", "projectId", "maxErrors", "visitsRetentionDays", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    p."id",
    100,
    7,
    NOW(),
    NOW()
FROM "projects" p
WHERE NOT EXISTS (
    SELECT 1 FROM "project_settings" ps WHERE ps."projectId" = p."id"
);

-- Step 3: Update projects.settingsId with project_settings.id
UPDATE "projects" p
SET "settingsId" = ps."id"
FROM "project_settings" ps
WHERE ps."projectId" = p."id" AND p."settingsId" IS NULL;

-- Step 4: Make settingsId NOT NULL and UNIQUE
ALTER TABLE "projects" ALTER COLUMN "settingsId" SET NOT NULL;
CREATE UNIQUE INDEX "projects_settingsId_key" ON "projects"("settingsId");

-- Step 5: Add foreign key constraint
ALTER TABLE "projects" ADD CONSTRAINT "projects_settingsId_fkey" 
    FOREIGN KEY ("settingsId") REFERENCES "project_settings"("id") 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Make projectId nullable in project_settings (temporarily)
ALTER TABLE "project_settings" ALTER COLUMN "projectId" DROP NOT NULL;

-- Step 7: Drop old foreign key constraint on project_settings.projectId
ALTER TABLE "project_settings" DROP CONSTRAINT IF EXISTS "project_settings_projectId_fkey";

-- Step 8: Drop projectId column from project_settings
ALTER TABLE "project_settings" DROP COLUMN IF EXISTS "projectId";

-- Step 9: Drop unique index on project_settings.projectId if exists
DROP INDEX IF EXISTS "project_settings_projectId_key";
