import type { Viewport } from 'next';
import ChatsPage from '@/views/chats/ui/ChatsPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('chats');

// The on-screen keyboard shrinks the layout, so the composer stays above it.
export const viewport: Viewport = { interactiveWidget: 'resizes-content' };

export default function ChatsRoute() {
    return <ChatsPage />;
}
