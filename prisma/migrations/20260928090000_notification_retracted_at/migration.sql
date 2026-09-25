-- Undone follow/like/favorite/heart notifications are hidden, not deleted, so
-- toggling the action back does not notify the recipient again.
ALTER TABLE "Notification" ADD COLUMN "retractedAt" TIMESTAMP(3);
