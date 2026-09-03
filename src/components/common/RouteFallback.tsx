import { ShimmerPage } from './ShimmerSkeleton';

/**
 * Route-level suspense fallback.
 * Uses the advanced ShimmerPage skeleton instead of a simple spinner for a seamless luxury experience.
 */
const RouteFallback = () => <ShimmerPage />;

export default RouteFallback;
