import type { Metadata } from 'next';
import ChatsPage from '@/views/chats/ui/ChatsPage';

export const metadata: Metadata = { title: 'Chats' };

export default function ChatsRoute() {
    return <ChatsPage />;
}
