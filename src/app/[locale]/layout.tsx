import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono, IM_Fell_English_SC } from 'next/font/google';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';

import { THEME_COOKIE_KEY } from '@/components/providers/ThemeProvider';

import { Providers } from '@/components/providers';
import { routing } from '@/i18n/routing';

import '../globals.css';

const geistSans = Geist({ subsets: ['latin'], variable: '--font-geist-sans' });
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' });
const bento = localFont({
  src: '../../../public/fonts/Bento.ttf',
  variable: '--font-bento',
  display: 'swap',
});
const fell = IM_Fell_English_SC({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-fell',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Personal Dashboard',
    default: 'Personal Dashboard',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  description: 'A production-ready Next.js dashboard starter',
  keywords: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
  authors: [{ name: 'Your Name' }],
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    siteName: 'Personal Dashboard',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#030b1a' },
  ],
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  const messages = await getMessages();

  // Resolve the theme on the server from a cookie so the correct <html> class is
  // present in the initial HTML — avoids a flash without an inline script.
  const cookieStore = await cookies();
  const themeClass = cookieStore.get(THEME_COOKIE_KEY)?.value === 'light' ? 'light' : 'dark';

  return (
    <html
      lang={locale}
      className={themeClass}
      style={{ colorScheme: themeClass }}
      suppressHydrationWarning
    >
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${bento.variable} ${fell.variable} min-h-screen bg-background font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
