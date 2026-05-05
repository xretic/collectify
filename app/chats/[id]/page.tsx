'use client';

import ChatsPage from '@/widgets/chat/list/ui/ChatsPage';
import { useParams } from 'next/navigation';

export default function ChatRoute() {
    const params = useParams<{ id: string }>();
    const chatId = Number(params.id);

    return <ChatsPage chatId={chatId} />;
}
