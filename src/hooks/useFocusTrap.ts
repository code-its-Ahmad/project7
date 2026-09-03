import { useEffect, useRef, type RefObject } from 'react';

/**
 * Modal focus management: initial focus, Tab containment, focus restoration.
 *
 * Every overlay in this project (nav drawer, command palette, case-study modal,
 * certificate modal, skill modal, testimonial form) previously did none of
 * this. Consequences that this hook fixes:
 *
 *  - Tab moved focus *behind* the backdrop, so keyboard users could operate the
 *    page they could not see.
 *  - Closing an overlay dropped focus to `<body>`, losing the user's place.
 *  - Screen readers walked the whole background tree because nothing marked it
 *    as inert.
 *
 * It deliberately does not render anything or clone children — it only needs a
 * ref on the dialog container.
 */

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) =>
      !element.hasAttribute('aria-hidden') &&
      // offsetParent is null for display:none subtrees — cheap visibility test.
      (element.offsetParent !== null || element === document.activeElement)
  );
}

interface FocusTrapOptions {
  /** Called on Escape. The hook stops propagation so sibling handlers do not double-fire. */
  onEscape?: () => void;
  /** Selector for the element that should receive focus first. */
  initialFocus?: string;
  /** Skip auto-focusing (useful when a child input already handles it). */
  autoFocus?: boolean;
}

export function useFocusTrap<T extends HTMLElement = HTMLDivElement>(
  active: boolean,
  { onEscape, initialFocus, autoFocus = true }: FocusTrapOptions = {}
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);

  /*
   * Kept in a ref so changing the handler identity does not tear down and
   * re-arm the trap — which would re-run the initial-focus step mid-interaction.
   */
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    if (autoFocus) {
      /*
       * One frame of delay: the container is mounted but framer-motion has not
       * committed its entrance transform yet, and focusing a still-translated
       * element makes some browsers scroll the container into view.
       */
      const frame = requestAnimationFrame(() => {
        const preferred = initialFocus
          ? container.querySelector<HTMLElement>(initialFocus)
          : null;
        const target = preferred ?? getFocusable(container)[0] ?? container;

        if (target === container && !container.hasAttribute('tabindex')) {
          container.setAttribute('tabindex', '-1');
        }
        target.focus({ preventScroll: true });
      });

      // Cleanup for this branch is handled below via the shared teardown.
      containerRef.current?.setAttribute('data-focus-frame', String(frame));
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (onEscapeRef.current) {
          event.preventDefault();
          // Prevents the global Ctrl+K / Escape handler from also reacting.
          event.stopPropagation();
          onEscapeRef.current();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const focusable = getFocusable(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement;

      // Focus escaped the dialog entirely (e.g. it started on <body>).
      if (!container.contains(activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
        return;
      }

      if (event.shiftKey && activeElement === first) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    // Capture phase so the trap wins over component-level keydown handlers.
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);

      const pending = container.getAttribute('data-focus-frame');
      if (pending) {
        cancelAnimationFrame(Number(pending));
        container.removeAttribute('data-focus-frame');
      }

      /*
       * Only restore if focus is still inside the dialog. If the user already
       * clicked elsewhere, yanking focus back would be hostile.
       */
      if (
        previouslyFocused &&
        previouslyFocused.isConnected &&
        (document.activeElement === document.body ||
          container.contains(document.activeElement))
      ) {
        previouslyFocused.focus({ preventScroll: true });
      }
    };
  }, [active, autoFocus, initialFocus]);

  return containerRef;
}
