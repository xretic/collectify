import CreateCollectionPage from '@/views/create-collection/ui/CreateCollectionPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('createCollection');

export default function CreateCollectionRoute() {
    return <CreateCollectionPage />;
}
