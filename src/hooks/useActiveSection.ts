import { useEffect, useRef, useState } from 'react';

/**
 * Which section id is currently under the navbar, via IntersectionObserver.
 *
 * ## What this replaces
 *
 * The navbar used to recompute the active section inside a scroll handler:
 *
 * ```
 * for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
 *   const section = document.getElementById(NAV_ITEMS[i].id);
 *   if (section) {
 *     const top = section.offsetTop;      // forced layout
 *     const height = section.offsetHeight; // forced layout
 *     ...
 * ```
 *
 * That is up to 9 `getElementById` calls plus 18 forced synchronous layout
 * reads **per animation frame** while scrolling — the single most expensive
 * thing on the page during a scroll on low-end hardware. It also had three
 * correctness bugs: `offsetTop` is relative to `offsetParent` rather than the
 * document, sections not yet mounted by `LazySection` returned `null`, and when
 * no section matched the previous highlight was left stale.
 *
 * IntersectionObserver moves the whole computation off the main thread's scroll
 * path. Zero layout reads, zero work when nothing crosses a threshold.
 *
 * ## Lazily mounted sections
 *
 * Only the hero is in the DOM on first paint; the rest mount as `LazySection`
 * brings them online. A `MutationObserver` picks those up as they appear, so
 * ids are attached exactly once, when they become real.
 */

const THRESHOLDS = [0, 0.15, 0.35, 0.6, 0.85, 1];

export function useActiveSection(ids: readonly string[], navOffset = 72): string {
  const [active, setActive] = useState<string>(ids[0] ?? '');

  /*
   * `ids` is almost always a module-level constant, but joining it makes the
   * effect dependency a primitive so an accidental inline array literal cannot
   * tear the observers down on every render.
   */
  const key = ids.join('|');

  // Latest ratio per id, kept outside React so scrolling never triggers renders
  // unless the winner actually changes.
  const ratios = useRef(new Map<string, number>());

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const list = key.split('|').filter(Boolean);
    const observed = new Set<string>();
    const order = new Map(list.map((id, index) => [id, index]));
    ratios.current.clear();

    let frame = 0;

    const resolve = () => {
      frame = 0;

      let bestId = '';
      let bestRatio = 0;
      let bestOrder = Number.POSITIVE_INFINITY;

      ratios.current.forEach((ratio, id) => {
        if (ratio <= 0) return;
        const position = order.get(id) ?? Number.POSITIVE_INFINITY;

        /*
         * Largest visible area wins. Ties break towards the section that comes
         * first in the document, which is what feels right when two short
         * sections share the viewport.
         */
        if (ratio > bestRatio + 0.01 || (Math.abs(ratio - bestRatio) <= 0.01 && position < bestOrder)) {
          bestId = id;
          bestRatio = ratio;
          bestOrder = position;
        }
      });

      if (bestId) setActive(bestId);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const id = entry.target.id;
          if (id) ratios.current.set(id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        // Coalesce bursts (several sections cross thresholds in one scroll step).
        if (!frame) frame = requestAnimationFrame(resolve);
      },
      {
        // Shrink the top of the root by the navbar height so a section only
        // counts once it has cleared the bar the user is reading it under.
        rootMargin: `-${Math.round(navOffset)}px 0px 0px 0px`,
        threshold: THRESHOLDS,
      }
    );

    const attachMissing = () => {
      for (const id of list) {
        if (observed.has(id)) continue;
        const element = document.getElementById(id);
        if (element) {
          observed.add(id);
          observer.observe(element);
        }
      }
    };

    attachMissing();

    /*
     * Sections appear over time as their lazy chunks resolve. Watching for
     * structural changes is far cheaper than polling, and this fires only on
     * real DOM mutations — not during scrolling.
     */
    let mutationFrame = 0;
    const root = document.querySelector('main') ?? document.body;
    const mutationObserver = new MutationObserver(() => {
      if (observed.size === list.length) return;
      if (mutationFrame) return;
      mutationFrame = requestAnimationFrame(() => {
        mutationFrame = 0;
        attachMissing();
      });
    });
    mutationObserver.observe(root, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      if (mutationFrame) cancelAnimationFrame(mutationFrame);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [key, navOffset]);

  return active;
}
