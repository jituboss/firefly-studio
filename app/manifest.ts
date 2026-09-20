import type { MetadataRoute } from 'next';

/**
 * E22-07 — the web app manifest, served at /manifest.webmanifest.
 *
 * `display: standalone` is the point of the exercise: on a phone this is a
 * money app you open several times a day, and a browser chrome that eats 100px
 * of a 844px screen for a URL bar nobody reads is worth removing.
 *
 * No `start_url` of `/dashboard`: the landing page is a per-account preference
 * (E18-02), and `/` resolves it. Hardcoding the dashboard here would have the
 * installed icon ignore a setting the browser tab honours.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Firefly Studio',
    short_name: 'Firefly',
    description: 'A modern web client for Firefly III personal finance.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    // Matches the <meta name="theme-color"> pair in the root layout, so the
    // installed app's status bar does not flip colour against the page.
    background_color: '#12141a',
    theme_color: '#12141a',
    categories: ['finance', 'productivity'],
    icons: [
      {
        src: '/icon.svg',
        type: 'image/svg+xml',
        sizes: 'any',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        type: 'image/png',
        sizes: '512x512',
        // The mark is a flame inset well within its rounded square, so it
        // survives the circular crop Android applies to a maskable icon.
        purpose: 'maskable',
      },
      {
        src: '/apple-icon.png',
        type: 'image/png',
        sizes: '180x180',
        purpose: 'any',
      },
    ],
  };
}
