import { memo } from 'react';
import { ShimmerPage } from './ShimmerSkeleton';

/**
 * Layout-level loading skeleton.
 *
 * Shown while a route chunk downloads *and* during Vite's cold-start
 * dependency warmup, so the first paint is always structured content rather
 * than a blank frame.
 */
const LayoutSkeleton = memo(() => (
  <div
    role="status"
    aria-live="polite"
    aria-busy="true"
    className="min-h-dvh bg-background text-foreground"
  >
    <span className="sr-only">Loading page…</span>
    <ShimmerPage />
  </div>
));

LayoutSkeleton.displayName = 'LayoutSkeleton';

export default LayoutSkeleton;
