import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { logClientEvent } from '@/lib/clientLogger';

/**
 * 404 fallback. Rendered inside the app shell like every other route, so a bad
 * URL never drops the visitor onto a bare, unstyled document.
 */
const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logClientEvent('warn', 'router', `404 — no route matched "${location.pathname}"`);
  }, [location.pathname]);

  return (
    <section className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        <p className="font-mono text-sm uppercase tracking-[0.35em] text-muted-foreground">
          Error 404
        </p>

        <h1 className="mt-4 bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-5xl font-black text-transparent sm:text-6xl">
          Page not found
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
          The route{' '}
          <code className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
            {location.pathname}
          </code>{' '}
          does not exist. It may have been renamed or never published.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="w-full rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:opacity-90 active:scale-[0.98] sm:w-auto"
          >
            Back to home
          </Link>
          <button
            type="button"
            onClick={() => window.history.back()}
            className="w-full rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:w-auto"
          >
            Go back
          </button>
        </div>
      </div>
    </section>
  );
};

export default NotFound;
