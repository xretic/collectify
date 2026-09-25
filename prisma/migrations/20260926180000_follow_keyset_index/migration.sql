
-- DropIndex
DROP INDEX "Follow_followingId_idx";

-- CreateIndex
CREATE INDEX "Follow_followingId_followerId_idx" ON "Follow"("followingId", "followerId");

