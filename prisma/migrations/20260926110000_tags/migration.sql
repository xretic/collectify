-- CreateTable
CREATE TABLE "Tag" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionTag" (
    "collectionId" INTEGER NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionTag_pkey" PRIMARY KEY ("collectionId","tagId")
);

-- CreateIndex
CREATE INDEX "Tag_categoryId_usageCount_idx" ON "Tag"("categoryId", "usageCount" DESC);

-- CreateIndex
CREATE INDEX "Tag_normalized_trgm_idx" ON "Tag" USING GIN ("normalized" gin_trgm_ops);

-- CreateIndex
CREATE UNIQUE INDEX "Tag_categoryId_normalized_key" ON "Tag"("categoryId", "normalized");

-- CreateIndex
CREATE INDEX "CollectionTag_tagId_idx" ON "CollectionTag"("tagId");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTag" ADD CONSTRAINT "CollectionTag_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollectionTag" ADD CONSTRAINT "CollectionTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- "Tag"."usageCount" follows "CollectionTag" rows, including cascaded deletes
-- (a deleted collection releases its tags without application code).
CREATE FUNCTION "collection_tag_usage"() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE "Tag" SET "usageCount" = "usageCount" + 1 WHERE "id" = NEW."tagId";
        RETURN NEW;
    END IF;

    UPDATE "Tag" SET "usageCount" = GREATEST("usageCount" - 1, 0) WHERE "id" = OLD."tagId";
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "CollectionTag_usage"
AFTER INSERT OR DELETE ON "CollectionTag"
FOR EACH ROW EXECUTE FUNCTION "collection_tag_usage"();
