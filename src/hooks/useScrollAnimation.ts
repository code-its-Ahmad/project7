import { useRef, useCallback, type RefObject } from 'react';
import {
  useScroll,
  useTransform,
  useSpring,
  useInView,
  type MotionValue,
} from 'framer-motion';

/* ═══════════════════════════════════════════════════════════════════════════
   useParallax — different-speed movement for depth layering
   ═══════════════════════════════════════════════════════════════════════════ */

interface ParallaxOptions {
  /** Multiplier: 0 = no movement, 1 = scroll speed, -1 = reverse. Default 0.5 */
  speed?: number;
  /** Clamp output so it never exceeds these pixel bounds. */
  clamp?: boolean;
}

interface ParallaxReturn<T extends HTMLElement> {
  ref: RefObject<T | null>;
  y: MotionValue<number>;
}

export function useParallax<T extends HTMLElement = HTMLDivElement>(
  options: ParallaxOptions = {}
): ParallaxReturn<T> {
  const { speed = 0.5, clamp = true } = options;
  const ref = useRef<T | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const range = 100 * speed;
  const rawY = useTransform(scrollYProgress, [0, 1], [range, -range]);
  const y = useSpring(rawY, { stiffness: 100, damping: 30, mass: 0.5 });

  return { ref, y };
}

/* ═══════════════════════════════════════════════════════════════════════════
   useScrollFade — Hero-style fade + scale as element scrolls away
   ═══════════════════════════════════════════════════════════════════════════ */

interface ScrollFadeReturn<T extends HTMLElement> {
  ref: RefObject<T | null>;
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  y: MotionValue<number>;
}

export function useScrollFade<T extends HTMLElement = HTMLDivElement>(): ScrollFadeReturn<T> {
  const ref = useRef<T | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.6, 1], [1, 1, 0.95]);
  const y = useTransform(scrollYProgress, [0, 0.6, 1], [0, 0, -60]);

  return { ref, opacity, scale, y };
}

/* ═══════════════════════════════════════════════════════════════════════════
   useScrollProgress — raw 0→1 progress through an element
   ═══════════════════════════════════════════════════════════════════════════ */

interface ScrollProgressReturn<T extends HTMLElement> {
  ref: RefObject<T | null>;
  progress: MotionValue<number>;
  smoothProgress: MotionValue<number>;
}

export function useScrollProgress<T extends HTMLElement = HTMLDivElement>(): ScrollProgressReturn<T> {
  const ref = useRef<T | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 20,
    mass: 0.4,
  });

  return { ref, progress: scrollYProgress, smoothProgress };
}

/* ═══════════════════════════════════════════════════════════════════════════
   useRevealOnScroll — element reveals when entering viewport
   ═══════════════════════════════════════════════════════════════════════════ */

interface RevealOptions {
  /** Threshold for IntersectionObserver (0–1). */
  amount?: number;
  /** Only trigger once. */
  once?: boolean;
}

interface RevealReturn<T extends HTMLElement> {
  ref: RefObject<T | null>;
  isInView: boolean;
}

export function useRevealOnScroll<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {}
): RevealReturn<T> {
  const { amount = 0.15, once = true } = options;
  const ref = useRef<T | null>(null);
  const isInView = useInView(ref, { amount, once });

  return { ref, isInView };
}

/* ═══════════════════════════════════════════════════════════════════════════
   useDrawLine — SVG path stroke-dashoffset driven by scroll
   ═══════════════════════════════════════════════════════════════════════════ */

interface DrawLineReturn<T extends HTMLElement> {
  ref: RefObject<T | null>;
  pathLength: MotionValue<number>;
}

export function useDrawLine<T extends HTMLElement = HTMLDivElement>(): DrawLineReturn<T> {
  const ref = useRef<T | null>(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.4'],
  });

  const pathLength = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    mass: 0.5,
  });

  return { ref, pathLength };
}
