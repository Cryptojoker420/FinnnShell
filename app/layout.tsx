import localFont from 'next/font/local';
import React from 'react';
import '@/app/globals.css';
import { Header } from '@/components/header';
import { Toaster } from '@/components/ui/sonner';
import AppShell from '@/components/AppShell';
import { AI } from '@/lib/ai.server';
import { cn } from '@/lib/utils';
import { cookies } from 'next/headers';
import {
  createServerComponentClient,
} from '@supabase/auth-helpers-nextjs';
import RootClient from './root-client';
import { getURL } from '@/lib/utils/getURL';

const geistSans = localFont({
  src: '../public/fonts/GeistVariable.woff2',
  variable: '--font-geist-sans',
  display: 'swap',
});

const geistMono = localFont({
  src: '../public/fonts/GeistMonoVariable.woff2',
  variable: '--font-geist-mono',
  display: 'swap',
});

export const metadata = {
  metadataBase: new URL(getURL()),
  title: {
    default: 'FinnShell',
    template: '%s - FinnShell powered by Gary',
  },
  description: 'Talk to Gov. Finn. Watch live crypto flicker...',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'font-sans antialiased',
          geistSans.variable,
          geistMono.variable,
        )}
      >
        <Toaster position="top-center" />
        <RootClient session={session}>
          <AI>
            <AppShell>{children}</AppShell>
          </AI>
        </RootClient>
      </body>
    </html>
  );
}