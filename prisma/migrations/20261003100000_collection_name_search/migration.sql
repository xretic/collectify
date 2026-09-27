-- Substring search on collection names (global search, Explore).
CREATE INDEX "Collection_lowerCaseName_trgm_idx" ON "Collection" USING GIN ("lowerCaseName" gin_trgm_ops);
