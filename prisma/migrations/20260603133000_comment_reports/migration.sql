ALTER TABLE "Report" ADD COLUMN "commentId" INTEGER;

CREATE INDEX "Report_commentId_idx" ON "Report"("commentId");

ALTER TABLE "Report" ADD CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
