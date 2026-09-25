import type { Metadata, Viewport } from 'next';
import ChatsPage from '@/views/chats/ui/ChatsPage';

export const metadata: Metadata = { title: 'Chats' };

// The on-screen keyboard shrinks the layout, so the composer stays above it.
export const viewport: Viewport = { interactiveWidget: 'resizes-content' };

export default function ChatsRoute() {
    return <ChatsPage />;
}
