/*
  Warnings:

  - Added the required column `recipientUserId` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "recipientUserId" INTEGER NOT NULL;
