import { useEffect, useState } from 'react';

type HmrState = 'connected' | 'reconnecting' | 'disconnected' | 'n/a';

/** Injected by vite.config.ts `define`. */
declare const __BUILD_TIME__: string | undefined;

const BUILD_TIME =
  typeof __BUILD_TIME__ === 'string' ? __BUILD_TIME__ : new Date().toISOString();

const formatBuildTime = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

/**
 * Dev-only status strip.
 *
 * Answers the two questions that come up whenever the preview looks stale or
 * unstyled: *is this the build I just made?* and *is HMR still attached?*
 * It also probes whether Tailwind's utility layer actually landed, which is the
 * usual culprit behind an "unstyled page" report.
 */
const DebugStatusBanner = () => {
  const [hmr, setHmr] = useState<HmrState>(import.meta.hot ? 'connected' : 'n/a');
  const [tailwindOk, setTailwindOk] = useState<boolean | null>(null);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    // Probe: if Tailwind's utilities compiled, `.hidden` resolves to display:none.
    const probe = document.createElement('div');
    probe.className = 'hidden';
    document.body.appendChild(probe);
    setTailwindOk(getComputedStyle(probe).display === 'none');
    probe.remove();
  }, []);

  useEffect(() => {
    const hot = import.meta.hot;
    if (!hot) return;

    const onBeforeUpdate = () => setHmr('connected');
    const onError = () => setHmr('disconnected');

    hot.on('vite:beforeUpdate', onBeforeUpdate);
    hot.on('vite:error', onError);
    hot.on('vite:ws:disconnect', onError);
    hot.on('vite:ws:connect', onBeforeUpdate);

    return () => {
      hot.off?.('vite:beforeUpdate', onBeforeUpdate);
      hot.off?.('vite:error', onError);
      hot.off?.('vite:ws:disconnect', onError);
      hot.off?.('vite:ws:connect', onBeforeUpdate);
    };
  }, []);

  if (!import.meta.env.DEV) return null;

  const dot = (ok: boolean | null) =>
    ok === null ? 'bg-muted-foreground' : ok ? 'bg-emerald-500' : 'bg-destructive';

  return (
    <div className="pointer-events-none fixed bottom-2 left-2 z-[9998] font-mono text-[10px]">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        className="pointer-events-auto flex items-center gap-2 rounded-full border border-border/60 bg-card/90 px-2.5 py-1 text-muted-foreground shadow-lg backdrop-blur transition-colors hover:text-foreground"
        aria-expanded={!collapsed}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dot(hmr === 'connected' || hmr === 'n/a')}`} />
        dev
      </button>

      {!collapsed && (
        <dl className="pointer-events-auto mt-1.5 w-56 space-y-1 rounded-xl border border-border/60 bg-card/95 p-2.5 text-muted-foreground shadow-xl backdrop-blur">
          <div className="flex items-center justify-between gap-2">
            <dt>build</dt>
            <dd className="text-foreground">{formatBuildTime(BUILD_TIME)}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt>vite hmr</dt>
            <dd className="flex items-center gap-1.5 text-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${dot(hmr === 'connected')}`} />
              {hmr}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt>tailwind</dt>
            <dd className="flex items-center gap-1.5 text-foreground">
              <span className={`h-1.5 w-1.5 rounded-full ${dot(tailwindOk)}`} />
              {tailwindOk === null ? 'probing' : tailwindOk ? 'active' : 'missing'}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
};

export default DebugStatusBanner;
