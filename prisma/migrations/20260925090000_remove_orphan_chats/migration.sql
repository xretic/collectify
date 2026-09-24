-- Chats whose other participant was deleted before account deletion started
-- removing chats. They cannot be used anymore ("Deleted account"), so drop them.
-- "_ChatToUser": "A" = Chat.id, "B" = User.id.
DELETE FROM "Chat" c
WHERE (SELECT COUNT(*) FROM "_ChatToUser" cu WHERE cu."A" = c.id) < 2;
