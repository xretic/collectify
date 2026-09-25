
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_REPLY';
ALTER TYPE "NotificationType" ADD VALUE 'COMMENT_LIKED';

-- AlterTable
ALTER TABLE "Comment" ADD COLUMN     "editedAt" TIMESTAMP(3),
ADD COLUMN     "likedByAuthor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentId" INTEGER,
ADD COLUMN     "replyToUserId" INTEGER;

-- CreateIndex
CREATE INDEX "Comment_collectionId_parentId_id_idx" ON "Comment"("collectionId", "parentId", "id");

-- CreateIndex
CREATE INDEX "Comment_parentId_id_idx" ON "Comment"("parentId", "id");

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_replyToUserId_fkey" FOREIGN KEY ("replyToUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

