
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "birthDate" DATE,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "cityKey" TEXT,
ADD COLUMN     "country" TEXT;

-- CreateIndex
CREATE INDEX "User_country_cityKey_idx" ON "User"("country", "cityKey");

