-- Record of consent: when the user accepted the Terms and Privacy Policy and confirmed being 18+.
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
