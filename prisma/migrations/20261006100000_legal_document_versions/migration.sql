-- Replaces the one-date-per-document table with a version history.
DROP TABLE "LegalDocument";

-- CreateTable
CREATE TABLE "LegalDocumentVersion" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "effectiveAt" DATE NOT NULL,
    "changes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalDocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocumentVersion_slug_version_key" ON "LegalDocumentVersion"("slug", "version");

-- CreateIndex
CREATE INDEX "LegalDocumentVersion_slug_effectiveAt_idx" ON "LegalDocumentVersion"("slug", "effectiveAt");

-- The texts first published on 2026-09-27.
INSERT INTO "LegalDocumentVersion" ("slug", "version", "effectiveAt", "changes") VALUES
    ('terms', 1, '2026-09-27', 'First version.'),
    ('privacy', 1, '2026-09-27', 'Rewritten: controller, legal bases, processors, retention, rights.'),
    ('cookies', 1, '2026-09-27', 'First version.');
