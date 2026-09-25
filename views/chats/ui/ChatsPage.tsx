'use client';

import ForumRoundedIcon from '@mui/icons-material/ForumRounded';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { usePresenceUpdates } from '@/entities/chat/model/presenceStore';
import { useTypingUpdates } from '@/entities/chat/model/typingStore';
import { ChatList } from '@/widgets/chat-list/ui/ChatList';
import { ChatWindow } from '@/widgets/chat-window/ui/ChatWindow';
import { DraftChatWindow } from '@/widgets/chat-window/ui/ChatWindow/DraftChatWindow';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './ChatsPage.module.css';

type ChatsPageProps = {
    chatId?: number | null;
    /** `/chats/new/[userId]`: an unsent conversation with this user. */
    draftUserId?: number | null;
};

/**
 * `/chats` shows the inbox; `/chats/[id]` also opens the chat, `/chats/new/[userId]` a draft one
 * (the URL is the source of truth).
 */
export default function ChatsPage({ chatId = null, draftUserId = null }: ChatsPageProps) {
    const { user, loading } = useSessionUser();
    usePresenceUpdates();
    useTypingUpdates(user?.id);

    if (loading || !user) return <Spinner variant="page" />;

    if (user.impersonatorUserId) {
        return (
            <EmptyState
                title="Chats are private"
                description="Direct messages are not available while signed in as another user."
            />
        );
    }

    return (
        <div className={`${styles.page} ${chatId || draftUserId ? styles.chatOpen : ''}`}>
            <div className={styles.listColumn}>
                <ChatList activeChatId={chatId} viewer={user} />
            </div>

            <div className={styles.chatColumn}>
                {chatId ? (
                    <ChatWindow key={chatId} chatId={chatId} viewer={user} />
                ) : draftUserId ? (
                    <DraftChatWindow key={draftUserId} userId={draftUserId} viewer={user} />
                ) : (
                    <div className={styles.placeholder}>
                        <span className={styles.placeholderIcon}>
                            <ForumRoundedIcon />
                        </span>
                        <h2 className={styles.placeholderTitle}>Your chats</h2>
                        <p className={styles.placeholderText}>
                            Pick a conversation on the left to keep talking about collections.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
