import type { Transition, Variants } from 'framer-motion';

/**
 * Shared, module-level animation primitives.
 *
 * Two problems this solves:
 *
 * 1. Correctness — variant objects declared inline were inferred as
 *    `{ ease: string }`, which is not assignable to framer-motion's `Easing`
 *    union, so every one of them was a type error. Declaring them once with an
 *    explicit `Variants` annotation makes the literals check properly.
 *
 * 2. Referential stability — variants defined inside a component body are a new
 *    object on every render. framer-motion compares variant identity when
 *    deciding whether to restart an animation, so inline variants in a
 *    component that re-renders (for example a section containing a live clock)
 *    caused avoidable animation churn. Hoisting them to module scope makes them
 *    permanently stable.
 */

/** Cubic bezier equivalent of `easeOut`, typed as a tuple so TS keeps it exact. */
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;

export const springSoft: Transition = {
  type: 'spring',
  stiffness: 120,
  damping: 18,
  mass: 0.6,
};

export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 26,
  mass: 0.5,
};

/** Standard "section rises into view" entrance. */
export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

/** Reduced-motion / low-tier counterpart: fade only, no transform. */
export const sectionVariantsReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: springSoft },
};

/** Vertical swap used by the Hero's rotating job titles. */
export const swapVertical: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE_OUT } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.2, ease: EASE_OUT } },
};

/** Parent that staggers its children. */
export const staggerContainer = (stagger = 0.08, delayChildren = 0): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/**
 * Viewport config for scroll-triggered entrances.
 *
 * `once: true` matters for performance: without it framer-motion keeps an
 * IntersectionObserver callback re-triggering animations every time a long page
 * is scrolled up and down.
 */
export const viewportOnce = { once: true, amount: 0.15 } as const;
export const viewportOnceEager = { once: true, amount: 0.05 } as const;

/** Y-axis rotation entrance — used for certificate/card flip-in. */
export const flipInY: Variants = {
  hidden: { opacity: 0, rotateY: 90, scale: 0.85 },
  visible: {
    opacity: 1,
    rotateY: 0,
    scale: 1,
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

/** Horizontal slide entrance from the left. */
export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};

/** Horizontal slide entrance from the right. */
export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: EASE_OUT } },
};

/** Bouncy spring entrance with slight overshoot. */
export const elasticPop: Variants = {
  hidden: { opacity: 0, scale: 0.6 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 15, mass: 0.8 },
  },
};

/** Glow-reveal: fades in while a soft glow briefly appears. */
export const glowReveal: Variants = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.6, ease: EASE_OUT },
  },
};

/** Scroll-linked fade-out for sections scrolling away (parallax exit). */
export const scrollFadeOut: Variants = {
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: {
    opacity: 0,
    y: -40,
    scale: 0.97,
    transition: { duration: 0.4, ease: EASE_IN_OUT },
  },
};

/** Parent that staggers children in a cascade (deeper delays for later items). */
export const cascadeStagger = (stagger = 0.06, delayChildren = 0.1): Variants => ({
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren },
  },
});

/** Individual item used inside cascadeStagger parent. */
export const cascadeItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

/** Pick the right entrance for the current device, avoiding transform cost. */
export const pickSectionVariants = (reduced: boolean): Variants =>
  reduced ? sectionVariantsReduced : sectionVariants;

/* ═══════════════════════════════════════════════════════════════════════════
   Blur-to-sharp text reveal
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Staggered heading reveal driven by the `custom` prop.
 *
 * `filter: blur()` forces a full re-rasterisation of the element on every
 * frame, so this variant is reserved for a handful of one-shot headings and is
 * swapped for `textReveal` on low-tier hardware — see `pickTextReveal`.
 */
export const textRevealBlur: Variants = {
  hidden: { opacity: 0, y: 26, filter: 'blur(8px)' },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.09, duration: 0.6, ease: EASE_OUT },
  }),
};

/** Transform/opacity-only counterpart. Composited, no rasterisation cost. */
export const textReveal: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.45, ease: EASE_OUT },
  }),
};

/** Fade only — for reduced motion, where translation is also unwelcome. */
export const textRevealReduced: Variants = {
  hidden: { opacity: 0 },
  visible: (i: number = 0) => ({
    opacity: 1,
    transition: { delay: i * 0.04, duration: 0.2, ease: EASE_OUT },
  }),
};

export const pickTextReveal = (reduced: boolean, allowBlur: boolean): Variants => {
  if (reduced) return textRevealReduced;
  return allowBlur ? textRevealBlur : textReveal;
};

/* ═══════════════════════════════════════════════════════════════════════════
   Card entrances
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Grid/card entrance.
 *
 * Note the absence of `rotateX`: the previous version rotated every card 15°,
 * which promoted each one to its own compositor layer and, because the
 * `perspective-1500` utility it relied on was never defined, produced a flat
 * squash rather than the intended depth. Translate + scale reads the same and
 * costs a fraction as much.
 */
export const cardEntrance: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT },
  },
};

export const cardEntranceReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } },
};

export const pickCardEntrance = (reduced: boolean): Variants =>
  reduced ? cardEntranceReduced : cardEntrance;

/** Exit used by filterable grids. Short, so re-filtering never feels sluggish. */
export const cardExit = { opacity: 0, scale: 0.94, transition: { duration: 0.18 } };

/* ═══════════════════════════════════════════════════════════════════════════
   Modal / dialog
   ═══════════════════════════════════════════════════════════════════════════ */

export const modalPanel: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.26, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 8,
    transition: { duration: 0.16, ease: EASE_IN_OUT },
  },
};

export const modalPanelReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

export const pickModalPanel = (reduced: boolean): Variants =>
  reduced ? modalPanelReduced : modalPanel;

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, transition: { duration: 0.15, ease: EASE_IN_OUT } },
};

/* ═══════════════════════════════════════════════════════════════════════════
   Viewport configs
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Default for card grids and sub-blocks.
 *
 * Most `whileInView` call sites used a bare `{ once: true }`, i.e. `amount: 0`,
 * which fires the entrance the instant a single pixel intersects — so the
 * animation had already finished by the time the element was actually readable.
 * A small amount plus a negative bottom margin means the reveal plays *as* the
 * element arrives.
 */
export const viewportReveal = { once: true, amount: 0.15, margin: '0px 0px -10% 0px' } as const;

/** For tall sections where 20% of the element is more than a screenful. */
export const viewportRevealLoose = { once: true, amount: 0.08 } as const;
