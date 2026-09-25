-- CreateTable
CREATE TABLE "EngagedCollection" (
    "userId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngagedCollection_pkey" PRIMARY KEY ("userId","collectionId")
);

-- CreateIndex
CREATE INDEX "EngagedCollection_collectionId_idx" ON "EngagedCollection"("collectionId");

-- AddForeignKey
ALTER TABLE "EngagedCollection" ADD CONSTRAINT "EngagedCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngagedCollection" ADD CONSTRAINT "EngagedCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill from current likes and favorites
INSERT INTO "EngagedCollection" ("userId", "collectionId", "createdAt")
SELECT "userId", "collectionId", MIN("createdAt")
FROM (
    SELECT "userId", "collectionId", "createdAt" FROM "Like"
    UNION ALL
    SELECT "userId", "collectionId", "createdAt" FROM "Favorite"
) e
GROUP BY "userId", "collectionId";
