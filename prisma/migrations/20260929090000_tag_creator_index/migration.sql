-- Per-user daily limit on tag creation counts a user's recent tags.
CREATE INDEX "Tag_createdById_createdAt_idx" ON "Tag"("createdById", "createdAt");
