import SettingsPage from '@/views/settings/ui/SettingsPage';
import { pageMetadata } from '@/shared/i18n/metadata';

export const generateMetadata = pageMetadata('settings');

export default function SettingsRoute() {
    return <SettingsPage />;
}
