import type { Metadata } from 'next';
import SettingsPage from '@/views/settings/ui/SettingsPage';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsRoute() {
    return <SettingsPage />;
}
