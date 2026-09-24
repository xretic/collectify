-- AlterTable
ALTER TABLE "Session" ADD COLUMN "impersonatorUserId" INTEGER;

-- CreateIndex
CREATE INDEX "Session_impersonatorUserId_idx" ON "Session"("impersonatorUserId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_impersonatorUserId_fkey" FOREIGN KEY ("impersonatorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
