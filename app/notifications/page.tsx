import NotificationsPage from '@/views/notifications/ui/NotificationsPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('notifications');

export default function NotificationsRoute() {
    return <NotificationsPage />;
}
