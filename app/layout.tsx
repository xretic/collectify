import type { Metadata } from 'next';
import localFont from 'next/font/local';
import type { ReactNode } from 'react';
import './globals.css';
import './themes.css';
import { AppProviders } from '@/app/providers/AppProviders';
import { themeInitScript } from '@/shared/model/themeStore';
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

export const metadata: Metadata = {
    title: { default: 'Collectify', template: '%s — Collectify' },
    description: 'Create your interesting collection with us.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html
            className={`${googleSans.variable} ${rubikMedium.variable}`}
            lang="en"
            suppressHydrationWarning
        >
            <head>
                {/* Applies the saved theme before first paint (no light/dark flash). */}
                <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
            </head>
            <body>
                <AppProviders>
                    <NavBar />
                    <main className="app-content">{children}</main>
                    <Footer />
                    <Toaster />
                    <ImageEditorHost />
                    <ReportDialog />
                    <NotificationToasts />
                </AppProviders>
            </body>
        </html>
    );
}
