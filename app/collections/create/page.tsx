import type { Metadata } from 'next';
import CreateCollectionPage from '@/views/create-collection/ui/CreateCollectionPage';

export const metadata: Metadata = { title: 'Create collection' };

export default function CreateCollectionRoute() {
    return <CreateCollectionPage />;
}
