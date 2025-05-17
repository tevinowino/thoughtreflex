
import type { Metadata } from 'next';
import { Inter, Caveat } from 'next/font/google'; // Import Caveat
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const caveat = Caveat({ // Configure Caveat font
  subsets: ['latin'],
  variable: '--font-caveat',
  weight: ['400', '700'], // Specify weights you'll use
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
      <body className={`${inter.variable} ${caveat.variable} font-sans antialiased`}> {/* Add caveat.variable */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
