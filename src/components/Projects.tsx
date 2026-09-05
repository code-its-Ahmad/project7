import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValue,
  useMotionTemplate,
} from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import {
  FolderKanban,
  ExternalLink,
  Github,
  Heart,
  Eye,
  Search,
  Sparkles,
  X,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  LayoutGrid,
  Layers,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { useDeviceCapabilities } from '../context/DeviceCapabilitiesContext';
import { useFocusTrap } from '../hooks/useFocusTrap';
import { lockScroll, unlockScroll } from '../lib/scrollLock';
import { scrollToSection } from '../lib/scrollTo';
import { Project } from '../api/services';
import ThreeDParallaxCarousel from './common/ThreeDParallaxCarousel';

const LAST_VIEWED_KEY = 'lastViewedProject';

type ProjectViewMode = 'carousel3d' | 'grid';

/* ═══════════════════════════════════════════════════════════
   CUSTOM HOOKS
   ═══════════════════════════════════════════════════════════ */

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
};

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(query).matches
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);

    update();

    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', update);
      return () => mql.removeEventListener('change', update);
    }

    mql.addListener(update);
    return () => mql.removeListener(update);
  }, [query]);

  return matches;
};

/* ═══════════════════════════════════════════════════════════
   3D MOUSE GLOW CARD
   ═══════════════════════════════════════════════════════════ */

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

const GlowCard: React.FC<GlowCardProps> = ({ children, className = '', enabled = true }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rectRef = useRef<DOMRect | null>(null);
  const frameRef = useRef(0);
  const pointRef = useRef({ x: 0, y: 0 });

  const cacheRect = useCallback(() => {
    if (!enabled || !cardRef.current) return;
    rectRef.current = cardRef.current.getBoundingClientRect();
  }, [enabled]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enabled) return;
      const rect = rectRef.current ?? cardRef.current?.getBoundingClientRect();
      if (!rect) return;
      rectRef.current = rect;
      pointRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
      if (frameRef.current) return;
      frameRef.current = requestAnimationFrame(() => {
        frameRef.current = 0;
        mouseX.set(pointRef.current.x);
        mouseY.set(pointRef.current.y);
      });
    },
    [enabled, mouseX, mouseY]
  );

  useEffect(() => () => cancelAnimationFrame(frameRef.current), []);

  const background = useMotionTemplate`
    radial-gradient(
      600px circle at ${mouseX}px ${mouseY}px,
      rgba(59, 130, 246, 0.14),
      transparent 40%
    )
  `;

  return (
    <div
      ref={cardRef}
      onMouseEnter={cacheRect}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden ${className}`}
    >
      {enabled && (
        <motion.div
          className="pointer-events-none absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{ background }}
        />
      )}
      {children}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ═══════════════════════════════════════════════════════════ */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, rotateX: 15, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 80, damping: 15, mass: 1 },
  },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.9, rotateX: 10, y: 50 },
  visible: {
    opacity: 1,
    scale: 1,
    rotateX: 0,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 120, damping: 18, mass: 0.8 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    rotateX: -5,
    y: 30,
    transition: { duration: 0.25, ease: 'easeInOut' as const },
  },
};

const heroTextVariants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(10px)' },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

/* ═══════════════════════════════════════════════════════════
   DOMINANT COLOUR ENGINE
   ═══════════════════════════════════════════════════════════ */

const FALLBACK_ACCENT = '59, 130, 246'; // blue-500
const colorCache = new Map<string, string>();

function getDominantColor(src: string): Promise<string> {
  if (!src) return Promise.resolve(FALLBACK_ACCENT);
  const cached = colorCache.get(src);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const done = (rgb: string) => {
      colorCache.set(src, rgb);
      resolve(rgb);
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = src;

    img.onerror = () => done(FALLBACK_ACCENT);
    img.onload = () => {
      try {
        const size = 16;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return done(FALLBACK_ACCENT);

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let r = 0;
        let g = 0;
        let b = 0;
        let count = 0;

        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 128) continue;
          const [pr, pg, pb] = [data[i], data[i + 1], data[i + 2]];
          const max = Math.max(pr, pg, pb);
          const min = Math.min(pr, pg, pb);
          if (max < 40 || min > 225 || max - min < 18) continue;
          r += pr;
          g += pg;
          b += pb;
          count++;
        }

        if (!count) return done(FALLBACK_ACCENT);
        done(`${Math.round(r / count)}, ${Math.round(g / count)}, ${Math.round(b / count)}`);
      } catch {
        done(FALLBACK_ACCENT);
      }
    };
  });
}

function useDominantColors(items: { id: number; image: string }[], enabled: boolean) {
  const [colors, setColors] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!enabled || items.length === 0) return;
    let cancelled = false;

    const run = async () => {
      for (const item of items) {
        if (cancelled) return;
        const rgb = await getDominantColor(item.image);
        if (cancelled) return;
        setColors((prev) => (prev[item.id] === rgb ? prev : { ...prev, [item.id]: rgb }));
      }
    };

    const idle =
      typeof window.requestIdleCallback === 'function'
        ? window.requestIdleCallback(() => void run())
        : window.setTimeout(() => void run(), 200);

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idle as number);
      else window.clearTimeout(idle as number);
    };
  }, [enabled, items]);

  return colors;
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */

const ProjectsSection: React.FC = () => {
  const { projects, likeProject, trackProjectView } = usePortfolio();
  const { playClick, playHover, playWhoosh } = useSound();

  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-100px' });

  // Responsive / capability flags
  const { reducedMotion, tier, isTouch: capsTouch } = useDeviceCapabilities();
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const coarsePointer = useMediaQuery('(pointer: coarse)');
  const isTouch = coarsePointer || capsTouch;

  // Extra runtime probe for Infinix Hot 10 / compact screen
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 768
  );
  const [isLowPerformance, setIsLowPerformance] = useState(
    () =>
      typeof window !== 'undefined' &&
      (window.innerWidth <= 720 || (navigator.hardwareConcurrency ?? 8) < 4)
  );

  useEffect(() => {
    let frame = 0;
    const checkDevice = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const width = window.innerWidth;
        const cores = navigator.hardwareConcurrency ?? 8;
        const memory = Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8);
        const saveData = Boolean(
          (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
        );

        setIsNarrow(width <= 768);
        setIsLowPerformance(width <= 720 || cores < 4 || memory <= 4 || saveData);
      });
    };

    checkDevice();
    window.addEventListener('resize', checkDevice, { passive: true });
    window.addEventListener('orientationchange', checkDevice, { passive: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  const performanceMode =
    reducedMotion || isLowPerformance || tier === 'low'
      ? 'low'
      : isTouch || tier === 'mid'
        ? 'balanced'
        : 'cinematic';

  const enableDepthFX = performanceMode === 'cinematic' && !isTouch;
  const cinematic = performanceMode === 'cinematic';

  // State
  const [viewMode, setViewMode] = useState<ProjectViewMode>('carousel3d');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Scroll choreography
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const springCfg =
    performanceMode === 'cinematic'
      ? { stiffness: 90, damping: 28, restDelta: 0.001 }
      : { stiffness: 130, damping: 32, restDelta: 0.002 };

  const railProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.4 });
  const bgY = useTransform(scrollYProgress, [0, 1], cinematic ? ['-8%', '28%'] : ['0%', '0%']);
  const bgSpring = useSpring(bgY, springCfg);
  const bgY2 = useTransform(scrollYProgress, [0, 1], cinematic ? ['22%', '-14%'] : ['0%', '0%']);
  const bgSpring2 = useSpring(bgY2, springCfg);
  const bgRotate = useTransform(scrollYProgress, [0, 1], cinematic ? [0, 32] : [0, 0]);
  const bgRotateSpring = useSpring(bgRotate, springCfg);

  const stageRotateX = useTransform(
    scrollYProgress,
    [0, 0.22, 0.78, 1],
    cinematic ? [7, 0, 0, -7] : [0, 0, 0, 0]
  );
  const stageScale = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    cinematic ? [0.94, 1, 1, 0.94] : [1, 1, 1, 1]
  );
  const stageOpacity = useTransform(
    scrollYProgress,
    [0, 0.16, 0.84, 1],
    cinematic ? [0.35, 1, 1, 0.35] : [1, 1, 1, 1]
  );
  const stageRotateXSpring = useSpring(stageRotateX, springCfg);
  const stageScaleSpring = useSpring(stageScale, springCfg);

  // Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => p.category && set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    return projects.filter((p) => {
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      if (!q) return matchesCat;
      const matchesSearch =
        p.title.toLowerCase().includes(q) ||
        (p.short_description || '').toLowerCase().includes(q) ||
        (p.technologies || []).some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [projects, selectedCategory, debouncedSearch]);

  const showcaseProjects = filteredProjects;

  // Dominant color aura
  const accentSources = useMemo(
    () => filteredProjects.map((p) => ({ id: p.id, image: p.image })),
    [filteredProjects]
  );
  const dominantColors = useDominantColors(
    accentSources,
    performanceMode === 'cinematic'
  );
  const accentOf = useCallback(
    (id: number) => dominantColors[id] || FALLBACK_ACCENT,
    [dominantColors]
  );

  const activeAccent =
    accentOf(showcaseProjects[carouselActiveIndex]?.id ?? showcaseProjects[0]?.id ?? -1);

  // Filter skeleton trigger
  const filterKey = `${selectedCategory}::${debouncedSearch.trim().toLowerCase()}`;
  const previousFilterKey = useRef(filterKey);
  useEffect(() => {
    if (previousFilterKey.current === filterKey) return;
    previousFilterKey.current = filterKey;
    setIsSearching(true);
    const timer = setTimeout(() => setIsSearching(false), 300);
    return () => clearTimeout(timer);
  }, [filterKey]);

  // Handlers
  const handleOpenCaseStudy = useCallback(
    (project: Project) => {
      playClick();
      void trackProjectView(project.id);
      setSelectedProject(project);
      setActiveGalleryIndex(0);
      try {
        localStorage.setItem(LAST_VIEWED_KEY, String(project.id));
      } catch {
        /* storage disabled */
      }
    },
    [playClick, trackProjectView]
  );

  const handleCloseCaseStudy = useCallback(() => {
    setSelectedProject(null);
  }, []);

  useEffect(() => {
    if (!selectedProject) return;
    lockScroll('project-case-study');
    return () => unlockScroll('project-case-study');
  }, [selectedProject]);

  const modalRef = useFocusTrap<HTMLDivElement>(Boolean(selectedProject), {
    onEscape: handleCloseCaseStudy,
  });

  const handleLike = useCallback(
    (e: React.MouseEvent, id: number) => {
      e.stopPropagation();
      if (likedMap[id]) return;
      playClick();
      setLikedMap((prev) => ({ ...prev, [id]: true }));
      void likeProject(id);
    },
    [likedMap, playClick, likeProject]
  );

  const handleReset = useCallback(() => {
    setSelectedCategory('All');
    setSearchQuery('');
    playWhoosh();
  }, [playWhoosh]);

  // Case study gallery
  const galleryImages = useMemo(() => {
    if (!selectedProject) return [] as string[];
    const list = (selectedProject.gallery_images || []).filter(Boolean);
    return list.length > 0 ? list : [selectedProject.image].filter(Boolean);
  }, [selectedProject]);

  const goGallery = useCallback(
    (direction: -1 | 1) => {
      if (galleryImages.length < 2) return;
      playClick();
      setActiveGalleryIndex(
        (prev) => (prev + direction + galleryImages.length) % galleryImages.length
      );
    },
    [galleryImages.length, playClick]
  );

  useEffect(() => {
    if (!selectedProject || galleryImages.length < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goGallery(-1);
      if (e.key === 'ArrowRight') goGallery(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedProject, galleryImages.length, goGallery]);

  return (
    <section
      ref={sectionRef}
      id="projects"
      aria-labelledby="projects-heading"
      className={`relative min-h-screen py-20 sm:py-28 lg:py-32 px-3.5 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-b from-gray-50 via-gray-100 to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-500 ${
        performanceMode === 'low'
          ? 'projects-performance-low'
          : performanceMode === 'balanced'
          ? 'projects-performance-balanced'
          : 'projects-performance-cinematic'
      }`}
    >
      {/* ═══ SCROLL-LINKED AURA FIELD ═══ */}
      <motion.div
        className="absolute inset-0 z-0 opacity-40 dark:opacity-25 pointer-events-none will-change-transform"
        style={{ y: bgSpring, rotate: bgRotateSpring }}
        aria-hidden="true"
      >
        <div
          className="absolute top-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 rounded-full blur-[110px] sm:blur-[128px] transition-all duration-700"
          style={{ background: `rgba(${activeAccent}, 0.28)` }}
        />
      </motion.div>
      <motion.div
        className="absolute inset-0 z-0 opacity-35 dark:opacity-20 pointer-events-none will-change-transform"
        style={{ y: bgSpring2 }}
        aria-hidden="true"
      >
        <div className="absolute bottom-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-purple-400/25 rounded-full blur-[110px] sm:blur-[128px]" />
        <div className="absolute top-1/3 right-1/2 w-56 h-56 bg-cyan-400/15 rounded-full blur-[100px]" />
      </motion.div>

      {/* ═══ SECTION SCROLL RAIL ═══ */}
      <div
        className="pointer-events-none absolute left-0 top-0 h-full w-[3px] z-10 hidden sm:block"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gray-300/30 dark:bg-white/5" />
        <motion.div
          className="absolute left-0 top-0 w-full origin-top rounded-full"
          style={{
            height: '100%',
            scaleY: railProgress,
            background: `linear-gradient(to bottom, rgba(${activeAccent}, 0.9), rgb(168 85 247 / 0.9))`,
          }}
        />
      </div>

      <motion.div
        className="relative z-10 max-w-7xl mx-auto w-full space-y-10 sm:space-y-14"
        style={{
          rotateX: stageRotateXSpring,
          scale: stageScaleSpring,
          opacity: stageOpacity,
          transformPerspective: 1400,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* ═══ SECTION HEADER ═══ */}
        <div ref={headerRef} className="text-center space-y-4 perspective-1000">
          <motion.div
            custom={0}
            initial="hidden"
            animate={isHeaderInView ? 'visible' : 'hidden'}
            variants={heroTextVariants}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-bold text-blue-600 dark:text-blue-400 backdrop-blur-xl shadow-lg shadow-blue-500/5"
          >
            <FolderKanban className="w-4 h-4" />
            <span>Featured Case Studies &amp; Work</span>
          </motion.div>

          <motion.h2
            id="projects-heading"
            custom={1}
            initial="hidden"
            animate={isHeaderInView ? 'visible' : 'hidden'}
            variants={heroTextVariants}
            className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight"
            style={{ perspective: 1000 }}
          >
            <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Architected &amp; Built
            </span>
            <br className="sm:hidden" />
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              {' '}
              Systems
            </span>
          </motion.h2>

          <motion.p
            custom={2}
            initial="hidden"
            animate={isHeaderInView ? 'visible' : 'hidden'}
            variants={heroTextVariants}
            className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Deep-dive into production full-stack platforms, machine learning vision
            applications, and cross-platform mobile apps.
          </motion.p>
        </div>

        {/* ═══ CONTROL BAR — Glassmorphic Dock ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: 'spring' as const, stiffness: 100, damping: 20, delay: 0.2 }}
          className="p-4 sm:p-5 rounded-3xl bg-white/75 dark:bg-gray-900/75 backdrop-blur-2xl border border-gray-200/70 dark:border-gray-800/70 shadow-2xl shadow-black/5 space-y-4"
        >
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-gray-100/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 self-start lg:self-auto backdrop-blur-md">
              {[
                { mode: 'carousel3d' as const, icon: Layers, label: '3D Parallax Carousel' },
                { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid Explorer' },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    playWhoosh();
                    setViewMode(mode);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-80 group">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects, stack, tech..."
                className="w-full pl-10 pr-10 py-2.5 text-sm bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-gray-900 dark:text-white transition-all shadow-inner"
              />
              <AnimatePresence>
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 shrink-0">
              <Filter className="w-3.5 h-3.5" /> Filter
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1 snap-x">
              {categories.map((cat) => {
                const count =
                  cat === 'All'
                    ? projects.length
                    : projects.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={selectedCategory === cat}
                    onClick={() => {
                      playWhoosh();
                      setSelectedCategory(cat);
                    }}
                    onMouseEnter={playHover}
                    className={`snap-start px-3.5 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all duration-300 active:scale-95 ${
                      selectedCategory === cat
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25'
                        : 'bg-gray-100/80 dark:bg-gray-800/60 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border border-transparent hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {cat}
                    <span className="ml-1.5 opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ═══ VIEW MODE 1: 3D PARALLAX GLASSMORPHIC CAROUSEL ═══ */}
        <AnimatePresence mode="wait">
          {viewMode === 'carousel3d' && showcaseProjects.length > 0 && (
            <motion.div
              key="carousel3d"
              initial={{ opacity: 0, rotateY: -4 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 4 }}
              transition={{ duration: 0.4 }}
              className="relative py-2 sm:py-6"
            >
              <ThreeDParallaxCarousel<Project>
                items={showcaseProjects}
                keyExtractor={(project) => project.id}
                activeIndex={carouselActiveIndex}
                onActiveChange={setCarouselActiveIndex}
                accentColor={activeAccent}
                ariaLabel="Architected Projects 3D Parallax Showcase"
                autoPlayInterval={cinematic ? 6500 : 0}
                onItemClick={handleOpenCaseStudy}
                renderItem={({ item: project, isActive, parallaxX, tilt }) => {
                  const cardAccent = accentOf(project.id);
                  return (
                    <div
                      onMouseEnter={playHover}
                      className="group relative w-full h-full rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-2xl border border-gray-200/80 dark:border-gray-800/80 shadow-2xl transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
                      style={{
                        boxShadow: isActive
                          ? `0 24px 60px -20px rgba(${cardAccent}, 0.5), 0 0 0 1px rgba(${cardAccent}, 0.3)`
                          : '0 12px 30px -15px rgba(0, 0, 0, 0.3)',
                        transformStyle: 'preserve-3d',
                      }}
                    >
                      {/* Top Accent line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-[2.5px] transition-opacity duration-300 z-20"
                        style={{
                          background: `linear-gradient(90deg, transparent, rgba(${cardAccent}, 0.9), transparent)`,
                          opacity: isActive ? 1 : 0.4,
                        }}
                      />

                      {/* Image Header with Multi-Depth Parallax */}
                      <div className="relative h-52 sm:h-60 lg:h-64 w-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                        <img
                          src={project.image}
                          alt={project.title}
                          loading="lazy"
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                          style={{
                            transform: `translate3d(${parallaxX * 0.4}px, 0, 0) scale(${
                              isActive ? 1.04 : 1
                            })`,
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/project1.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                        {/* Floating Badges */}
                        <div
                          className="absolute top-3.5 left-3.5 flex gap-2 z-10"
                          style={{ transform: 'translateZ(20px)' }}
                        >
                          <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/10 shadow-sm">
                            {project.category}
                          </span>
                          {project.featured && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white flex items-center gap-1 shadow-md">
                              <Sparkles className="w-3 h-3" /> Featured
                            </span>
                          )}
                        </div>

                        {/* Like Button */}
                        <button
                          type="button"
                          onClick={(e) => handleLike(e, project.id)}
                          className={`absolute top-3.5 right-3.5 p-2.5 rounded-full backdrop-blur-md transition-all duration-200 z-10 active:scale-90 ${
                            likedMap[project.id]
                              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40'
                              : 'bg-black/50 text-white hover:bg-pink-500'
                          }`}
                          aria-label={`Like ${project.title}`}
                          style={{ transform: 'translateZ(24px)' }}
                        >
                          <Heart
                            className={`w-4 h-4 ${likedMap[project.id] ? 'fill-white' : ''}`}
                          />
                        </button>
                      </div>

                      {/* Content Body */}
                      <div
                        className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between"
                        style={{ transform: 'translateZ(10px)' }}
                      >
                        <div className="space-y-2">
                          <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {project.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                            {project.short_description}
                          </p>
                        </div>

                        {/* Tech Stack Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {project.technologies.slice(0, 4).map((tech) => (
                            <span
                              key={tech}
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60 shadow-xs"
                            >
                              {tech}
                            </span>
                          ))}
                          {project.technologies.length > 4 && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                              +{project.technologies.length - 4}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="p-4 bg-gray-50/90 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800/80 flex items-center justify-between">
                        <div className="flex items-center gap-3.5 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1.5 font-medium">
                            <Eye className="w-3.5 h-3.5 text-gray-400" /> {project.views || 0}
                          </span>
                          <span className="flex items-center gap-1.5 text-pink-500 font-bold">
                            <Heart className="w-3.5 h-3.5 fill-pink-500" />{' '}
                            {project.likes || 0}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          {project.github_url && (
                            <a
                              href={project.github_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                              title="GitHub Repository"
                            >
                              <Github className="w-4 h-4" />
                            </a>
                          )}
                          {project.live_url && (
                            <a
                              href={project.live_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                              title="Live Production Demo"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5 ml-1">
                            Case Study <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }}
              />
            </motion.div>
          )}

          {/* ═══ VIEW MODE 2: GRID EXPLORER ═══ */}
          {viewMode === 'grid' && (
            <motion.div
              key="grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-50px' }}
              layout
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8 perspective-1500"
            >
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    layout
                    key={project.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.9, rotateX: 10, transition: { duration: 0.2 } }}
                    transition={{ delay: Math.min(index * 0.05, 0.3) }}
                    className="h-full"
                  >
                    <Tilt
                      tiltMaxAngleX={enableDepthFX ? 6 : 0}
                      tiltMaxAngleY={enableDepthFX ? 6 : 0}
                      perspective={1000}
                      scale={1.01}
                      transitionSpeed={500}
                      tiltEnable={enableDepthFX}
                      className="h-full"
                    >
                      <GlowCard enabled={enableDepthFX} className="h-full rounded-3xl group">
                        <div
                          onClick={() => handleOpenCaseStudy(project)}
                          onMouseEnter={playHover}
                          className="project-aura h-full rounded-3xl bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border border-gray-200/70 dark:border-gray-800/70 shadow-lg transition-all duration-500 flex flex-col overflow-hidden cursor-pointer"
                          style={{ '--accent': accentOf(project.id) } as React.CSSProperties}
                        >
                          <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                            <motion.img
                              src={project.image}
                              alt={project.title}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              whileHover={{ scale: 1.06 }}
                              transition={{ duration: 0.6 }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/assets/project1.png';
                              }}
                            />
                            <div className="absolute top-3 left-3 flex gap-1.5">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 backdrop-blur-md text-white">
                                {project.category}
                              </span>
                              {project.featured && (
                                <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-white flex items-center gap-1 shadow-sm">
                                  <Sparkles className="w-3 h-3" /> Featured
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleLike(e, project.id)}
                              className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                                likedMap[project.id]
                                  ? 'bg-pink-500 text-white shadow-lg'
                                  : 'bg-black/40 text-white hover:bg-pink-500'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  likedMap[project.id] ? 'fill-white' : ''
                                }`}
                              />
                            </button>
                          </div>

                          <div className="p-5 sm:p-6 space-y-2.5 flex-1 flex flex-col">
                            <h3 className="font-extrabold text-base sm:text-lg text-gray-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                              {project.title}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed flex-1">
                              {project.short_description}
                            </p>
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {project.technologies.slice(0, 4).map((tech) => (
                                <span
                                  key={tech}
                                  className="px-2 py-1 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50"
                                >
                                  {tech}
                                </span>
                              ))}
                              {project.technologies.length > 4 && (
                                <span className="px-2 py-1 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-500">
                                  +{project.technologies.length - 4}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="p-4 bg-gray-50/80 dark:bg-gray-800/40 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" /> {project.views || 0}
                              </span>
                              <span className="flex items-center gap-1 text-pink-500 font-bold">
                                <Heart className="w-3.5 h-3.5 fill-pink-500" />{' '}
                                {project.likes || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {project.github_url && (
                                <a
                                  href={project.github_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-xl text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                >
                                  <Github className="w-4 h-4" />
                                </a>
                              )}
                              {project.live_url && (
                                <a
                                  href={project.live_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="p-1.5 rounded-xl text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}
                              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                                Case Study <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        </div>
                      </GlowCard>
                    </Tilt>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        <AnimatePresence>
          {filteredProjects.length === 0 && !isSearching && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-16 space-y-4 rounded-3xl bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
                No projects match your criteria.
              </p>
              <button
                onClick={handleReset}
                className="px-6 py-2.5 text-sm font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all active:scale-95"
              >
                Reset All Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Searching Skeleton */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ═══ CASE STUDY MODAL ═══ */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
            <motion.div
              className="fixed inset-0 bg-black/80 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCaseStudy}
            />

            <motion.div
              ref={modalRef}
              role="dialog"
              aria-modal="true"
              aria-label={`${selectedProject.title} case study`}
              className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-800 z-10 max-h-[96vh] sm:max-h-[94vh] flex flex-col overflow-hidden"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ perspective: 1200 }}
            >
              {/* Top Bar */}
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
                    {selectedProject.category}
                  </span>
                  <h3 className="font-extrabold text-lg sm:text-2xl text-gray-900 dark:text-white">
                    {selectedProject.title}
                  </h3>
                </div>
                <motion.button
                  whileHover={{ rotate: 90, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleCloseCaseStudy}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 custom-scrollbar">
                {/* Gallery */}
                <div className="space-y-3">
                  <div className="relative h-52 xs:h-56 sm:h-80 w-full rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 group">
                    <AnimatePresence mode="wait">
                      <motion.img
                        key={activeGalleryIndex}
                        src={galleryImages[activeGalleryIndex] || selectedProject.image}
                        alt={`${selectedProject.title} screenshot ${activeGalleryIndex + 1}`}
                        loading="lazy"
                        className="w-full h-full object-cover"
                        initial={{ opacity: 0, scale: 1.05 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4 }}
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset.fallbackApplied === 'true') {
                            img.style.visibility = 'hidden';
                            return;
                          }
                          img.dataset.fallbackApplied = 'true';
                          img.src = selectedProject.image;
                        }}
                      />
                    </AnimatePresence>

                    {galleryImages.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() => goGallery(-1)}
                          aria-label="Previous screenshot"
                          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-blue-600 text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-90"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => goGallery(1)}
                          aria-label="Next screenshot"
                          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 hover:bg-blue-600 text-white backdrop-blur-md flex items-center justify-center transition-all active:scale-90"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                        <span className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/60 text-white backdrop-blur-md">
                          {activeGalleryIndex + 1} / {galleryImages.length}
                        </span>
                      </>
                    )}
                  </div>

                  {galleryImages.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {galleryImages.map((img, i) => (
                        <motion.button
                          key={`${img}-${i}`}
                          type="button"
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setActiveGalleryIndex(i)}
                          aria-label={`Show screenshot ${i + 1}`}
                          className={`w-16 h-12 sm:w-20 sm:h-14 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                            activeGalleryIndex === i
                              ? 'border-blue-600 shadow-md'
                              : 'border-transparent opacity-50 hover:opacity-100'
                          }`}
                        >
                          <img
                            src={img}
                            alt=""
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </motion.button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tech Stack */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">
                    Technologies &amp; Architecture
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.technologies.map((tech) => (
                      <motion.span
                        key={tech}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60"
                      >
                        {tech}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    System Architecture &amp; Overview
                  </h4>
                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                    {selectedProject.full_description || selectedProject.short_description}
                  </p>
                </div>

                {/* Case Study Pillars */}
                {(selectedProject.challenges ||
                  selectedProject.solutions ||
                  selectedProject.outcomes) && (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                  >
                    {selectedProject.challenges && (
                      <motion.div
                        variants={itemVariants}
                        className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-500">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Challenges</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {selectedProject.challenges}
                        </p>
                      </motion.div>
                    )}
                    {selectedProject.solutions && (
                      <motion.div
                        variants={itemVariants}
                        className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-500">
                          <Lightbulb className="w-4 h-4" />
                          <span>Solutions</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {selectedProject.solutions}
                        </p>
                      </motion.div>
                    )}
                    {selectedProject.outcomes && (
                      <motion.div
                        variants={itemVariants}
                        className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2"
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Impact &amp; Outcomes</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                          {selectedProject.outcomes}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="p-5 sm:p-6 bg-gray-50 dark:bg-gray-800/60 border-t border-gray-100 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  {selectedProject.live_url && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={selectedProject.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/25 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Live Demo</span>
                    </motion.a>
                  )}
                  {selectedProject.github_url && (
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      href={selectedProject.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-bold shadow-lg transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      <span>View Code</span>
                    </motion.a>
                  )}
                </div>

                <a
                  href="#contact"
                  onClick={(e) => {
                    e.preventDefault();
                    handleCloseCaseStudy();
                    requestAnimationFrame(() => scrollToSection('contact'));
                  }}
                  className="text-sm font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>Request Similar Architecture</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

/* ═══════════════════════════════════════════════════════════
   ERROR BOUNDARY WRAPPER
   ═══════════════════════════════════════════════════════════ */

const ProjectsFallback: React.FC<FallbackProps> = ({ error, resetErrorBoundary }) => (
  <section
    id="projects"
    className="py-20 px-4 flex items-center justify-center bg-gray-50 dark:bg-gray-950"
  >
    <div className="w-full max-w-md text-center space-y-4 p-6 rounded-3xl border border-red-500/20 bg-red-500/5">
      <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">
        The projects showcase failed to load
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 break-words">
        {(error as Error)?.message || 'Unexpected error.'}
      </p>
      <button
        type="button"
        onClick={resetErrorBoundary}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors active:scale-95"
      >
        <RefreshCw className="w-4 h-4" /> Try again
      </button>
    </div>
  </section>
);

const Projects: React.FC = () => (
  <ErrorBoundary
    FallbackComponent={ProjectsFallback}
    onError={(error) => console.error('[Projects] render failure:', error)}
  >
    <ProjectsSection />
  </ErrorBoundary>
);

export default Projects;