import { Suspense } from 'react';
import { headers } from 'next/headers';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { QueryProvider } from '@/components/providers/query-provider';
import { Toaster } from '@/components/ui/toaster';
import { NavigationProgress } from '@/components/navigation-progress';
import { getPreferences } from '@/server/preferences';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  // Keeps the fallback metrics close to Inter's so swapping does not reflow.
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: {
    default: 'Firefly Studio',
    template: '%s · Firefly Studio',
  },
  description: 'A modern front-end client for Firefly III personal finance.',
  applicationName: 'Firefly Studio',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f1f3f6' },
    { media: '(prefers-color-scheme: dark)', color: '#12141a' },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // next-themes writes an inline <script> to apply the stored theme before
  // first paint. Under the CSP (E23-02) an un-nonced inline script is blocked,
  // which does not error visibly — it just silently restores the light-mode
  // flash that script exists to prevent. The nonce comes from middleware.
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  // E18-02 — applied here, on the server, rather than by an effect in the
  // browser. An effect would blur the balances one paint AFTER they had
  // already been on screen, which is the one moment the preference exists to
  // prevent.
  const preferences = await getPreferences();

  return (
    // suppressHydrationWarning: next-themes writes the class on <html> before
    // React hydrates, which is exactly what prevents the light-mode flash.
    <html
      lang="en"
      suppressHydrationWarning
      className={inter.variable}
      data-hide-balances={preferences.hideBalances ? 'true' : undefined}
      data-reduced-motion={preferences.reducedMotion ? 'true' : undefined}
    >
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme={preferences.theme}
          enableSystem
          disableTransitionOnChange
          nonce={nonce}
        >
          <QueryProvider>
            {/* Suspense is required, not stylistic: the bar reads
                useSearchParams(), which without a boundary would opt every
                statically rendered page into client rendering. */}
            <Suspense fallback={null}>
              <NavigationProgress />
            </Suspense>
            <a
              href="#main"
              className="bg-primary text-primary-foreground sr-only rounded-md px-4 py-2 focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
            >
              Skip to content
            </a>
            {children}
            <Toaster />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
