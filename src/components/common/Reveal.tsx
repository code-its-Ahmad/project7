import { memo, type ElementType, type ReactNode } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useDeviceCapabilities } from '@/context/DeviceCapabilitiesContext';
import {
  EASE_OUT,
  cascadeStagger,
  pickCardEntrance,
  viewportReveal,
  viewportRevealLoose,
} from '@/lib/motion';

/**
 * The project's reusable scroll-reveal layer.
 *
 * ## Why centralise this
 *
 * Every section had hand-rolled its own entrance: nine files each declared a
 * `containerVariants` / `itemVariants` pair, most with a bare
 * `viewport={{ once: true }}` (i.e. `amount: 0`, firing before the element was
 * readable), and only one of the nine consulted the reduced-motion preference.
 * Four of them animated properties that force layout or rasterisation.
 *
 * These three components cover every reveal pattern the existing UI needs, and
 * they all degrade in one place:
 *
 *  - `prefers-reduced-motion` → opacity only, ~200 ms
 *  - low device tier          → opacity only (blur/scale/translate dropped)
 *  - otherwise                → translate + fade with the shared `EASE_OUT`
 *
 * They render a plain `<div>` by default and pass `className` straight through,
 * so wrapping existing markup does not change the box model or the visual
 * design in any way.
 */

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<RevealDirection, { x?: number; y?: number }> = {
  up: { y: 24 },
  down: { y: -24 },
  left: { x: -28 },
  right: { x: 28 },
  none: {},
};

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  /** Which way the content travels in from. Default `up`. */
  direction?: RevealDirection;
  /** Seconds of delay. Keep under ~0.3 s so the page never feels slow. */
  delay?: number;
  /** Seconds. Section reveals sit in the 0.4–0.8 s band. */
  duration?: number;
  /** Use a looser threshold for elements taller than the viewport. */
  loose?: boolean;
  /** Render as another element (`section`, `li`, `article`, …). */
  as?: ElementType;
  style?: React.CSSProperties;
}

/**
 * Reveals a block as it scrolls into view. Runs once.
 *
 * Re-running reveals on every pass keeps an IntersectionObserver callback alive
 * for the life of the page and makes long scrolls feel twitchy, so `once` is
 * not configurable.
 */
export const ScrollReveal = memo(
  ({
    children,
    className,
    direction = 'up',
    delay = 0,
    duration = 0.5,
    loose = false,
    as = 'div',
    style,
  }: ScrollRevealProps) => {
    const { reducedMotion, tier } = useDeviceCapabilities();
    const flat = reducedMotion || tier === 'low';

    const Component = motion[as as 'div'] ?? motion.div;
    const offset = flat ? {} : OFFSET[direction];

    return (
      <Component
        className={className}
        style={style}
        initial={{ opacity: 0, ...offset }}
        whileInView={{ opacity: 1, x: 0, y: 0 }}
        viewport={loose ? viewportRevealLoose : viewportReveal}
        transition={{
          duration: reducedMotion ? 0.2 : duration,
          delay: reducedMotion ? 0 : delay,
          ease: EASE_OUT,
        }}
      >
        {children}
      </Component>
    );
  }
);
ScrollReveal.displayName = 'ScrollReveal';

interface StaggerContainerProps {
  children: ReactNode;
  className?: string;
  /** Gap between children, in seconds. */
  stagger?: number;
  /** Delay before the first child, in seconds. */
  delayChildren?: number;
  loose?: boolean;
  as?: ElementType;
  style?: React.CSSProperties;
}

/**
 * Parent for `StaggerItem` children.
 *
 * The stagger is driven by variant propagation rather than a per-child `delay`
 * prop, which means the children's transitions are declared once and the whole
 * group shares a single IntersectionObserver instead of one per card.
 */
export const StaggerContainer = memo(
  ({
    children,
    className,
    stagger = 0.07,
    delayChildren = 0.05,
    loose = false,
    as = 'div',
    style,
  }: StaggerContainerProps) => {
    const { reducedMotion, tier } = useDeviceCapabilities();

    // On weak hardware a long cascade means many elements animating at once.
    const effectiveStagger = reducedMotion ? 0.02 : tier === 'low' ? 0.04 : stagger;

    const Component = motion[as as 'div'] ?? motion.div;

    return (
      <Component
        className={className}
        style={style}
        variants={cascadeStagger(effectiveStagger, reducedMotion ? 0 : delayChildren)}
        initial="hidden"
        whileInView="visible"
        viewport={loose ? viewportRevealLoose : viewportReveal}
      >
        {children}
      </Component>
    );
  }
);
StaggerContainer.displayName = 'StaggerContainer';

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  as?: ElementType;
  style?: React.CSSProperties;
  /** Override the default card entrance (rare). */
  variants?: Variants;
}

/** Child of `StaggerContainer`. Inherits timing from the parent's variants. */
export const StaggerItem = memo(
  ({ children, className, as = 'div', style, variants }: StaggerItemProps) => {
    const { reducedMotion, tier } = useDeviceCapabilities();
    const Component = motion[as as 'div'] ?? motion.div;

    return (
      <Component
        className={className}
        style={style}
        variants={variants ?? pickCardEntrance(reducedMotion || tier === 'low')}
      >
        {children}
      </Component>
    );
  }
);
StaggerItem.displayName = 'StaggerItem';
