-- "Seen" receipts: when the recipient read the message.
ALTER TABLE "Message" ADD COLUMN "readAt" TIMESTAMP(3);

UPDATE "Message" SET "readAt" = "createdAt" WHERE "read" = true;

-- Latest seen message of a sender in a chat.
CREATE INDEX "Message_chatId_userId_readAt_idx" ON "Message"("chatId", "userId", "readAt");
