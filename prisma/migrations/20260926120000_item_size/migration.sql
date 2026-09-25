-- CreateEnum
CREATE TYPE "ItemSize" AS ENUM ('S', 'M', 'L', 'XL');

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "size" "ItemSize" NOT NULL DEFAULT 'M',
ALTER COLUMN "title" SET DEFAULT '',
ALTER COLUMN "description" SET DEFAULT '';

