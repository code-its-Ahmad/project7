import { Component, type ErrorInfo, type ReactNode } from 'react';
import { logRenderFailure } from '@/lib/clientLogger';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  componentStack: string | null;
}

/**
 * Top-level safety net.
 *
 * Previously an uncaught render error anywhere in the tree — a failed WebGL
 * context, a malformed API payload, a missing import — unmounted the entire app
 * and left the visitor on a blank white page. This keeps the failure
 * observable (console + client log) and, critically, recoverable without
 * losing the session.
 */
class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep the component stack — React strips it from the bare Error object.
    this.setState({ componentStack: info.componentStack ?? null });
    logRenderFailure(error, info.componentStack ?? undefined);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ error: null, componentStack: null });
  };

  render() {
    const { error, componentStack } = this.state;
    if (!error) return this.props.children;

    const trace = [error.stack ?? error.message, componentStack].filter(Boolean).join('\n\n');

    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground">
        <div className="w-full max-w-xl rounded-2xl border border-destructive/30 bg-card p-6 text-center shadow-xl">
          <h1 className="text-lg font-bold text-destructive">Something went wrong</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            An unexpected error interrupted this page. You can retry without losing your place, or
            reload for a clean start.
          </p>

          <p className="mt-3 break-words rounded-lg bg-muted/60 px-3 py-2 font-mono text-[11px] text-foreground">
            {error.message || 'Unknown error'}
          </p>

          <details className="mt-3 text-left">
            <summary className="cursor-pointer text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
              Show stack trace
            </summary>
            <pre className="custom-scrollbar mt-2 max-h-56 overflow-auto rounded-lg bg-muted/60 p-3 text-[10px] leading-relaxed text-muted-foreground">
              {trace}
            </pre>
          </details>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={this.handleReset}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.98]"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={this.handleReload}
              className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-muted active:scale-[0.98]"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
