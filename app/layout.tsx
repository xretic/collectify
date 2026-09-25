import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getTranslations } from 'next-intl/server';
import './globals.css';
import './themes.css';
import { AppProviders } from '@/app/providers/AppProviders';
import { themeInitScript } from '@/shared/model/themeStore';
import { I18nBridge } from '@/shared/i18n/I18nBridge';
import { Toaster } from '@/shared/ui/Toaster';
import { ImageEditorHost } from '@/shared/ui/ImageEditor';
import NavBar from '@/widgets/layout/ui/NavBar';
import Footer from '@/widgets/layout/ui/Footer';
import { ReportDialog } from '@/features/report/create/ui/ReportDialog';
import { NotificationToasts } from '@/features/notification/ui/NotificationToasts';

const googleSans = localFont({
    src: [{ path: '../public/fonts/GoogleSans-SemiBold.ttf', weight: '400', style: 'normal' }],
    variable: '--font-google-sans',
});

const rubikMedium = localFont({
    src: [{ path: '../public/fonts/Rubik-Medium.ttf', weight: '500', style: 'normal' }],
    variable: '--font-rubik-medium',
});

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('meta');

    return {
        title: { default: 'Collectify', template: '%s — Collectify' },
        description: t('description'),
    };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
    const locale = await getLocale();

    return (
        <html
            className={`${googleSans.variable} ${rubikMedium.variable}`}
            lang={locale}
            suppressHydrationWarning
        >
            <head>
                {/* Applies the saved theme before first paint (no light/dark flash). */}
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
            <body>
                <NextIntlClientProvider>
                    <I18nBridge />
                    <AppProviders>
                        <NavBar />
                        <main className="app-content">{children}</main>
                        <Footer />
                        <Toaster />
                        <ImageEditorHost />
                        <ReportDialog />
                        <NotificationToasts />
                    </AppProviders>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
