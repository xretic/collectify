-- Collection browse/search: prefix search on lowerCaseName, author lookups,
-- and the private+category+createdAt combo used by the public browse feed.
CREATE INDEX IF NOT EXISTS "Collection_lowerCaseName_idx" ON "Collection" ("lowerCaseName");
CREATE INDEX IF NOT EXISTS "Collection_userId_idx" ON "Collection" ("userId");
CREATE INDEX IF NOT EXISTS "Collection_private_category_createdAt_idx"
    ON "Collection" ("private", "category", "createdAt");

-- Like: FK lookups back a `_count` aggregate on every collection list render
-- (search "popular" sort orders by likes._count).
CREATE INDEX IF NOT EXISTS "Like_collectionId_idx" ON "Like" ("collectionId");
CREATE INDEX IF NOT EXISTS "Like_userId_idx" ON "Like" ("userId");

-- Comment: management comment-history pagination and collection comment feed.
CREATE INDEX IF NOT EXISTS "Comment_collectionId_createdAt_idx" ON "Comment" ("collectionId", "createdAt");
CREATE INDEX IF NOT EXISTS "Comment_userId_createdAt_idx" ON "Comment" ("userId", "createdAt");
