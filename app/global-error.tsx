'use client';

/**
 * Catches failures in the root layout itself, where the normal error boundary
 * cannot mount. It must render its own <html>/<body> and cannot rely on the
 * app's CSS having loaded, so the styling here is deliberately inline.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          background: '#fbfbfd',
          color: '#1b1f2a',
        }}
      >
        <main style={{ textAlign: 'center', padding: '2rem', maxWidth: '32rem' }}>
          <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
            Firefly Studio failed to start
          </h1>
          <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1.5rem' }}>
            A fatal error occurred while rendering the application shell.
          </p>
          {error.digest ? (
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', opacity: 0.6 }}>
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#3b5bdb',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
