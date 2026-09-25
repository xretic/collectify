-- Per-participant mute of a chat's message notifications (`until` NULL = forever).
CREATE TABLE "ChatMute" (
    "userId" INTEGER NOT NULL,
    "chatId" INTEGER NOT NULL,
    "until" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMute_pkey" PRIMARY KEY ("userId","chatId")
);

CREATE INDEX "ChatMute_chatId_idx" ON "ChatMute"("chatId");

ALTER TABLE "ChatMute" ADD CONSTRAINT "ChatMute_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatMute" ADD CONSTRAINT "ChatMute_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
