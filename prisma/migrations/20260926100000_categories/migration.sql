-- Categories become a managed table instead of a hard-coded list.

-- CreateTable
CREATE TABLE "Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE INDEX "Category_isActive_position_idx" ON "Category"("isActive", "position");

-- Seed: the former built-in list first (same order), then the new ones.
INSERT INTO "Category" ("slug", "name", "position") VALUES
    ('books', 'Books', 0),
    ('movies', 'Movies', 1),
    ('games', 'Games', 2),
    ('recipes', 'Recipes', 3),
    ('apps', 'Apps', 4),
    ('travel', 'Travel', 5),
    ('music', 'Music', 6),
    ('sport', 'Sport', 7),
    ('tv-shows', 'TV Shows', 8),
    ('anime', 'Anime', 9),
    ('podcasts', 'Podcasts', 10),
    ('art', 'Art', 11),
    ('design', 'Design', 12),
    ('photography', 'Photography', 13),
    ('fashion', 'Fashion', 14),
    ('home', 'Home & Interior', 15),
    ('tech', 'Tech', 16),
    ('science', 'Science', 17),
    ('education', 'Education', 18),
    ('fitness', 'Fitness', 19),
    ('cars', 'Cars', 20),
    ('pets', 'Pets', 21),
    ('nature', 'Nature', 22),
    ('custom', 'Custom', 100);

-- Any other value that slipped into the old free-text column keeps its collections.
INSERT INTO "Category" ("slug", "name", "position")
SELECT DISTINCT
    'legacy-' || md5(c."category"),
    c."category",
    200
FROM "Collection" c
WHERE NOT EXISTS (SELECT 1 FROM "Category" k WHERE k."name" = c."category");

-- AlterTable
ALTER TABLE "Collection" ADD COLUMN "categoryId" INTEGER;

UPDATE "Collection" c
SET "categoryId" = k."id"
FROM "Category" k
WHERE k."name" = c."category";

ALTER TABLE "Collection" ALTER COLUMN "categoryId" SET NOT NULL;

DROP INDEX "Collection_private_category_createdAt_idx";
ALTER TABLE "Collection" DROP COLUMN "category";

CREATE INDEX "Collection_private_categoryId_createdAt_idx" ON "Collection"("private", "categoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "Collection" ADD CONSTRAINT "Collection_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
