/**
 * Client-side diagnostic log.
 *
 * A render failure (a missing import, a bad default export, a thrown hook)
 * previously vanished into the browser console — and in production the visitor
 * simply saw nothing. This module gives every failure exactly one place to
 * land: it mirrors entries to the console *and* keeps them in memory so the UI
 * can surface them (see `ClientLogOverlay`).
 */

export type ClientLogLevel = 'error' | 'warn' | 'info';

export interface ClientLogEntry {
  id: number;
  level: ClientLogLevel;
  source: string;
  message: string;
  stack?: string;
  at: number;
}

const MAX_ENTRIES = 50;

let nextId = 1;
let entries: ClientLogEntry[] = [];
const listeners = new Set<(entries: ClientLogEntry[]) => void>();

const emit = () => {
  const snapshot = entries;
  listeners.forEach((listener) => listener(snapshot));
};

/** Subscribe to the log. Returns an unsubscribe function. */
export const subscribeClientLog = (listener: (entries: ClientLogEntry[]) => void) => {
  listeners.add(listener);
  listener(entries);
  return () => {
    listeners.delete(listener);
  };
};

export const getClientLog = () => entries;

export const clearClientLog = () => {
  entries = [];
  emit();
};

const normalise = (value: unknown): { message: string; stack?: string } => {
  if (value instanceof Error) {
    return { message: `${value.name}: ${value.message}`, stack: value.stack };
  }
  if (typeof value === 'string') return { message: value };
  try {
    return { message: JSON.stringify(value) };
  } catch {
    return { message: String(value) };
  }
};

export const logClientEvent = (
  level: ClientLogLevel,
  source: string,
  error: unknown,
  extraStack?: string,
) => {
  const { message, stack } = normalise(error);
  const entry: ClientLogEntry = {
    id: nextId++,
    level,
    source,
    message,
    stack: extraStack ? `${stack ?? ''}\n${extraStack}`.trim() : stack,
    at: Date.now(),
  };

  // Newest first, capped so a render loop cannot exhaust memory.
  entries = [entry, ...entries].slice(0, MAX_ENTRIES);

  const consoleMethod = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  consoleMethod(`[${source}] ${message}`, entry.stack ?? '');

  emit();
  return entry;
};

/** Convenience wrapper used by the error boundary. */
export const logRenderFailure = (error: unknown, componentStack?: string) =>
  logClientEvent('error', 'render', error, componentStack ?? undefined);

let installed = false;

/**
 * Installs window-level capture. Called once from the app entry so that
 * failures thrown *outside* React (dynamic import rejections from a missing
 * module, async callbacks) are recorded too.
 */
export const installClientLogging = () => {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    // Asset load failures (img/script/link) arrive without an Error object.
    if (event.error) {
      logClientEvent('error', 'window.error', event.error);
      return;
    }
    const target = event.target as HTMLElement | null;
    if (target && target !== (window as unknown as HTMLElement) && 'tagName' in target) {
      const url =
        (target as HTMLImageElement).src ?? (target as HTMLLinkElement).href ?? '(unknown url)';
      logClientEvent('warn', 'asset', `Failed to load <${target.tagName.toLowerCase()}>: ${url}`);
      return;
    }
    logClientEvent('error', 'window.error', event.message || 'Unknown error');
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    logClientEvent('error', 'unhandledrejection', event.reason);
  });
};
