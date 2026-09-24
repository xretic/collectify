'use client';

import Link from 'next/link';
import { Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useSessionUser } from '@/entities/user/model/useSessionUser';
import { ChatList } from '@/widgets/chat-list/ui/ChatList';
import { ChatWindow } from '@/widgets/chat-window/ui/ChatWindow';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Spinner } from '@/shared/ui/Spinner';
import styles from './ChatsPage.module.css';

/** `/chats` shows the list; `/chats/[id]` also opens the chat (the URL is the source of truth). */
export default function ChatsPage({ chatId = null }: { chatId?: number | null }) {
    const { user, loading } = useSessionUser();

    if (loading || !user) return <Spinner variant="page" />;

    return (
        <div className={`${styles.page} ${chatId ? styles.chatOpen : ''}`}>
            <div className={styles.listColumn}>
                <ChatList activeChatId={chatId} viewerId={user.id} />
            </div>

            <div className={styles.chatColumn}>
                {chatId && (
                    <Button
                        component={Link}
                        href="/chats"
                        startIcon={<ArrowBackIcon />}
                        className={styles.back}
                    >
                        Chats
                    </Button>
                )}

                {chatId ? (
                    <ChatWindow key={chatId} chatId={chatId} viewer={user} />
                ) : (
                    <EmptyState
                        title="Pick a chat from the left"
                        description="Your conversations will show up here."
                    />
                )}
            </div>
        </div>
    );
}
