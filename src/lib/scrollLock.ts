/**
 * Reference-counted body scroll lock.
 *
 * ## Why this exists
 *
 * Three independent places used to mutate `document.body.style` directly:
 * the mobile nav drawer (`position: fixed` + saved offset), the project
 * case-study modal (`overflow: hidden` → `''`) and, implicitly, every other
 * overlay that forgot to lock at all.
 *
 * Because each of them reset to a *hard-coded* value instead of the previous
 * one, whichever overlay closed last destroyed the lock still owned by the
 * others. Opening the command palette from inside the nav drawer, for example,
 * closed the drawer, which cleared the body styles — so the page scrolled
 * behind the palette. Closing a modal that had been opened from the drawer
 * also lost the user's scroll position entirely.
 *
 * A single ref-counted owner fixes all of those at once: the DOM is only
 * touched on the 0 → 1 and 1 → 0 transitions, and the *original* inline styles
 * are captured and restored verbatim.
 *
 * ## Why `position: fixed` rather than `overflow: hidden`
 *
 * iOS Safari ignores `overflow: hidden` on `<body>` and keeps rubber-banding
 * the document. Pinning the body and re-applying the saved offset is the only
 * approach that actually holds on iOS, and it is what the nav drawer already
 * did — so this is not a behavioural change, just a correct one.
 *
 * `scrollbar-gutter: stable` on `<html>` (see `index.css`) means removing the
 * document scrollbar does not shift layout, so no padding compensation is
 * needed.
 */

/** Distinct lock owners. A Set makes a double-lock from one owner idempotent. */
const owners = new Set<string>();

interface SavedStyles {
  position: string;
  top: string;
  left: string;
  right: string;
  width: string;
  overflow: string;
  scrollY: number;
}

let saved: SavedStyles | null = null;

function engage(): void {
  if (typeof document === 'undefined' || saved) return;

  const { body } = document;
  const scrollY = window.scrollY || window.pageYOffset || 0;

  saved = {
    position: body.style.position,
    top: body.style.top,
    left: body.style.left,
    right: body.style.right,
    width: body.style.width,
    overflow: body.style.overflow,
    scrollY,
  };

  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.left = '0';
  body.style.right = '0';
  body.style.width = '100%';
  body.style.overflow = 'hidden';
}

function release(): void {
  if (typeof document === 'undefined' || !saved) return;

  const { body } = document;
  const { scrollY } = saved;

  body.style.position = saved.position;
  body.style.top = saved.top;
  body.style.left = saved.left;
  body.style.right = saved.right;
  body.style.width = saved.width;
  body.style.overflow = saved.overflow;
  saved = null;

  /*
   * Restoring the offset must not itself be smooth-scrolled. `scroll-behavior`
   * lives on <html> behind a reduced-motion query, so it is temporarily
   * neutralised for this one synchronous jump.
   */
  const root = document.documentElement;
  const previousBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(0, scrollY);
  root.style.scrollBehavior = previousBehavior;
}

/** Lock page scrolling on behalf of `owner`. Safe to call repeatedly. */
export function lockScroll(owner: string): void {
  if (owners.has(owner)) return;
  owners.add(owner);
  if (owners.size === 1) engage();
}

/** Release `owner`'s claim. Scrolling resumes once every owner has released. */
export function unlockScroll(owner: string): void {
  if (!owners.delete(owner)) return;
  if (owners.size === 0) release();
}

/** True while at least one overlay holds the lock. */
export function isScrollLocked(): boolean {
  return owners.size > 0;
}
