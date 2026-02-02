import { Metadata } from 'next';
import NavBar from '@/components/NavBar/NavBar';
import localFont from 'next/font/local';
import './globals.css';
import { UserProvider } from '@/context/UserProvider';
import { GlobalLoader } from '@/components/GlobalLoader/GlobalLoader';
import Script from 'next/script';
import ClientThemeProvider from '@/components/ClientThemeProvider/ClientThemeProvider';

const googleSans = localFont({
    src: [
        {
            path: '../public/fonts/GoogleSans-SemiBold.ttf',
            weight: '400',
            style: 'normal',
        },
    ],
    variable: '--font-google-sans',
});

const rubikMedium = localFont({
    src: [
        {
            path: '../public/fonts/Rubik-Medium.ttf',
            weight: '500',
            style: 'normal',
        },
    ],
    variable: '--font-rubik-medium',
});

export const metadata: Metadata = {
    title: 'Collectify',
    description: 'Create your interesting collection with us.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html className={`${googleSans.variable} ${rubikMedium.variable}`} lang="en">
            <body>
                <Script id="uploadcare-key" strategy="beforeInteractive">
                    {`UPLOADCARE_PUBLIC_KEY = '${process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY}';`}
                </Script>
                <Script
                    src="https://ucarecdn.com/libs/widget/3.x/uploadcare.full.min.js"
                    strategy="beforeInteractive"
                />

                <ClientThemeProvider>
                    <UserProvider>
                        <NavBar />
                        <GlobalLoader />
                        {children}
                    </UserProvider>
                </ClientThemeProvider>
            </body>
        </html>
    );
}
