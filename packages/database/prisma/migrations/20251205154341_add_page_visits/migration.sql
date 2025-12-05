-- CreateTable
CREATE TABLE "page_visits" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pathname" TEXT,
    "referrer" TEXT,
    "userAgent" TEXT,
    "sessionId" TEXT,
    "userId" TEXT,
    "duration" INTEGER,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_visits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "page_visits_projectId_idx" ON "page_visits"("projectId");

-- CreateIndex
CREATE INDEX "page_visits_timestamp_idx" ON "page_visits"("timestamp");

-- CreateIndex
CREATE INDEX "page_visits_url_idx" ON "page_visits"("url");

-- CreateIndex
CREATE INDEX "page_visits_sessionId_idx" ON "page_visits"("sessionId");

-- CreateIndex
CREATE INDEX "page_visits_projectId_timestamp_idx" ON "page_visits"("projectId", "timestamp");

-- CreateIndex
CREATE INDEX "page_visits_projectId_url_idx" ON "page_visits"("projectId", "url");

-- AddForeignKey
ALTER TABLE "page_visits" ADD CONSTRAINT "page_visits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
