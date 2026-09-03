import { useEffect, useRef, useState, type RefObject } from 'react';

interface Options {
  /** Fraction of the element that must be visible to count as "in view". */
  threshold?: number;
  /** Grow the viewport so work can start slightly before the user arrives. */
  rootMargin?: string;
  /** Latch to true on first intersection and never flip back. */
  once?: boolean;
}

/**
 * Reports whether an element is intersecting the viewport.
 *
 * Used for two distinct purposes in this project:
 *  - deferring the *mount* of heavy subtrees (lazy sections, WebGL scenes)
 *  - pausing render loops of already-mounted scenes that scrolled off screen
 *
 * The second case is the important one for battery and frame rate: without it,
 * every Three.js canvas on the page keeps rendering at 60fps forever, even
 * when the user is nine sections away.
 */
export function useInViewport<T extends Element>(
  options: Options = {}
): [RefObject<T | null>, boolean] {
  const { threshold = 0, rootMargin = '200px', once = false } = options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Without IntersectionObserver, fail open so content is never hidden.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;

        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, inView];
}

/**
 * True while the tab is actually visible. Every render loop should gate on
 * this so a backgrounded tab costs nothing.
 */
export function usePageVisible(): boolean {
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || document.visibilityState === 'visible'
  );

  useEffect(() => {
    const onChange = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', onChange);
    return () => document.removeEventListener('visibilitychange', onChange);
  }, []);

  return visible;
}

/**
 * Combined gate for animation work: only run when on screen *and* the tab is
 * foregrounded.
 */
export function useShouldAnimate<T extends Element>(
  options: Options = {}
): [RefObject<T | null>, boolean] {
  const [ref, inView] = useInViewport<T>(options);
  const pageVisible = usePageVisible();
  return [ref, inView && pageVisible];
}
