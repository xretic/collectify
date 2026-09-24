-- CreateEnum
CREATE TYPE "SanctionScope" AS ENUM ('ACCOUNT', 'COMMENTS', 'MESSENGER');

-- CreateTable
CREATE TABLE "AccountSanction" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "moderatorId" INTEGER,
    "scope" "SanctionScope" NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountSanction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModerationAction" (
    "id" SERIAL NOT NULL,
    "actorId" INTEGER,
    "targetUserId" INTEGER,
    "targetCollectionId" INTEGER,
    "targetCommentId" INTEGER,
    "action" TEXT NOT NULL,
    "reason" TEXT NOT NULL DEFAULT '',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AccountSanction_userId_scope_idx" ON "AccountSanction"("userId", "scope");

-- CreateIndex
CREATE INDEX "AccountSanction_revokedAt_expiresAt_idx" ON "AccountSanction"("revokedAt", "expiresAt");

-- CreateIndex
CREATE INDEX "ModerationAction_actorId_createdAt_idx" ON "ModerationAction"("actorId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationAction_targetUserId_createdAt_idx" ON "ModerationAction"("targetUserId", "createdAt");

-- AddForeignKey
ALTER TABLE "AccountSanction" ADD CONSTRAINT "AccountSanction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountSanction" ADD CONSTRAINT "AccountSanction_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetUserId_fkey" FOREIGN KEY ("targetUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetCollectionId_fkey" FOREIGN KEY ("targetCollectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModerationAction" ADD CONSTRAINT "ModerationAction_targetCommentId_fkey" FOREIGN KEY ("targetCommentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
