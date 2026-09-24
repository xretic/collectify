-- Full review migration: data-preserving. Every destructive step first copies
-- or cleans up the data it depends on.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE', 'SCAM', 'ADULT', 'OTHER');
CREATE TYPE "ReportTargetType" AS ENUM ('USER', 'MESSAGE', 'COMMENT', 'COLLECTION');

ALTER TYPE "NotificationType" ADD VALUE 'REPORT_RESOLVED';
ALTER TYPE "NotificationType" ADD VALUE 'SANCTION';

-- ---------------------------------------------------------------------------
-- Orphan cleanup before adding foreign keys
-- ---------------------------------------------------------------------------
DELETE FROM "Admin" a WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = a."userId");
DELETE FROM "Like" l WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = l."userId");
DELETE FROM "Message" m WHERE NOT EXISTS (SELECT 1 FROM "User" u WHERE u.id = m."recipientUserId");

-- Duplicate likes (created by the old check-then-insert race): keep the oldest.
DELETE FROM "Like" l
USING "Like" older
WHERE l."userId" = older."userId"
  AND l."collectionId" = older."collectionId"
  AND l.id > older.id;

-- ---------------------------------------------------------------------------
-- Favorites: implicit m2m -> explicit table with a timestamp
-- ---------------------------------------------------------------------------
CREATE TABLE "Favorite" (
    "userId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","collectionId")
);

-- "A" = Collection.id, "B" = User.id (see 20260208205309_ns).
INSERT INTO "Favorite" ("userId", "collectionId")
SELECT "B", "A" FROM "_FavoriteCollections"
ON CONFLICT DO NOTHING;

ALTER TABLE "_FavoriteCollections" DROP CONSTRAINT "_FavoriteCollections_A_fkey";
ALTER TABLE "_FavoriteCollections" DROP CONSTRAINT "_FavoriteCollections_B_fkey";
DROP TABLE "_FavoriteCollections";

-- ---------------------------------------------------------------------------
-- Chat: order by last activity, one chat per pair of users
-- ---------------------------------------------------------------------------
ALTER TABLE "Chat"
    ADD COLUMN "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "pairKey" TEXT;

UPDATE "Chat" c SET "lastMessageAt" = COALESCE(
    (SELECT MAX(m."createdAt") FROM "Message" m WHERE m."chatId" = c.id),
    c."createdAt"
);

-- "_ChatToUser": "A" = Chat.id, "B" = User.id. Only the oldest chat of a pair
-- gets the key; later duplicates stay usable but no new ones can be created.
WITH pairs AS (
    SELECT "A" AS chat_id, MIN("B") || ':' || MAX("B") AS pair_key
    FROM "_ChatToUser"
    GROUP BY "A"
    HAVING COUNT(*) = 2
), ranked AS (
    SELECT chat_id, pair_key, ROW_NUMBER() OVER (PARTITION BY pair_key ORDER BY chat_id) AS rn
    FROM pairs
)
UPDATE "Chat" c SET "pairKey" = r.pair_key
FROM ranked r
WHERE r.chat_id = c.id AND r.rn = 1;

-- ---------------------------------------------------------------------------
-- ModerationAction
-- ---------------------------------------------------------------------------
ALTER TABLE "ModerationAction"
    ADD COLUMN "impersonatorId" INTEGER,
    ADD COLUMN "targetMessageId" INTEGER;

-- ---------------------------------------------------------------------------
-- Report: typed target, typed reason, evidence snapshot, dedupe key
-- ---------------------------------------------------------------------------
ALTER TABLE "Report"
    ADD COLUMN "contentSnapshot" JSONB,
    ADD COLUMN "duplicateOfId" INTEGER,
    ADD COLUMN "sanctionId" INTEGER,
    ADD COLUMN "openKey" TEXT,
    ADD COLUMN "targetType" "ReportTargetType";

UPDATE "Report" SET "targetType" = (
    CASE
        WHEN "messageId" IS NOT NULL THEN 'MESSAGE'
        WHEN "commentId" IS NOT NULL THEN 'COMMENT'
        WHEN "collectionId" IS NOT NULL THEN 'COLLECTION'
        ELSE 'USER'
    END
)::"ReportTargetType";

ALTER TABLE "Report" ALTER COLUMN "targetType" SET NOT NULL;

ALTER TABLE "Report" ALTER COLUMN "reason" TYPE "ReportReason" USING (
    CASE
        WHEN UPPER("reason") IN ('SPAM', 'HARASSMENT', 'HATE', 'SCAM', 'ADULT', 'OTHER')
            THEN UPPER("reason")
        ELSE 'OTHER'
    END
)::"ReportReason";

-- Preserve evidence that still exists.
UPDATE "Report" r SET "contentSnapshot" = jsonb_build_object('text', m.content, 'createdAt', m."createdAt")
FROM "Message" m WHERE r."messageId" = m.id;

UPDATE "Report" r SET "contentSnapshot" = jsonb_build_object('text', c.text, 'createdAt', c."createdAt", 'collectionId', c."collectionId")
FROM "Comment" c WHERE r."commentId" = c.id;

UPDATE "Report" r SET "contentSnapshot" = jsonb_build_object('name', c.name, 'description', c.description, 'category', c.category, 'createdAt', c."createdAt")
FROM "Collection" c WHERE r."collectionId" = c.id;

-- Close open duplicates (same reporter, same target) keeping the oldest one.
UPDATE "Report" r
SET "status" = 'CLOSED',
    "verdict" = 'DUPLICATE',
    "reviewedAt" = NOW(),
    "resolution" = 'Auto-closed duplicate during migration.',
    "duplicateOfId" = (
        SELECT MIN(o.id) FROM "Report" o
        WHERE o."status" = 'OPEN'
          AND o."reporterId" = r."reporterId"
          AND o."targetUserId" = r."targetUserId"
          AND o."targetType" = r."targetType"
          AND COALESCE(o."messageId", 0) = COALESCE(r."messageId", 0)
          AND COALESCE(o."commentId", 0) = COALESCE(r."commentId", 0)
          AND COALESCE(o."collectionId", 0) = COALESCE(r."collectionId", 0)
    )
WHERE r."status" = 'OPEN'
  AND EXISTS (
    SELECT 1 FROM "Report" o
    WHERE o."status" = 'OPEN'
      AND o.id < r.id
      AND o."reporterId" = r."reporterId"
      AND o."targetUserId" = r."targetUserId"
      AND o."targetType" = r."targetType"
      AND COALESCE(o."messageId", 0) = COALESCE(r."messageId", 0)
      AND COALESCE(o."commentId", 0) = COALESCE(r."commentId", 0)
      AND COALESCE(o."collectionId", 0) = COALESCE(r."collectionId", 0)
  );

UPDATE "Report"
SET "openKey" = "reporterId" || ':' || "targetType" || ':' || COALESCE("messageId", "commentId", "collectionId", "targetUserId")
WHERE "status" = 'OPEN';

-- ---------------------------------------------------------------------------
-- Notification.collection: cascade instead of dangling "liked your post"
-- ---------------------------------------------------------------------------
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_collectionId_fkey";
DELETE FROM "Notification" n
WHERE n."collectionId" IS NULL AND n."type" IN ('LIKE', 'FAVORITE', 'COMMENT');

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
DROP INDEX "Like_userId_idx";

CREATE UNIQUE INDEX "Chat_pairKey_key" ON "Chat"("pairKey");
CREATE INDEX "Chat_lastMessageAt_idx" ON "Chat"("lastMessageAt");
CREATE INDEX "Favorite_collectionId_createdAt_idx" ON "Favorite"("collectionId", "createdAt");
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");
CREATE UNIQUE INDEX "Like_userId_collectionId_key" ON "Like"("userId", "collectionId");
CREATE INDEX "Message_recipientUserId_read_idx" ON "Message"("recipientUserId", "read");
CREATE INDEX "Notification_recipientUserId_createdAt_idx" ON "Notification"("recipientUserId", "createdAt");
CREATE UNIQUE INDEX "Report_openKey_key" ON "Report"("openKey");
CREATE INDEX "Report_reporterId_createdAt_idx" ON "Report"("reporterId", "createdAt");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");

-- ---------------------------------------------------------------------------
-- Foreign keys
-- ---------------------------------------------------------------------------
ALTER TABLE "Admin" ADD CONSTRAINT "Admin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_duplicateOfId_fkey" FOREIGN KEY ("duplicateOfId") REFERENCES "Report"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Report" ADD CONSTRAINT "Report_sanctionId_fkey" FOREIGN KEY ("sanctionId") REFERENCES "AccountSanction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Like" ADD CONSTRAINT "Like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
