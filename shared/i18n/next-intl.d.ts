import type { Locale } from '@/shared/config/i18n';
import type en from './messages/en.json';

declare module 'next-intl' {
    interface AppConfig {
        Locale: Locale;
        Messages: typeof en;
    }
}
