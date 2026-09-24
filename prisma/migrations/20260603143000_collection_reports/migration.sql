ALTER TABLE "Report" ADD COLUMN "collectionId" INTEGER;

CREATE INDEX "Report_collectionId_idx" ON "Report"("collectionId");

ALTER TABLE "Report" ADD CONSTRAINT "Report_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
