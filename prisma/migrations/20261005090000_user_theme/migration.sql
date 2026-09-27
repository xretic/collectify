-- AlterTable
ALTER TABLE "User" ADD COLUMN "theme" TEXT,
ADD COLUMN "customThemes" JSONB NOT NULL DEFAULT '[]';
