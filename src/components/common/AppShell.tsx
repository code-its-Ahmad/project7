import { Suspense, type ReactNode } from 'react';
import LayoutSkeleton from './LayoutSkeleton';
import DebugStatusBanner from './DebugStatusBanner';
import ClientLogOverlay from './ClientLogOverlay';
import AppErrorBoundary from './AppErrorBoundary';

/**
 * The single layout every route renders inside.
 *
 * Guarantees three things regardless of which route is active:
 *  1. a structured skeleton instead of a blank frame while a chunk loads,
 *  2. an error boundary that keeps failures inside the shell,
 *  3. the diagnostics surfaces (log overlay + dev status strip).
 */
const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="relative flex min-h-dvh flex-col bg-background text-foreground">
    <main className="flex-1">
      <AppErrorBoundary>
        <Suspense fallback={<LayoutSkeleton />}>{children}</Suspense>
      </AppErrorBoundary>
    </main>

    <ClientLogOverlay />
    <DebugStatusBanner />
  </div>
);

export default AppShell;
