-- UI language chosen at registration or in settings.
ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
