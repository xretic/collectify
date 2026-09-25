-- Direct messages can no longer be reported, and staff no longer see them.
DELETE FROM "Report" WHERE "targetType" = 'MESSAGE';

DROP INDEX "Report_messageId_idx";
ALTER TABLE "Report" DROP CONSTRAINT "Report_messageId_fkey";
ALTER TABLE "Report" DROP COLUMN "messageId";

ALTER TABLE "ModerationAction" DROP COLUMN "targetMessageId";

ALTER TYPE "ReportTargetType" RENAME TO "ReportTargetType_old";
CREATE TYPE "ReportTargetType" AS ENUM ('USER', 'COMMENT', 'COLLECTION');
ALTER TABLE "Report"
    ALTER COLUMN "targetType" TYPE "ReportTargetType"
    USING ("targetType"::text::"ReportTargetType");
DROP TYPE "ReportTargetType_old";
