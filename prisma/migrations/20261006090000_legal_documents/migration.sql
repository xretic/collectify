-- CreateTable
CREATE TABLE "LegalDocument" (
    "slug" TEXT NOT NULL,
    "updatedAt" DATE NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("slug")
);

-- The texts published on 2026-09-27.
INSERT INTO "LegalDocument" ("slug", "updatedAt") VALUES
    ('terms', '2026-09-27'),
    ('privacy', '2026-09-27'),
    ('cookies', '2026-09-27');
