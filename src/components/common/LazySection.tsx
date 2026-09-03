import { Suspense, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useInViewport } from '@/hooks/useInViewport';
import { useDeviceCapabilities } from '@/context/DeviceCapabilitiesContext';
import { pickSectionVariants } from '@/lib/motion';
import { ShimmerSection } from './ShimmerSkeleton';

interface LazySectionProps {
  children: ReactNode;
  /**
   * Reserved height for the not-yet-mounted placeholder. Prevents the scrollbar
   * from jumping as deferred sections come online (cumulative layout shift).
   */
  minHeight?: string;
  /** How early to start loading, relative to the viewport. */
  rootMargin?: string;
  /** Skip deferral for above-the-fold content. */
  eager?: boolean;
  className?: string;
  /** Skeleton layout variant that best matches the incoming section. */
  skeletonVariant?: 'default' | 'cards' | 'timeline' | 'hero';
  /**
   * The `id` of the `<section>` this wrapper will eventually mount. Stamped on
   * the placeholder as `data-section` so nav links can scroll to a section that
   * has not been mounted yet (see `lib/scrollTo`).
   */
  sectionId?: string;
}

/**
 * Defers mounting *and* reveals a page section.
 *
 * Previously every section — including nine `motion.section` wrappers, five
 * WebGL canvases and a 1,800-line chatbot — mounted during the initial render
 * pass. Combining lazy mounting with the reveal animation here means:
 *
 *  - the lazy chunk is only fetched as the user approaches the section
 *  - a shimmer skeleton of known height keeps the scroll position stable
 *  - the reveal animation and the mount are driven by one observer, so content
 *    can never get stuck invisible because two observers disagreed
 *
 * It intentionally renders a `motion.div`, not a `<section>`: each child
 * component already provides its own `<section id="...">` landmark, and the old
 * wrapper duplicated both the element and its `id`.
 */
const LazySection = ({
  children,
  minHeight = '60vh',
  rootMargin = '300px 0px',
  eager = false,
  className,
  skeletonVariant = 'default',
  sectionId,
}: LazySectionProps) => {
  const { reducedMotion, tier } = useDeviceCapabilities();
  const [ref, inView] = useInViewport<HTMLDivElement>({
    rootMargin,
    once: true,
    threshold: 0,
  });

  const shouldMount = eager || inView;
  const variants = pickSectionVariants(reducedMotion || tier === 'low');

  return (
    <motion.div
      ref={ref}
      data-section={sectionId}
      className={className}
      style={shouldMount ? undefined : { minHeight }}
      variants={variants}
      initial="hidden"
      animate={shouldMount ? 'visible' : 'hidden'}
    >
      {shouldMount ? (
        <Suspense fallback={<SectionShimmer minHeight={minHeight} variant={skeletonVariant} />}>
          {children}
        </Suspense>
      ) : null}
    </motion.div>
  );
};

/** Premium shimmer skeleton shown while a section chunk downloads. */
const SectionShimmer = ({
  minHeight,
  variant,
}: {
  minHeight: string;
  variant: 'default' | 'cards' | 'timeline' | 'hero';
}) => (
  <motion.div
    initial={{ opacity: 0.6 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    <ShimmerSection minHeight={minHeight} variant={variant} />
  </motion.div>
);

export default LazySection;
