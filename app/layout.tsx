import type { Metadata, Viewport } from 'next';
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
import { AuthPromptDialog } from '@/features/auth/ui/AuthPromptDialog';
import { NotificationToasts } from '@/features/notification/ui/NotificationToasts';
import { serverEnv, siteUrl } from '@/shared/server/env';
import { ogLocale, SITE_NAME } from '@/shared/i18n/metadata';

const googleSans = localFont({
    src: [{ path: '../public/fonts/GoogleSans-SemiBold.ttf', weight: '400', style: 'normal' }],
    variable: '--font-google-sans',
});

const rubikMedium = localFont({
    src: [{ path: '../public/fonts/Rubik-Medium.ttf', weight: '500', style: 'normal' }],
    variable: '--font-rubik-medium',
});

export async function generateMetadata(): Promise<Metadata> {
    const [t, locale] = await Promise.all([getTranslations('meta'), getLocale()]);
    const bing = serverEnv.BING_SITE_VERIFICATION;

    return {
        metadataBase: siteUrl(),
        title: { default: t('title'), template: `%s - ${SITE_NAME}` },
        description: t('description'),
        applicationName: SITE_NAME,
        keywords: t('keywords')
            .split(',')
            .map((keyword) => keyword.trim()),
        authors: [{ name: SITE_NAME, url: '/' }],
        creator: SITE_NAME,
        publisher: SITE_NAME,
        category: 'social',
        openGraph: {
            siteName: SITE_NAME,
            type: 'website',
            locale: ogLocale(locale),
            title: t('title'),
            description: t('description'),
        },
        twitter: { card: 'summary_large_image', title: t('title'), description: t('description') },
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-image-preview': 'large',
                'max-snippet': -1,
                'max-video-preview': -1,
            },
        },
        appleWebApp: { title: SITE_NAME, capable: true, statusBarStyle: 'default' },
        formatDetection: { telephone: false, email: false, address: false },
        verification: {
            google: serverEnv.GOOGLE_SITE_VERIFICATION,
            yandex: serverEnv.YANDEX_VERIFICATION,
            other: bing ? { 'msvalidate.01': bing } : undefined,
        },
    };
}

export const viewport: Viewport = {
    themeColor: [
        { media: '(prefers-color-scheme: light)', color: '#f3f4f6' },
        { media: '(prefers-color-scheme: dark)', color: '#111318' },
    ],
};

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
                        <AuthPromptDialog />
                        <NotificationToasts />
                    </AppProviders>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
