-- One-time links sent by email (password reset, email confirmation).
CREATE TYPE "EmailTokenKind" AS ENUM ('PASSWORD_RESET', 'EMAIL_VERIFICATION');

ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3);

CREATE TABLE "EmailToken" (
    "id" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "kind" "EmailTokenKind" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailToken_userId_kind_idx" ON "EmailToken"("userId", "kind");
CREATE INDEX "EmailToken_expiresAt_idx" ON "EmailToken"("expiresAt");

ALTER TABLE "EmailToken" ADD CONSTRAINT "EmailToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OAuth accounts only get a real address when the provider verified it
-- (others use a placeholder), so those are confirmed already.
UPDATE "User" SET "emailVerifiedAt" = "createdAt"
WHERE ("googleId" IS NOT NULL OR "githubId" IS NOT NULL)
  AND "email" NOT LIKE '%@users.noreply.collectify';
