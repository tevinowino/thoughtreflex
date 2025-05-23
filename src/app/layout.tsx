
// Removed 'use client'; to allow metadata export

import type { Metadata } from 'next';
import { Inter, Caveat } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import ServiceWorkerRegistrar from '@/components/app/service-worker-registrar';
import NotificationManager from '@/components/app/notification-manager'; // Import NotificationManager

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'ThoughtReflex - Your AI Therapy Journal',
  description: 'Reflect deeply. Heal gently. ThoughtReflex is your AI-powered therapist and emotional journal.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3C4A6B" />
        {/* Apple specific PWA meta tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ThoughtReflex" />
        {/* You would add actual apple-touch-icon links here if you have them */}
        {/* e.g., <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png"> */}
      </head>
      <body className={`${inter.variable} ${caveat.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
            <ServiceWorkerRegistrar />
            <NotificationManager /> {/* Add NotificationManager here */}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
