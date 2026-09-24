-- Btree index for the default management user listing (ORDER BY "createdAt" DESC).
CREATE INDEX IF NOT EXISTS "User_createdAt_idx" ON "User" ("createdAt");

-- Trigram indexes to make case-insensitive substring search (ILIKE '%q%')
-- on the management users panel index-backed instead of a sequential scan.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "User_username_trgm_idx"
    ON "User" USING gin ("username" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "User_fullName_trgm_idx"
    ON "User" USING gin ("fullName" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "User_email_trgm_idx"
    ON "User" USING gin ("email" gin_trgm_ops);
