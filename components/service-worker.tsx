'use client';

import * as React from 'react';

/**
 * E22-07 — register the service worker.
 *
 * Production only. In development the app is served by `next dev`, whose
 * chunks are not content-hashed and change on every edit; a worker caching
 * them serves yesterday's JavaScript and the next hour goes on debugging code
 * that is no longer in the file.
 *
 * Registration waits for `load` so it never competes with the first render for
 * bandwidth — the point of the worker is the second visit, not this one.
 */
export function ServiceWorker() {
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (!('serviceWorker' in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // An unregistrable worker is not a reason to break the page. It fails
        // on http origins that are not localhost, and in some private modes.
      });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
