import { memo } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   SHIMMER SKELETON SYSTEM
   Premium shimmer placeholders that replace all loading spinners.
   All shapes use the `.shimmer-base` CSS class for the sweep animation.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Basic rectangular shimmer block. */
export const ShimmerBlock = memo(({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`shimmer-base shimmer-block ${className}`}
    style={style}
    aria-hidden="true"
  />
));
ShimmerBlock.displayName = 'ShimmerBlock';

/** Multi-line text placeholder with varying widths. */
export const ShimmerText = memo(({
  lines = 3,
  className = '',
}: {
  lines?: number;
  className?: string;
}) => (
  <div className={`space-y-2.5 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="shimmer-base shimmer-block shimmer-text"
        style={{ width: i === lines - 1 ? '60%' : i % 2 === 0 ? '100%' : '85%' }}
      />
    ))}
  </div>
));
ShimmerText.displayName = 'ShimmerText';

/** Large title placeholder. */
export const ShimmerTitle = memo(({ className = '' }: { className?: string }) => (
  <div className={`space-y-3 ${className}`} aria-hidden="true">
    <div className="shimmer-base shimmer-block shimmer-text-lg w-3/4" />
    <div className="shimmer-base shimmer-block shimmer-text w-1/2" />
  </div>
));
ShimmerTitle.displayName = 'ShimmerTitle';

/** Circular avatar shimmer. */
export const ShimmerAvatar = memo(({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) => (
  <div
    className={`shimmer-base shimmer-block shimmer-avatar ${className}`}
    style={{ width: size, height: size }}
    aria-hidden="true"
  />
));
ShimmerAvatar.displayName = 'ShimmerAvatar';

/** Card-shaped skeleton (image area + title + description lines). */
export const ShimmerCard = memo(({ className = '' }: { className?: string }) => (
  <div
    className={`rounded-2xl border border-white/5 dark:border-gray-800/50 bg-gray-100/50 dark:bg-gray-900/30 overflow-hidden ${className}`}
    aria-hidden="true"
  >
    {/* Image area */}
    <div className="shimmer-base shimmer-block h-44 w-full rounded-none" />
    {/* Content area */}
    <div className="p-4 space-y-3">
      <div className="shimmer-base shimmer-block shimmer-text-lg w-2/3" />
      <ShimmerText lines={2} />
      {/* Tags row */}
      <div className="flex gap-2 pt-1">
        <div className="shimmer-base shimmer-block h-6 w-16 rounded-full" />
        <div className="shimmer-base shimmer-block h-6 w-20 rounded-full" />
        <div className="shimmer-base shimmer-block h-6 w-14 rounded-full" />
      </div>
    </div>
  </div>
));
ShimmerCard.displayName = 'ShimmerCard';

/** Horizontal stat/counter shimmer. */
export const ShimmerStat = memo(({ className = '' }: { className?: string }) => (
  <div
    className={`p-4 rounded-2xl border border-white/5 dark:border-gray-800/50 bg-gray-100/50 dark:bg-gray-900/30 text-center ${className}`}
    aria-hidden="true"
  >
    <div className="shimmer-base shimmer-block shimmer-text-lg w-16 mx-auto mb-2" />
    <div className="shimmer-base shimmer-block shimmer-text w-20 mx-auto" />
  </div>
));
ShimmerStat.displayName = 'ShimmerStat';

/* ═══════════════════════════════════════════════════════════════════════════
   SECTION-LEVEL SHIMMER SKELETONS
   These approximate the layout of each real section for minimal CLS.
   ═══════════════════════════════════════════════════════════════════════════ */

/** Generic section skeleton — section title + content grid. */
export const ShimmerSection = memo(({
  minHeight = '60vh',
  variant = 'default',
}: {
  minHeight?: string;
  variant?: 'default' | 'cards' | 'timeline' | 'hero';
}) => (
  <div
    className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto py-16 sm:py-20"
    style={{ minHeight }}
    role="status"
    aria-label="Loading section"
    aria-live="polite"
  >
    {/* Section header */}
    <div className="text-center mb-12 space-y-3">
      <div className="shimmer-base shimmer-block shimmer-text-lg w-48 mx-auto" />
      <div className="shimmer-base shimmer-block shimmer-text w-72 mx-auto" />
    </div>

    {variant === 'cards' && (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    )}

    {variant === 'timeline' && (
      <div className="max-w-3xl mx-auto space-y-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <ShimmerAvatar size={40} />
              {i < 3 && <div className="shimmer-base shimmer-block w-0.5 flex-1 mt-2" />}
            </div>
            <div className="flex-1 pb-6">
              <div className="shimmer-base shimmer-block shimmer-text-lg w-48 mb-3" />
              <ShimmerText lines={3} />
            </div>
          </div>
        ))}
      </div>
    )}

    {variant === 'default' && (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <ShimmerBlock className="h-64 rounded-2xl" />
          <ShimmerText lines={4} />
        </div>
        <div className="space-y-4">
          <ShimmerText lines={3} />
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerStat key={i} />
            ))}
          </div>
        </div>
      </div>
    )}

    {variant === 'hero' && (
      <div className="flex flex-col items-center space-y-6 pt-12">
        <div className="shimmer-base shimmer-block h-6 w-64 rounded-full" />
        <div className="shimmer-base shimmer-block shimmer-text-lg w-96 max-w-full h-12" />
        <div className="shimmer-base shimmer-block shimmer-text w-80 max-w-full" />
        <div className="flex gap-3 pt-4">
          <div className="shimmer-base shimmer-block h-12 w-40 rounded-2xl" />
          <div className="shimmer-base shimmer-block h-12 w-36 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-3xl pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <ShimmerStat key={i} />
          ))}
        </div>
      </div>
    )}

    <span className="sr-only">Loading content…</span>
  </div>
));
ShimmerSection.displayName = 'ShimmerSection';

/** Full-page shimmer for route-level suspense. */
export const ShimmerPage = memo(() => (
  <div
    className="min-h-dvh bg-gray-50 dark:bg-gray-950 px-4 py-12"
    role="status"
    aria-live="polite"
  >
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Nav placeholder */}
      <div className="flex items-center justify-between py-4">
        <div className="shimmer-base shimmer-block h-8 w-32 rounded-xl" />
        <div className="flex gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="shimmer-base shimmer-block h-4 w-16 rounded" />
          ))}
        </div>
      </div>

      {/* Hero placeholder */}
      <div className="text-center space-y-6 py-20">
        <div className="shimmer-base shimmer-block shimmer-text-lg w-64 mx-auto h-10" />
        <div className="shimmer-base shimmer-block shimmer-text-lg w-96 max-w-full mx-auto h-14" />
        <div className="shimmer-base shimmer-block shimmer-text w-80 max-w-full mx-auto" />
        <div className="flex justify-center gap-4 pt-6">
          <div className="shimmer-base shimmer-block h-12 w-44 rounded-2xl" />
          <div className="shimmer-base shimmer-block h-12 w-36 rounded-2xl" />
        </div>
      </div>

      {/* Content blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    </div>
    <span className="sr-only">Loading page…</span>
  </div>
));
ShimmerPage.displayName = 'ShimmerPage';
