'use client';

import { useParams } from 'next/navigation';
import ChatsPage from '../page';

export default function ChatsPageWithId() {
    const params = useParams();
    const chatId = Number(params.id);

    return <ChatsPage chatId={chatId} />;
}
