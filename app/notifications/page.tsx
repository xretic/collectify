import type { Metadata } from 'next';
import NotificationsPage from '@/views/notifications/ui/NotificationsPage';

export const metadata: Metadata = { title: 'Notifications' };

export default function NotificationsRoute() {
    return <NotificationsPage />;
}
