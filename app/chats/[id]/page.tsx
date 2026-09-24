import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ChatsPage from '@/views/chats/ui/ChatsPage';

export const metadata: Metadata = { title: 'Chats' };

export default async function ChatRoute({ params }: { params: Promise<{ id: string }> }) {
    const chatId = Number((await params).id);
    if (!Number.isInteger(chatId) || chatId <= 0) notFound();

    return <ChatsPage chatId={chatId} />;
}
