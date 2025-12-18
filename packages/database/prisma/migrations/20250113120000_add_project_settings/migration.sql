-- CreateTable
CREATE TABLE "project_settings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "maxErrors" INTEGER NOT NULL DEFAULT 100,
    "visitsRetentionDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_settings_projectId_key" ON "project_settings"("projectId");

-- Migrate existing maxErrors data from projects to project_settings
INSERT INTO "project_settings" ("id", "projectId", "maxErrors", "createdAt", "updatedAt")
SELECT 
    md5(random()::text || clock_timestamp()::text || "id"),
    "id",
    "maxErrors",
    "createdAt",
    "updatedAt"
FROM "projects";

-- AddForeignKey
ALTER TABLE "project_settings" ADD CONSTRAINT "project_settings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Remove maxErrors from projects
ALTER TABLE "projects" DROP COLUMN "maxErrors";
