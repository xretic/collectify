'use client';

import ChatsPage from '@/views/chats/ui/ChatsPage';
import { useParams } from 'next/navigation';

export default function ChatRoute() {
    const params = useParams<{ id: string }>();
    const chatId = Number(params.id);

    return <ChatsPage chatId={chatId} />;
}
