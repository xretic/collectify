import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import ChatsPage from '@/views/chats/ui/ChatsPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('chats');

// The on-screen keyboard shrinks the layout, so the composer stays above it.
export const viewport: Viewport = { interactiveWidget: 'resizes-content' };

export default async function DraftChatRoute({ params }: { params: Promise<{ userId: string }> }) {
    const userId = Number((await params).userId);
    if (!Number.isInteger(userId) || userId <= 0) notFound();

    return <ChatsPage draftUserId={userId} />;
}
