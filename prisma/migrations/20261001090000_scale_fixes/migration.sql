-- 1. Denormalized like counter: feeds, recommendations and the category
--    showcase rank by popularity without counting "Like" rows per collection.
ALTER TABLE "Collection" ADD COLUMN "likeCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "Collection" c
SET "likeCount" = l.n
FROM (SELECT "collectionId", COUNT(*)::int AS n FROM "Like" GROUP BY "collectionId") l
WHERE l."collectionId" = c.id;

CREATE FUNCTION "collection_like_count"() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "Collection" SET "likeCount" = "likeCount" + 1 WHERE "id" = NEW."collectionId";
        RETURN NEW;
    END IF;

    UPDATE "Collection" SET "likeCount" = GREATEST("likeCount" - 1, 0) WHERE "id" = OLD."collectionId";
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Like_count"
AFTER INSERT OR DELETE ON "Like"
FOR EACH ROW EXECUTE FUNCTION "collection_like_count"();

CREATE INDEX "Collection_private_likeCount_idx" ON "Collection"("private", "likeCount" DESC);
CREATE INDEX "Collection_private_categoryId_likeCount_idx" ON "Collection"("private", "categoryId", "likeCount" DESC);

-- 2. "Tag"."usageCount" only counts public collections, so attaching a fresh
--    (possibly spam) tag to a private collection does not make it suggested to
--    everyone. Private/public toggles and collection deletes keep it in sync.
CREATE OR REPLACE FUNCTION "collection_tag_usage"() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "Tag" SET "usageCount" = "usageCount" + 1
        WHERE "id" = NEW."tagId"
          AND EXISTS (SELECT 1 FROM "Collection" c WHERE c.id = NEW."collectionId" AND c.private = FALSE);
        RETURN NEW;
    END IF;

    -- On a cascaded collection delete the collection row is already gone and
    -- "Collection_tag_release" has released its tags.
    UPDATE "Tag" SET "usageCount" = GREATEST("usageCount" - 1, 0)
    WHERE "id" = OLD."tagId"
      AND EXISTS (SELECT 1 FROM "Collection" c WHERE c.id = OLD."collectionId" AND c.private = FALSE);
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION "collection_tag_visibility"() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF NOT OLD.private THEN
            UPDATE "Tag" t SET "usageCount" = GREATEST(t."usageCount" - 1, 0)
            FROM "CollectionTag" ct
            WHERE ct."collectionId" = OLD.id AND t.id = ct."tagId";
        END IF;
        RETURN OLD;
    END IF;

    IF OLD.private IS DISTINCT FROM NEW.private THEN
        UPDATE "Tag" t
        SET "usageCount" = GREATEST(t."usageCount" + CASE WHEN NEW.private THEN -1 ELSE 1 END, 0)
        FROM "CollectionTag" ct
        WHERE ct."collectionId" = NEW.id AND t.id = ct."tagId";
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "Collection_tag_release"
BEFORE DELETE ON "Collection"
FOR EACH ROW EXECUTE FUNCTION "collection_tag_visibility"();

CREATE TRIGGER "Collection_tag_visibility"
AFTER UPDATE OF "private" ON "Collection"
FOR EACH ROW EXECUTE FUNCTION "collection_tag_visibility"();

UPDATE "Tag" t
SET "usageCount" = (
    SELECT COUNT(*)::int
    FROM "CollectionTag" ct
    JOIN "Collection" c ON c.id = ct."collectionId"
    WHERE ct."tagId" = t.id AND c.private = FALSE
);

-- 3. Newest collections of a tag (recommendation candidates) straight from the index.
DROP INDEX "CollectionTag_tagId_idx";
CREATE INDEX "CollectionTag_tagId_collectionId_idx" ON "CollectionTag"("tagId", "collectionId");

-- 4. Social notification dedupe lookup (sender + recipient + type).
CREATE INDEX "Notification_recipientUserId_senderUserId_type_idx" ON "Notification"("recipientUserId", "senderUserId", "type");
