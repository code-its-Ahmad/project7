import { useEffect, useState } from 'react';
import {
  clearClientLog,
  subscribeClientLog,
  type ClientLogEntry,
} from '@/lib/clientLogger';

/**
 * Surfaces captured client failures in the UI.
 *
 * In development every entry is shown (missing imports, rejected dynamic
 * chunks, asset 404s). In production only hard errors appear, and only as a
 * compact, dismissible notice — never a wall of stack traces for a visitor.
 */
const ClientLogOverlay = () => {
  const [entries, setEntries] = useState<ClientLogEntry[]>([]);
  const [dismissed, setDismissed] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => subscribeClientLog(setEntries), []);

  const relevant = import.meta.env.DEV ? entries : entries.filter((e) => e.level === 'error');

  useEffect(() => {
    if (relevant.length > 0) setDismissed(false);
  }, [relevant.length]);

  if (dismissed || relevant.length === 0) return null;

  return (
    <div className="fixed bottom-3 right-3 z-[9999] w-[min(24rem,calc(100vw-1.5rem))]">
      <div className="rounded-xl border border-destructive/40 bg-card/95 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
          <p className="text-xs font-semibold text-destructive">
            {relevant.length} client issue{relevant.length > 1 ? 's' : ''} captured
          </p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => clearClientLog()}
              className="rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="rounded-md px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Dismiss diagnostics"
            >
              Hide
            </button>
          </div>
        </div>

        <ul className="custom-scrollbar max-h-64 divide-y divide-border/50 overflow-auto">
          {relevant.map((entry) => (
            <li key={entry.id} className="px-3 py-2">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                className="w-full text-left"
              >
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                  {entry.source}
                </span>
                <span className="mt-0.5 block break-words text-[11px] leading-relaxed text-foreground">
                  {entry.message}
                </span>
              </button>
              {expandedId === entry.id && entry.stack && (
                <pre className="custom-scrollbar mt-2 max-h-40 overflow-auto rounded-lg bg-muted/60 p-2 text-[10px] leading-relaxed text-muted-foreground">
                  {entry.stack}
                </pre>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ClientLogOverlay;
