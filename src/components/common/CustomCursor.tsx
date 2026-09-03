import { useEffect, useRef, useCallback } from 'react';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 * BULLETPROOF ADVANCED CUSTOM CURSOR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * - Zero React re-renders (100% GPU / Direct DOM transform)
 * - Automatic mouse vs touch detection (instantly active on mouse move)
 * - Works on all desktops, laptops (including Windows Touchscreen laptops)
 * - Magnetic centroid snap on interactive elements
 * - Morphing modes: Default, Hover, Text-beam, Input, Click/Pressed, Card View
 * - Dynamic theme adaptation (Dark mode neon glow / Light mode crisp contrast)
 * - Zero lag fly-in: Latching onto cursor position on very first mousemove
 */

const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'label',
  'summary',
  '[role="button"]',
  '[role="link"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="switch"]',
  '[role="checkbox"]',
  '[role="radio"]',
  '[role="option"]',
  '[tabindex]:not([tabindex="-1"])',
  '.cursor-pointer',
  '[data-cursor="interactive"]',
  '[data-cursor="magnetic"]',
].join(',');

const TEXT_TAGS = new Set([
  'P', 'SPAN', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6',
  'LI', 'TD', 'TH', 'BLOCKQUOTE', 'FIGCAPTION', 'CITE',
  'EM', 'STRONG', 'SMALL', 'CODE', 'PRE', 'KBD', 'SAMP'
]);

function lerp(start: number, end: number, factor: number): number {
  return start + (end - start) * factor;
}

const CustomCursor = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const styleRef = useRef<HTMLStyleElement>(null);
  const rafRef = useRef<number>(0);

  const state = useRef({
    tx: -100,
    ty: -100,
    dotX: -100,
    dotY: -100,
    ringX: -100,
    ringY: -100,
    trailX: -100,
    trailY: -100,
    magnetX: 0,
    magnetY: 0,
    hasMoved: false,
    isVisible: false,
    isHovering: false,
    isPressed: false,
    isText: false,
    isInput: false,
    isCard: false,
    badgeText: '',
    isDarkMode: true,
  });

  const animate = useCallback(() => {
    const s = state.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const trail = trailRef.current;
    const badge = badgeRef.current;

    if (!dot || !ring || !trail) {
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    if (!s.hasMoved || !s.isVisible) {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
      trail.style.opacity = '0';
      if (badge) badge.style.opacity = '0';
      rafRef.current = requestAnimationFrame(animate);
      return;
    }

    const targetX = s.tx + s.magnetX;
    const targetY = s.ty + s.magnetY;

    // Fluid spring smoothing
    s.dotX = lerp(s.dotX, targetX, 0.45);
    s.dotY = lerp(s.dotY, targetY, 0.45);

    s.ringX = lerp(s.ringX, targetX, 0.2);
    s.ringY = lerp(s.ringY, targetY, 0.2);

    s.trailX = lerp(s.trailX, targetX, 0.1);
    s.trailY = lerp(s.trailY, targetY, 0.1);

    const isDark = s.isDarkMode;

    // ── 1. DOT ──
    let dotScale = 1;
    if (s.isPressed) dotScale = 0.5;
    else if (s.isHovering || s.isCard) dotScale = 0;
    else if (s.isText) dotScale = 0.3;

    const dotSize = 6;
    dot.style.transform = `translate3d(${s.dotX - dotSize / 2}px, ${s.dotY - dotSize / 2}px, 0) scale(${dotScale})`;
    dot.style.opacity = '1';

    // ── 2. RING ──
    let ringW = 32;
    let ringH = 32;
    let ringBorderColor = isDark ? 'rgba(192, 132, 252, 0.5)' : 'rgba(99, 102, 241, 0.6)';
    let ringBg = isDark ? 'rgba(168, 85, 247, 0.08)' : 'rgba(99, 102, 241, 0.06)';
    let ringBorderWidth = '1.5px';
    let ringRadius = '50%';
    let ringBoxShadow = isDark
      ? '0 0 15px rgba(168, 85, 247, 0.2)'
      : '0 0 12px rgba(99, 102, 241, 0.2)';

    if (s.isInput) {
      ringW = 4;
      ringH = 26;
      ringRadius = '2px';
      ringBorderWidth = '1px';
      ringBorderColor = isDark ? 'rgba(56, 189, 248, 1)' : 'rgba(2, 132, 199, 1)';
      ringBg = isDark ? 'rgba(56, 189, 248, 0.9)' : 'rgba(2, 132, 199, 0.9)';
      ringBoxShadow = isDark
        ? '0 0 12px rgba(56, 189, 248, 0.7)'
        : '0 0 8px rgba(2, 132, 199, 0.5)';
    } else if (s.isCard) {
      ringW = 68;
      ringH = 68;
      ringBorderWidth = '1.5px';
      ringBorderColor = isDark ? 'rgba(96, 165, 250, 0.95)' : 'rgba(37, 99, 235, 0.95)';
      ringBg = isDark ? 'rgba(59, 130, 246, 0.16)' : 'rgba(37, 99, 235, 0.1)';
      ringBoxShadow = isDark
        ? '0 0 30px rgba(59, 130, 246, 0.45), inset 0 0 15px rgba(59, 130, 246, 0.15)'
        : '0 0 20px rgba(37, 99, 235, 0.3), inset 0 0 10px rgba(37, 99, 235, 0.08)';
    } else if (s.isHovering) {
      ringW = 54;
      ringH = 54;
      ringBorderWidth = '2px';
      ringBorderColor = isDark ? 'rgba(96, 165, 250, 1)' : 'rgba(37, 99, 235, 1)';
      ringBg = isDark ? 'rgba(59, 130, 246, 0.18)' : 'rgba(37, 99, 235, 0.12)';
      ringBoxShadow = isDark
        ? '0 0 30px rgba(59, 130, 246, 0.5), inset 0 0 15px rgba(59, 130, 246, 0.18)'
        : '0 0 20px rgba(37, 99, 235, 0.35), inset 0 0 10px rgba(37, 99, 235, 0.1)';
    } else if (s.isText) {
      ringW = 40;
      ringH = 40;
      ringBorderWidth = '1px';
      ringBorderColor = isDark ? 'rgba(192, 132, 252, 0.65)' : 'rgba(147, 51, 234, 0.65)';
      ringBg = isDark ? 'rgba(168, 85, 247, 0.06)' : 'rgba(147, 51, 234, 0.05)';
      ringBoxShadow = isDark
        ? '0 0 16px rgba(168, 85, 247, 0.25)'
        : '0 0 10px rgba(147, 51, 234, 0.2)';
    }

    if (s.isPressed && !s.isInput) {
      ringW *= 0.78;
      ringH *= 0.78;
      ringBorderColor = isDark ? 'rgba(56, 189, 248, 1)' : 'rgba(2, 132, 199, 1)';
      ringBg = isDark ? 'rgba(56, 189, 248, 0.28)' : 'rgba(2, 132, 199, 0.22)';
      ringBoxShadow = isDark
        ? '0 0 35px rgba(56, 189, 248, 0.7)'
        : '0 0 25px rgba(2, 132, 199, 0.5)';
    }

    ring.style.transform = `translate3d(${s.ringX - ringW / 2}px, ${s.ringY - ringH / 2}px, 0)`;
    ring.style.width = `${ringW}px`;
    ring.style.height = `${ringH}px`;
    ring.style.borderRadius = ringRadius;
    ring.style.borderWidth = ringBorderWidth;
    ring.style.borderColor = ringBorderColor;
    ring.style.backgroundColor = ringBg;
    ring.style.boxShadow = ringBoxShadow;
    ring.style.opacity = '1';

    // ── 3. GHOST TRAIL ──
    const trailSize = 46;
    trail.style.transform = `translate3d(${s.trailX - trailSize / 2}px, ${s.trailY - trailSize / 2}px, 0)`;
    trail.style.opacity = !s.isHovering && !s.isInput && !s.isCard ? '0.35' : '0';
    trail.style.borderColor = isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(99, 102, 241, 0.3)';

    // ── 4. BADGE ──
    if (badge) {
      if (s.badgeText && (s.isCard || s.isHovering)) {
        badge.textContent = s.badgeText;
        badge.style.transform = `translate3d(${s.ringX}px, ${s.ringY}px, 0) translate(-50%, -50%)`;
        badge.style.opacity = '1';
      } else {
        badge.style.opacity = '0';
      }
    }

    rafRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const s = state.current;

    // Theme sync
    s.isDarkMode = document.documentElement.classList.contains('dark');
    const themeObserver = new MutationObserver(() => {
      s.isDarkMode = document.documentElement.classList.contains('dark');
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    // Hide native cursor via dynamic high-priority style
    const style = document.createElement('style');
    style.setAttribute('data-portfolio-cursor', '');
    style.textContent = `
      @media (min-width: 640px) {
        html, body, a, button, input, select, textarea, div, span, * {
          cursor: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    styleRef.current = style;

    // Event handlers
    const onMouseMove = (e: MouseEvent) => {
      s.tx = e.clientX;
      s.ty = e.clientY;

      if (!s.hasMoved) {
        s.hasMoved = true;
        s.dotX = e.clientX;
        s.dotY = e.clientY;
        s.ringX = e.clientX;
        s.ringY = e.clientY;
        s.trailX = e.clientX;
        s.trailY = e.clientY;
      }

      s.isVisible = true;
    };

    const onMouseDown = () => {
      s.isPressed = true;
    };

    const onMouseUp = () => {
      s.isPressed = false;
    };

    const onTouchStart = () => {
      // If user touches the screen, hide custom cursor
      s.isVisible = false;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target) return;

      const customCursorEl = target.closest<HTMLElement>('[data-cursor-text], [data-cursor-card]');
      if (customCursorEl) {
        s.isCard = true;
        s.badgeText = customCursorEl.getAttribute('data-cursor-text') || 'VIEW';
        s.isHovering = false;
        s.isInput = false;
        s.isText = false;
        s.magnetX = 0;
        s.magnetY = 0;
        return;
      } else {
        s.isCard = false;
        s.badgeText = '';
      }

      const interactive = target.closest<HTMLElement>(INTERACTIVE_SELECTOR);
      if (interactive) {
        const tag = interactive.tagName;
        const isInput =
          tag === 'INPUT' ||
          tag === 'TEXTAREA' ||
          tag === 'SELECT' ||
          interactive.isContentEditable;

        s.isInput = isInput;
        s.isHovering = !isInput;
        s.isText = false;

        if (!isInput) {
          const rect = interactive.getBoundingClientRect();
          const maxDim = Math.max(rect.width, rect.height);
          if (maxDim < 240 && maxDim > 8) {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            s.magnetX = (centerX - s.tx) * 0.22;
            s.magnetY = (centerY - s.ty) * 0.22;
          } else {
            s.magnetX = 0;
            s.magnetY = 0;
          }
        } else {
          s.magnetX = 0;
          s.magnetY = 0;
        }
        return;
      }

      s.isHovering = false;
      s.isInput = false;
      s.magnetX = 0;
      s.magnetY = 0;
      s.isText = TEXT_TAGS.has(target.tagName);
    };

    const onMouseLeave = () => {
      s.isVisible = false;
    };

    const onMouseEnter = () => {
      s.isVisible = true;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('mousedown', onMouseDown, { passive: true });
    window.addEventListener('mouseup', onMouseUp, { passive: true });
    window.addEventListener('mouseover', onMouseOver, { passive: true });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    document.documentElement.addEventListener('mouseleave', onMouseLeave);
    document.documentElement.addEventListener('mouseenter', onMouseEnter);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('touchstart', onTouchStart);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      document.documentElement.removeEventListener('mouseenter', onMouseEnter);
      themeObserver.disconnect();
      cancelAnimationFrame(rafRef.current);

      if (styleRef.current && styleRef.current.parentNode) {
        styleRef.current.parentNode.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
  }, [animate]);

  return (
    <div className="hidden sm:block">
      {/* Ghost trail */}
      <div
        ref={trailRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 46,
          height: 46,
          borderRadius: '50%',
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: 'rgba(168, 85, 247, 0.3)',
          pointerEvents: 'none',
          zIndex: 9999999,
          willChange: 'transform, opacity',
          transition: 'opacity 0.25s ease',
          opacity: 0,
        }}
      />

      {/* Morphing ring */}
      <div
        ref={ringRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          borderStyle: 'solid',
          borderWidth: '1.5px',
          borderColor: 'rgba(192, 132, 252, 0.5)',
          backgroundColor: 'rgba(168, 85, 247, 0.08)',
          pointerEvents: 'none',
          zIndex: 9999999,
          willChange: 'transform, width, height, opacity, border-radius',
          transition:
            'width 0.22s cubic-bezier(0.16, 1, 0.3, 1), ' +
            'height 0.22s cubic-bezier(0.16, 1, 0.3, 1), ' +
            'border-radius 0.22s ease, ' +
            'border-color 0.2s ease, ' +
            'background-color 0.2s ease, ' +
            'box-shadow 0.25s ease, ' +
            'opacity 0.2s ease',
          opacity: 0,
          backdropFilter: 'blur(0.5px)',
        }}
      />

      {/* Core Dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)',
          pointerEvents: 'none',
          zIndex: 9999999,
          willChange: 'transform, opacity',
          transition: 'transform 0.15s ease-out, opacity 0.2s ease',
          opacity: 0,
          boxShadow: '0 0 10px rgba(56, 189, 248, 0.9), 0 0 20px rgba(129, 140, 248, 0.5)',
        }}
      />

      {/* Text Badge */}
      <div
        ref={badgeRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          zIndex: 9999999,
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: '#ffffff',
          opacity: 0,
          transition: 'opacity 0.2s ease',
          willChange: 'transform, opacity',
          userSelect: 'none',
          textShadow: '0 0 8px rgba(0,0,0,0.8)',
        }}
      />
    </div>
  );
};

export default CustomCursor;
