
-- CreateTable
CREATE TABLE "Board" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardCollection" (
    "boardId" INTEGER NOT NULL,
    "collectionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BoardCollection_pkey" PRIMARY KEY ("boardId","collectionId")
);

-- CreateIndex
CREATE INDEX "Board_userId_createdAt_idx" ON "Board"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Board_userId_name_key" ON "Board"("userId", "name");

-- CreateIndex
CREATE INDEX "BoardCollection_collectionId_idx" ON "BoardCollection"("collectionId");

-- CreateIndex
CREATE INDEX "BoardCollection_boardId_createdAt_idx" ON "BoardCollection"("boardId", "createdAt");

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardCollection" ADD CONSTRAINT "BoardCollection_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardCollection" ADD CONSTRAINT "BoardCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

