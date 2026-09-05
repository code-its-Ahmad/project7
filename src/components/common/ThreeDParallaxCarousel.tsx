import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
} from 'lucide-react';
import { useDeviceCapabilities } from '../../context/DeviceCapabilitiesContext';

export interface ThreeDCarouselRenderProps<T> {
  item: T;
  index: number;
  isActive: boolean;
  distance: number;
  parallaxX: number;
  tilt: { tiltX: number; tiltY: number };
  isDragging: boolean;
}

export interface ThreeDParallaxCarouselProps<T> {
  items: T[];
  renderItem: (props: ThreeDCarouselRenderProps<T>) => ReactNode;
  keyExtractor: (item: T, index: number) => string | number;
  activeIndex?: number;
  onActiveChange?: (index: number) => void;
  autoPlayInterval?: number; // ms, 0 = disabled
  loop?: boolean;
  className?: string;
  ariaLabel?: string;
  showProgressTimer?: boolean;
  showDots?: boolean;
  showArrows?: boolean;
  showPlayPause?: boolean;
  accentColor?: string; // rgb triple, e.g. "59, 130, 246" or hex
  onItemClick?: (item: T, index: number) => void;
  customControls?: ReactNode;
}

export function ThreeDParallaxCarousel<T>({
  items,
  renderItem,
  keyExtractor,
  activeIndex: controlledIndex,
  onActiveChange,
  autoPlayInterval = 6500,
  loop = true,
  className = '',
  ariaLabel = '3D Carousel Slider',
  showProgressTimer = true,
  showDots = true,
  showArrows = true,
  showPlayPause = true,
  accentColor = '59, 130, 246',
  onItemClick,
  customControls,
}: ThreeDParallaxCarouselProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const { isTouch, tier, reducedMotion } = useDeviceCapabilities();
  const isLowTier = tier === 'low';

  // Screen size detection
  const [windowWidth, setWindowWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );

  useEffect(() => {
    let frame = 0;
    const handleResize = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setWindowWidth(window.innerWidth);
      });
    };
    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('orientationchange', handleResize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const isMobile = windowWidth <= 640;
  const isTablet = windowWidth > 640 && windowWidth <= 1024;
  const isInfinixHot10 = windowWidth <= 400; // ~360px viewport

  // Dynamic card dimensions based on viewport
  const cardMetrics = useMemo(() => {
    if (isInfinixHot10) {
      return {
        cardWidth: Math.min(windowWidth - 36, 330),
        cardHeight: 460,
        radius: 280,
        angleStep: 20,
        maxDepth: 180,
      };
    }
    if (isMobile) {
      return {
        cardWidth: Math.min(windowWidth - 48, 380),
        cardHeight: 480,
        radius: 360,
        angleStep: 24,
        maxDepth: 240,
      };
    }
    if (isTablet) {
      return {
        cardWidth: 440,
        cardHeight: 520,
        radius: 480,
        angleStep: 26,
        maxDepth: 300,
      };
    }
    return {
      cardWidth: 520,
      cardHeight: 560,
      radius: 580,
      angleStep: 28,
      maxDepth: 360,
    };
  }, [isMobile, isTablet, isInfinixHot10, windowWidth]);

  // Active slide index
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

  const count = items.length;

  const safeIndex = useMemo(() => {
    if (count === 0) return 0;
    return Math.min(Math.max(0, activeIndex), count - 1);
  }, [activeIndex, count]);

  const updateIndex = useCallback(
    (newIndex: number) => {
      if (count === 0) return;
      let next = newIndex;
      if (loop) {
        next = ((newIndex % count) + count) % count;
      } else {
        next = Math.max(0, Math.min(count - 1, newIndex));
      }
      if (controlledIndex === undefined) {
        setInternalIndex(next);
      }
      onActiveChange?.(next);
    },
    [count, loop, controlledIndex, onActiveChange]
  );

  // Dragging & Inertia Physics State
  const [dragOffset, setDragOffset] = useState(0); // in fractions of slide (-1 to +1)
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const recentPositionsRef = useRef<Array<{ x: number; time: number }>>([]);
  const animFrameRef = useRef<number>(0);
  const isPointerDownRef = useRef(false);
  const hasMovedSignificantlyRef = useRef(false);

  // Auto-play state & timer
  const [isPlaying, setIsPlaying] = useState(!reducedMotion && !isTouch && autoPlayInterval > 0);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const lastTickTimeRef = useRef<number>(Date.now());
  const timerRafRef = useRef<number>(0);
  const isHoveredRef = useRef(false);
  const isVisibleRef = useRef(true);

  // Card Tilt State (mouse/pointer coordinates inside active card)
  const [tiltMap, setTiltMap] = useState<Record<number, { tiltX: number; tiltY: number }>>({});

  // Slide navigation handlers
  const goNext = useCallback(() => {
    setProgress(0);
    updateIndex(safeIndex + 1);
  }, [safeIndex, updateIndex]);

  const goPrev = useCallback(() => {
    setProgress(0);
    updateIndex(safeIndex - 1);
  }, [safeIndex, updateIndex]);

  const goTo = useCallback(
    (idx: number) => {
      setProgress(0);
      updateIndex(idx);
    },
    [updateIndex]
  );

  // Auto-play animation timer with rAF
  useEffect(() => {
    if (!isPlaying || autoPlayInterval <= 0 || count <= 1 || isDragging) {
      return;
    }

    lastTickTimeRef.current = performance.now();

    const tick = (now: number) => {
      if (!isHoveredRef.current && isVisibleRef.current && !isPointerDownRef.current) {
        const delta = now - lastTickTimeRef.current;
        const progressIncrement = (delta / autoPlayInterval) * 100;
        setProgress((prev) => {
          const next = prev + progressIncrement;
          if (next >= 100) {
            goNext();
            return 0;
          }
          return next;
        });
      }
      lastTickTimeRef.current = now;
      timerRafRef.current = requestAnimationFrame(tick);
    };

    timerRafRef.current = requestAnimationFrame(tick);

    return () => {
      if (timerRafRef.current) cancelAnimationFrame(timerRafRef.current);
    };
  }, [isPlaying, autoPlayInterval, count, isDragging, goNext]);

  // Pause when not in viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goTo(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goTo(count - 1);
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Toggle play/pause
        if (showPlayPause) {
          e.preventDefault();
          setIsPlaying((p) => !p);
        }
      }
    },
    [goPrev, goNext, goTo, count, showPlayPause]
  );

  // Pointer Events & Inertia Dragging calculations
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only respond to primary click/touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const target = e.target as HTMLElement;
    // Don't hijack clicks on buttons, links, or inputs
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('input') ||
      target.closest('textarea')
    ) {
      return;
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }

    isPointerDownRef.current = true;
    hasMovedSignificantlyRef.current = false;
    dragStartRef.current = { x: e.clientX, y: e.clientY, time: performance.now() };
    recentPositionsRef.current = [{ x: e.clientX, time: performance.now() }];

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;

    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    // Detect if this is horizontal drag
    if (!isDragging) {
      if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
        if (Math.abs(dx) > Math.abs(dy)) {
          setIsDragging(true);
          hasMovedSignificantlyRef.current = true;
        } else {
          // Vertical scroll: release pointer capture so user can scroll the page!
          isPointerDownRef.current = false;
          try {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
          } catch {
            // ignore
          }
          return;
        }
      }
    }

    if (isDragging) {
      e.preventDefault();
      const now = performance.now();
      recentPositionsRef.current.push({ x: e.clientX, time: now });
      // Keep only recent samples (last 120ms)
      recentPositionsRef.current = recentPositionsRef.current.filter((p) => now - p.time < 120);

      const fraction = -dx / (cardMetrics.cardWidth * 0.85);
      setDragOffset(fraction);
    }
  };

  const finishDrag = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current && !isDragging) return;

    isPointerDownRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!isDragging) {
      setIsDragging(false);
      setDragOffset(0);
      return;
    }

    setIsDragging(false);

    // Calculate release velocity
    const now = performance.now();
    const recent = recentPositionsRef.current.filter((p) => now - p.time < 120);
    let velocity = 0; // px/ms
    if (recent.length >= 2) {
      const first = recent[0];
      const last = recent[recent.length - 1];
      const dt = last.time - first.time;
      if (dt > 10) {
        velocity = (last.x - first.x) / dt;
      }
    }

    // Determine destination index
    let slideDelta = 0;
    const currentFraction = dragOffset;

    if (Math.abs(velocity) > 0.4) {
      slideDelta = velocity > 0 ? -1 : 1;
    } else if (Math.abs(currentFraction) > 0.22) {
      slideDelta = currentFraction > 0 ? 1 : -1;
    }

    // Animate drag offset back to 0 while transitioning index
    const targetIdx = safeIndex + slideDelta;
    updateIndex(targetIdx);

    // Spring smooth animation back to 0
    let startVal = currentFraction;
    const startTime = performance.now();
    const duration = 240;

    const animateReset = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(1, elapsed / duration);
      // easeOutCubic
      const ease = 1 - Math.pow(1 - progress, 3);
      setDragOffset(startVal * (1 - ease));

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateReset);
      } else {
        setDragOffset(0);
      }
    };

    animFrameRef.current = requestAnimationFrame(animateReset);
  };

  // Card Mouse Move for 3D Tilt Physics & Specular Glare
  const handleCardMouseMove = (
    e: React.MouseEvent<HTMLDivElement>,
    index: number
  ) => {
    if (isTouch || isLowTier || reducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to +0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to +0.5
    setTiltMap((prev) => ({
      ...prev,
      [index]: { tiltX: -y * 10, tiltY: x * 10 },
    }));
  };

  const handleCardMouseLeave = (index: number) => {
    setTiltMap((prev) => ({
      ...prev,
      [index]: { tiltX: 0, tiltY: 0 },
    }));
  };

  if (count === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => {
        isHoveredRef.current = true;
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false;
      }}
      className={`relative w-full select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-3xl ${className}`}
      style={{
        touchAction: 'pan-y pinch-zoom',
      }}
    >
      {/* ═══ 3D HEMISPHERE STAGE ═══ */}
      <div
        ref={trackRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        className="relative w-full flex items-center justify-center overflow-visible py-8 sm:py-12 cursor-grab active:cursor-grabbing"
        style={{
          perspective: isLowTier ? 'none' : '1300px',
          perspectiveOrigin: '50% 50%',
          minHeight: cardMetrics.cardHeight + 40,
        }}
      >
        {items.map((item, index) => {
          // Distance calculation with circular loop wrap
          let dist = index - (safeIndex + dragOffset);
          if (loop && count > 1) {
            dist = ((dist + count / 2) % count + count) % count - count / 2;
          }

          const absDist = Math.abs(dist);
          const isVisible = absDist <= (isMobile ? 1.8 : 2.8);

          if (!isVisible) {
            return null;
          }

          // 3D Hemisphere trigonometry
          const rad = (dist * cardMetrics.angleStep * Math.PI) / 180;
          const translateX = Math.sin(rad) * cardMetrics.radius;
          const translateZ = (Math.cos(rad) - 1) * cardMetrics.maxDepth;
          const rotateY = dist * cardMetrics.angleStep * 0.85;
          const rotateZ = -dist * 1.2;
          const scale = Math.max(0.76, 1 - absDist * 0.12);
          const opacity = Math.max(0.25, 1 - absDist * 0.32);
          const zIndex = Math.round(100 - absDist * 10);
          const isActive = absDist < 0.45;
          const filterBlur =
            isLowTier || reducedMotion ? 0 : Math.min(6, Math.max(0, (absDist - 0.4) * 3));

          const tilt = tiltMap[index] || { tiltX: 0, tiltY: 0 };
          const cardTiltX = isActive ? tilt.tiltX : 0;
          const cardTiltY = isActive ? tilt.tiltY : 0;

          const key = keyExtractor(item, index);

          return (
            <div
              key={key}
              onClick={(e) => {
                if (hasMovedSignificantlyRef.current) {
                  e.stopPropagation();
                  return;
                }
                if (!isActive) {
                  e.stopPropagation();
                  goTo(index);
                } else {
                  onItemClick?.(item, index);
                }
              }}
              onMouseMove={(e) => handleCardMouseMove(e, index)}
              onMouseLeave={() => handleCardMouseLeave(index)}
              className={`absolute top-1/2 left-1/2 will-change-transform transition-opacity duration-300 ${
                isActive ? 'cursor-pointer' : 'cursor-pointer hover:opacity-90'
              }`}
              style={{
                width: cardMetrics.cardWidth,
                maxHeight: cardMetrics.cardHeight,
                zIndex,
                opacity,
                transform: `
                  translate(-50%, -50%)
                  translate3d(${translateX}px, 0px, ${translateZ}px)
                  rotateY(${rotateY + cardTiltY}deg)
                  rotateX(${cardTiltX}deg)
                  rotateZ(${rotateZ}deg)
                  scale(${scale})
                `,
                filter: filterBlur > 0 ? `blur(${filterBlur}px)` : 'none',
                transformStyle: 'preserve-3d',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transition: isDragging
                  ? 'none'
                  : 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease, filter 0.45s ease',
              }}
            >
              {renderItem({
                item,
                index,
                isActive,
                distance: dist,
                parallaxX: -dist * 24,
                tilt,
                isDragging,
              })}
            </div>
          );
        })}
      </div>

      {/* ═══ CONTROLS & NAVIGATION BAR ═══ */}
      <div className="relative z-30 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2 px-2">
        {/* Left Side: Play/Pause and Progress Ring */}
        <div className="flex items-center gap-3">
          {showPlayPause && autoPlayInterval > 0 && (
            <button
              type="button"
              onClick={() => setIsPlaying((p) => !p)}
              className="relative p-2.5 min-w-[42px] min-h-[42px] rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/40 shadow-sm flex items-center justify-center transition-all active:scale-95"
              aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
              title={isPlaying ? 'Pause auto-play (Space)' : 'Start auto-play (Space)'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              {/* Circular Progress Ring */}
              {showProgressTimer && isPlaying && (
                <svg
                  className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
                  viewBox="0 0 42 42"
                >
                  <circle
                    cx="21"
                    cy="21"
                    r="18"
                    className="stroke-transparent fill-none"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="21"
                    cy="21"
                    r="18"
                    className="fill-none transition-all duration-75 ease-linear"
                    stroke={`rgba(${accentColor}, 0.85)`}
                    strokeWidth="2.5"
                    strokeDasharray={113.1}
                    strokeDashoffset={113.1 - (113.1 * progress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Slide Indicator Text */}
          <div className="px-3.5 py-1.5 rounded-xl text-xs font-black bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 backdrop-blur-md shadow-sm">
            <span className="text-blue-600 dark:text-blue-400 font-extrabold">
              {safeIndex + 1}
            </span>
            <span className="opacity-40 mx-1">/</span>
            <span>{count}</span>
          </div>
        </div>

        {/* Center: Pagination Dots */}
        {showDots && count > 1 && (
          <div
            className="flex items-center gap-1.5 overflow-x-auto max-w-[280px] sm:max-w-md px-2 py-1 scrollbar-hide"
            role="tablist"
            aria-label="Slides"
          >
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === safeIndex}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => goTo(i)}
                className={`h-2 rounded-full transition-all duration-300 min-w-[8px] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  i === safeIndex
                    ? 'w-8 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md shadow-blue-500/30 scale-105'
                    : 'w-2 bg-gray-300 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 opacity-70'
                }`}
              />
            ))}
          </div>
        )}

        {/* Right Side: Arrow Navigation Buttons */}
        {showArrows && (
          <div className="flex items-center gap-2">
            {customControls}
            <button
              type="button"
              onClick={goPrev}
              disabled={!loop && safeIndex === 0}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-blue-600 hover:text-white hover:border-blue-500 shadow-md flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Previous slide"
              title="Previous slide (Left Arrow)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={!loop && safeIndex === count - 1}
              className="p-2.5 min-w-[44px] min-h-[44px] rounded-xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-blue-600 hover:text-white hover:border-blue-500 shadow-md flex items-center justify-center transition-all duration-200 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              aria-label="Next slide"
              title="Next slide (Right Arrow)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThreeDParallaxCarousel;
