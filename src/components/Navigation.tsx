import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, type Variants } from 'framer-motion';
import {
  Menu,
  X,
  User,
  Home,
  Briefcase,
  Code,
  Folder,
  Award,
  MessageSquare,
  Sparkles,
  Command,
  Terminal,
  Volume2,
  VolumeX,
  Users,
  ChevronRight,
  ChevronDown,
  Send,
  Bot,
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useSound } from '../context/SoundContext';
import { useActiveSection } from '../hooks/useActiveSection';
import { scrollToSection as scrollToSectionLib } from '../lib/scrollTo';

interface NavigationProps {
  onOpenCommandPalette?: () => void;
  onOpenTerminal?: () => void;
}

/**
 * Navigation bar items — declared outside the component to avoid
 * creating a new array reference on every render. This fixes
 * the infinite useEffect re-registration bug that caused scroll
 * listener leak and janky performance on low-end devices.
 */
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'about', label: 'About', icon: User },
  { id: 'projects', label: 'Projects', icon: Folder },
  { id: 'skills', label: 'Skills', icon: Code },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'services', label: 'Services', icon: Sparkles },
  { id: 'certificates', label: 'Certificates', icon: Award },
  { id: 'testimonials', label: 'Reviews', icon: Users },
  { id: 'contact', label: 'Contact', icon: MessageSquare },
] as const;

/** Section ids for the scroll spy — derived from NAV_ITEMS, stable module constant. */
const NAV_SECTION_IDS = NAV_ITEMS.map((item) => item.id);

/** Navbar clearance in px — must match --nav-offset in index.css. */
const NAV_OFFSET = 88;

// ─── Animation Variants ─────────────────────────────────────────────────────

/** Whole navbar entrance: scale up from 0 with a spring bounce */
const navEntryVariants: Variants = {
  hidden: { scale: 0, opacity: 0, rotate: -180 },
  visible: {
    scale: 1,
    opacity: 1,
    rotate: 0,
    transition: {
      duration: 0.7,
      ease: [0.68, -0.55, 0.265, 1.55],
      type: 'spring',
      stiffness: 150,
      damping: 15,
    },
  },
};

/** Desktop nav item staggered entry with subtle 3D flip */
const desktopItemVariants: Variants = {
  hidden: { opacity: 0, x: 50, rotateY: 45 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: {
      delay: 0.15 + i * 0.1,
      duration: 0.5,
      ease: [0.68, -0.55, 0.265, 1.55],
      type: 'spring',
      stiffness: 140,
      damping: 12,
    },
  }),
};

/** Mobile drawer slide + scale morph */
const drawerVariants: Variants = {
  hidden: {
    scale: 0,
    opacity: 0,
    borderRadius: '50%',
  },
  visible: {
    scale: 1,
    opacity: 1,
    borderRadius: '20px',
    transition: {
      duration: 0.5,
      ease: [0.68, -0.55, 0.265, 1.55],
      type: 'spring',
      stiffness: 160,
      damping: 12,
      staggerChildren: 0.035,
      delayChildren: 0.06,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    borderRadius: '50%',
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
};

/** Mobile drawer items — staggered slide-up with subtle rotateY */
const drawerItemVariants: Variants = {
  hidden: { opacity: 0, x: -16, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      delay: i * 0.035,
      type: 'spring',
      stiffness: 200,
      damping: 18,
    },
  }),
  exit: { opacity: 0, x: -10, transition: { duration: 0.12 } },
};

/** Backdrop fade */
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Menu toggle button hover/tap */
const toggleVariants: Variants = {
  hover: {
    scale: 1.2,
    rotate: [0, 10, -10, 0],
    boxShadow: '0 0 15px rgba(96, 165, 250, 0.4)',
    transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
  },
  tap: {
    scale: 0.9,
    rotate: 360,
    transition: { duration: 0.3, type: 'spring', stiffness: 200, damping: 10 },
  },
};

// ─── Component ───────────────────────────────────────────────────────────────

const Navigation = ({ onOpenCommandPalette, onOpenTerminal }: NavigationProps) => {
  const { isMuted, toggleMute, playClick, playHover, playWhoosh, vibrate } = useSound();

  const [isOpen, setIsOpen] = useState(false);
  // IntersectionObserver-based scroll spy: zero layout reads while scrolling,
  // handles lazily-mounted sections, and never leaves a stale highlight.
  const activeSection = useActiveSection(NAV_SECTION_IDS, NAV_OFFSET);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const navRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(false);

  // Keep ref in sync so the scroll handler reads the latest value
  // without re-registering the listener
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // ── Scroll-based reactive transforms (restored from original design) ───
  // These create the signature "breathing" effect as the user scrolls —
  // the navbar gently fades, scales down, and gains frosted-glass blur.
  const { scrollY, scrollYProgress } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 200], [1, 0.97]);
  const navScale = useTransform(scrollY, [0, 200], [1, 0.98]);
  const navBlur = useTransform(scrollY, [0, 200], ['blur(0px)', 'blur(3px)']);

  // Smooth Scroll Progress Indicator
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  // ── Directional navbar reveal logic ───────────────────────────
  // Only handles compact-style + hide/show. Active-section detection lives in
  // the useActiveSection hook (IntersectionObserver — no layout reads here,
  // no per-frame forced reflow, correct for lazily mounted sections).
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        // Compact floating pill style after scrolling past threshold
        setIsScrolled(currentScrollY > 20);

        // Auto-hide on fast scroll down, reveal on scroll up
        if (currentScrollY > 150) {
          if (currentScrollY > lastScrollY.current + 10 && !isOpenRef.current) {
            setIsVisible(false);
          } else if (currentScrollY < lastScrollY.current - 10) {
            setIsVisible(true);
          }
        } else {
          setIsVisible(true);
        }
        lastScrollY.current = currentScrollY;

        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // initial run

    return () => window.removeEventListener('scroll', handleScroll);
  }, []); // ← stable deps, no re-registration

  // ── Handle screen resize to reset menu state on desktop ────────
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false); // Close mobile menu on desktop
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ── Lock body scroll when mobile drawer is open ────────────────
  // Uses overflow + position fixed to prevent iOS Safari rubber-band
  useEffect(() => {
    if (isOpen) {
      const scrollYVal = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYVal}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
    } else {
      const scrollYVal = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      // Restore scroll position
      if (scrollYVal) {
        window.scrollTo(0, parseInt(scrollYVal || '0', 10) * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // ── Smooth scroll via the shared util ─────────────────────────
  // Uses document-absolute getBoundingClientRect + --nav-offset, mirrors the
  // hash into the URL for deep-linking, and respects reduced-motion.
  const scrollToSection = useCallback(
    (id: string) => {
      playWhoosh();
      setIsOpen(false);

      // Small delay so body scroll lock releases before scrolling
      requestAnimationFrame(() => {
        scrollToSectionLib(id, { updateHash: true });
      });
    },
    [playWhoosh]
  );

  // ── Memoize the terminal trigger to avoid inline closures ─────
  const handleTerminalClick = useCallback(() => {
    vibrate(12);
    playClick();
    if (onOpenTerminal) {
      onOpenTerminal();
    } else {
      window.dispatchEvent(new CustomEvent('open-cyber-terminal'));
    }
  }, [vibrate, playClick, onOpenTerminal]);

  const handleCommandPaletteClick = useCallback(() => {
    vibrate(10);
    playClick();
    if (onOpenCommandPalette) onOpenCommandPalette();
  }, [vibrate, playClick, onOpenCommandPalette]);

  const handleSoundToggle = useCallback(() => {
    vibrate(10);
    playClick();
    toggleMute();
  }, [vibrate, playClick, toggleMute]);

  const handleMenuToggle = useCallback(() => {
    vibrate(10);
    playClick();
    setIsOpen((prev) => !prev);
  }, [vibrate, playClick]);

  return (
    <>
      {/* Top Animated Scroll Progress Bar */}
      <div
        className="fixed top-0 left-0 right-0 h-[3px] z-[60] overflow-hidden pointer-events-none"
        style={{ position: 'fixed' }}
      >
        <motion.div
          className="h-full w-full bg-gradient-to-r from-cyan-400 via-blue-500 via-indigo-500 to-purple-500 origin-left will-change-transform"
          style={{
            scaleX,
            boxShadow: '0 0 12px rgba(59,130,246,0.8)',
          }}
        />
      </div>

      {/* Main Dynamic Floating Header — spring entrance animation */}
      <motion.header
        ref={navRef}
        variants={navEntryVariants}
        initial="hidden"
        animate="visible"
        className="fixed top-3 right-3 left-3 z-[45] mx-auto max-w-7xl pointer-events-none will-change-transform"
      >
        {/* Directional hide/show wrapper — separated from the spring entry so they don't fight */}
        <motion.div
          animate={{
            y: isVisible ? 0 : -90,
            opacity: isVisible ? 1 : 0,
          }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="w-full pointer-events-auto"
        >
          <motion.nav
            style={{
              opacity: navOpacity,
              scale: navScale,
              // Applied as backdropFilter (not filter) so the bar gains the
              // original frosted-glass blur while link text stays crisp.
              backdropFilter: navBlur,
              WebkitBackdropFilter: navBlur,
              willChange: 'opacity, transform',
            }}
            className={`w-full px-2.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl transition-colors duration-500 flex items-center justify-between overflow-visible ${isScrolled
              ? 'bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-2xl border border-blue-500/25 shadow-lg shadow-blue-500/15'
              : 'bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-xl border border-blue-500/20 shadow-md shadow-blue-500/10'
              }`}
          >
            {/* Logo / Brand */}
            <motion.button
              onClick={() => scrollToSection('home')}
              onMouseEnter={playHover}
              className="flex items-center space-x-2 sm:space-x-2.5 text-left group focus:outline-none min-w-0"
              aria-label="Scroll to home"
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.92 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            >
              <div className="relative shrink-0">
                <motion.div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25"
                  initial={{ scale: 0, rotate: -180, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 14,
                    delay: 0.1,
                  }}
                  whileHover={{
                    boxShadow: '0 0 18px rgba(59, 130, 246, 0.5)',
                    rotate: 360,
                    transition: { duration: 0.5 },
                  }}
                >
                  MA
                </motion.div>
                <motion.span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-950"
                  animate={{
                    scale: [1, 1.4, 1],
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </div>
              <div className="min-w-0 flex-1 min-[480px]:flex-none">
                <motion.span
                  className="font-extrabold text-[11px] sm:text-sm bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-500 dark:from-blue-400 dark:via-indigo-300 dark:to-purple-400 bg-clip-text text-transparent group-hover:brightness-110 transition-all block truncate"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 160, damping: 14 }}
                >
                  Muhammad Ahmad
                </motion.span>
                <motion.span
                  className="block text-[8px] min-[400px]:text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-tight truncate"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 140, damping: 14 }}
                >
                  Full Stack & AI Engineer
                </motion.span>
              </div>
            </motion.button>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-2 bg-gray-100/15 dark:bg-gray-900/15 rounded-full p-1.5" style={{ perspective: 600 }}>
              <AnimatePresence>
                {!isOpen && (
                  <motion.div
                    className="flex gap-1 xl:gap-1.5"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }}
                  >
                    {NAV_ITEMS.map((item, index) => {
                      const isActive = activeSection === item.id;
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          custom={index}
                          variants={desktopItemVariants}
                          initial="hidden"
                          animate="visible"
                          onClick={() => scrollToSection(item.id)}
                          onMouseEnter={playHover}
                          whileHover={{
                            scale: 1.15,
                            y: -4,
                            backgroundColor: 'rgba(96, 165, 250, 0.25)',
                            boxShadow: '0 4px 12px rgba(96, 165, 250, 0.35)',
                            rotateY: index % 2 === 0 ? 10 : -10,
                            transition: { type: 'spring', stiffness: 400, damping: 15 },
                          }}
                          whileTap={{ scale: 0.85, rotateY: 0 }}
                          className={`relative flex items-center gap-1 xl:gap-1.5 px-2.5 xl:px-3 py-1.5 text-[11px] xl:text-xs font-semibold rounded-full transition-all duration-400 whitespace-nowrap focus:outline-none ${isActive
                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                            : 'text-gray-600 dark:text-gray-300 hover:text-blue-400'
                            }`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          <Icon
                            className="w-3.5 h-3.5 opacity-80 shrink-0 group-hover:animate-pulse"
                            style={{ willChange: 'transform' }}
                          />
                          <span>{item.label}</span>

                          {/* Animated active pill (layoutId for smooth sliding) */}
                          {isActive && (
                            <motion.div
                              layoutId="activeNavTab"
                              className="absolute inset-0 bg-blue-400/25 dark:bg-blue-400/15 rounded-full border border-blue-400/35 shadow-[0_0_12px_rgba(59,130,246,0.2)] -z-10"
                              transition={{ type: 'spring', bounce: 0.18, duration: 0.45 }}
                            />
                          )}

                          {/* Animated underline indicator */}
                          <motion.span
                            className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                            initial={{ scaleX: 0, originX: 0 }}
                            animate={isActive ? { scaleX: 1 } : { scaleX: 0 }}
                            transition={{ duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }}
                          />
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Right Action Icons & Mobile Hamburger */}
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              {/* Command Palette Trigger Button (Ctrl + K) */}
              <motion.button
                onClick={handleCommandPaletteClick}
                onMouseEnter={playHover}
                title="Command Palette (Ctrl + K)"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100/90 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 border border-gray-200 dark:border-gray-700/80 text-xs font-medium transition-colors"
                whileHover={{
                  scale: 1.05,
                  boxShadow: '0 0 10px rgba(59,130,246,0.15)',
                  transition: { type: 'spring', stiffness: 400, damping: 15 },
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Command className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="font-mono text-[10px] bg-white dark:bg-gray-900 px-1 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                  ⌘K
                </span>
              </motion.button>

              {/* Audio Toggle */}
              <motion.button
                onClick={handleSoundToggle}
                onMouseEnter={playHover}
                title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
                className={`p-1.5 sm:p-2 rounded-xl border transition-colors duration-200 ${isMuted
                  ? 'bg-gray-100/70 dark:bg-gray-800/60 border-transparent text-gray-400'
                  : 'bg-blue-500/10 dark:bg-blue-400/10 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm shadow-blue-500/10'
                  }`}
                whileHover={{
                  scale: 1.1,
                  rotate: isMuted ? 0 : 8,
                  transition: { type: 'spring', stiffness: 400, damping: 12 },
                }}
                whileTap={{ scale: 0.9 }}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 animate-pulse" />}
              </motion.button>

              {/* Dark / Light Toggle */}
              <ThemeToggle />

              {/* Mobile Menu Hamburger */}
              <motion.button
                onClick={handleMenuToggle}
                variants={toggleVariants}
                whileHover="hover"
                whileTap="tap"
                className="lg:hidden p-2 rounded-full bg-gradient-to-r from-blue-500/25 to-purple-500/25 text-gray-900 dark:text-white relative overflow-hidden border border-blue-500/20"
                aria-label={isOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={isOpen}
              >
                {/* Shimmer sweep behind the icon */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
                  transition={{ duration: 0.5, ease: [0.68, -0.55, 0.265, 1.55] }}
                  className="relative w-6 h-6"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                      <motion.div
                        key="close"
                        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <X className="w-5 h-5 text-purple-400" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
                        animate={{ opacity: 1, rotate: 0, scale: 1 }}
                        exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Menu className="w-5 h-5 text-blue-400" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.button>
            </div>
          </motion.nav>
        </motion.div>
      </motion.header>

      {/* Mobile Drawer Menu & Backdrop Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur Overlay — z-[46] so it sits above header z-[45] */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[46] bg-black/60 backdrop-blur-md lg:hidden"
              aria-hidden="true"
            />

            {/* Mobile Drawer Content — z-[47] above backdrop */}
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed z-[47] lg:hidden bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-2xl rounded-2xl border border-blue-500/25 shadow-xl shadow-blue-500/20 overflow-hidden"
              style={{
                top: '60px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '95vw',
                maxWidth: '360px',
                maxHeight: 'calc(100dvh - 76px)',
                WebkitOverflowScrolling: 'touch',
                transformOrigin: 'top center',
                perspective: 1000,
                willChange: 'transform, opacity',
              }}
              role="dialog"
              aria-label="Navigation Menu"
            >
              <div className="flex flex-col items-start py-4 px-5 space-y-2.5 overflow-y-auto overscroll-contain touch-pan-y">
                {/* Drawer Header Badge */}
                <motion.div
                  className="flex items-center justify-between w-full pb-2 border-b border-gray-100 dark:border-gray-800/80"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, type: 'spring', stiffness: 200, damping: 18 }}
                >
                  <div className="flex items-center space-x-2">
                    <motion.div
                      className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.1 }}
                    >
                      MA
                    </motion.div>
                    <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                      Navigation Menu
                    </span>
                  </div>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                    aria-label="Close navigation menu"
                    whileHover={{ scale: 1.15, rotate: 90 }}
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 12 }}
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </motion.div>

                {/* Staggered Navigation Items */}
                {NAV_ITEMS.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      custom={index}
                      variants={drawerItemVariants}
                      initial="hidden"
                      animate="visible"
                      whileHover={{
                        scale: 1.05,
                        x: 10,
                        rotateY: index % 2 === 0 ? 15 : -15,
                        backgroundColor: 'rgba(96, 165, 250, 0.2)',
                        boxShadow: '0 5px 15px rgba(96, 165, 250, 0.3)',
                        zIndex: 10,
                      }}
                      whileTap={{ scale: 0.95, rotateY: 0, zIndex: 10 }}
                      onClick={() => scrollToSection(item.id)}
                      className={`flex items-center gap-3 w-full text-left py-3 px-4 text-sm font-medium rounded-lg transition-colors duration-400 relative ${isActive
                        ? 'text-blue-400 bg-blue-400/20 border border-blue-400/35'
                        : 'text-gray-900 dark:text-white hover:text-blue-400'
                        }`}
                      style={{
                        transformStyle: 'preserve-3d',
                        boxShadow: isActive ? '0 5px 15px rgba(0, 0, 0, 0.1)' : 'none',
                        willChange: 'transform, background-color',
                      }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {/* Active left accent bar */}
                      <motion.div
                        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-full"
                        initial={{ scaleY: 0 }}
                        animate={isActive ? { scaleY: 1 } : { scaleY: 0 }}
                        transition={{ duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }}
                      />
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                      <span>{item.label}</span>
                      {isActive && (
                        <>
                          <motion.div
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                          >
                            <ChevronRight className="w-3.5 h-3.5 ml-auto text-blue-400/80 shrink-0" />
                          </motion.div>
                          <motion.div
                            className="w-2 h-2 bg-blue-400 rounded-full"
                            animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: [0.68, -0.55, 0.265, 1.55] }}
                          />
                        </>
                      )}
                    </motion.button>
                  );
                })}

                {/* Action Buttons in Mobile Drawer */}
                <motion.div
                  className="pt-2 border-t border-gray-100 dark:border-gray-800 grid grid-cols-3 gap-1.5 sm:gap-2 text-xs w-full"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 180, damping: 16 }}
                >
                  <motion.button
                    onClick={() => {
                      setIsOpen(false);
                      playClick();
                      window.dispatchEvent(new CustomEvent('open-chatbot'));
                    }}
                    className="py-2 px-1.5 rounded-xl bg-gradient-to-tr from-blue-600/15 to-indigo-600/15 border border-blue-500/30 text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center gap-1 text-[11px] touch-manipulation transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <Bot className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">AI Bot</span>
                  </motion.button>

                  <motion.button
                    onClick={() => {
                      setIsOpen(false);
                      if (onOpenTerminal) {
                        onOpenTerminal();
                      } else {
                        window.dispatchEvent(new CustomEvent('open-cyber-terminal'));
                      }
                    }}
                    className="py-2 px-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-semibold flex items-center justify-center gap-1 text-[11px] touch-manipulation transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <Terminal className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Terminal</span>
                  </motion.button>

                  <motion.button
                    onClick={() => {
                      setIsOpen(false);
                      if (onOpenCommandPalette) onOpenCommandPalette();
                    }}
                    className="py-2 px-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center gap-1 text-[11px] touch-manipulation transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.93 }}
                  >
                    <Command className="w-3.5 h-3.5 shrink-0" />
                    <span>⌘K</span>
                  </motion.button>
                </motion.div>

                {/* Direct Quick Contact CTA in Drawer */}
                <motion.button
                  onClick={() => scrollToSection('contact')}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 touch-manipulation transition-colors relative overflow-hidden"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
                  whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  {/* Shimmer effect on CTA */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    animate={{ x: ['-200%', '200%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                  />
                  <Send className="w-3.5 h-3.5 shrink-0 relative z-10" />
                  <span className="relative z-10">Get In Touch</span>
                </motion.button>
              </div>

              {/* Animated bouncing chevron at drawer bottom */}
              <motion.div
                className="absolute bottom-3 left-1/2 -translate-x-1/2"
                animate={{ y: [0, 6, 0], opacity: [1, 0.6, 1], scale: [1, 1.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: [0.68, -0.55, 0.265, 1.55] }}
              >
                <ChevronDown size={16} className="text-blue-400 animate-pulse" />
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Responsive Navigation Styles ──────────────────────────── */}
      <style>{`
        nav {
          font-family: 'Inter', 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
        }
        .group:hover .animate-pulse {
          animation: navPulse 1.5s ease-in-out infinite;
        }
        @keyframes navPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
        }
        @media (max-width: 1280px) {
          .fixed.top-3 {
            top: 0.75rem;
            right: 0.75rem;
            left: 0.75rem;
          }
        }
        @media (max-width: 768px) {
          .fixed.top-3 {
            top: 0.5rem;
            right: 0.5rem;
            left: 0.5rem;
          }
        }
        @media (max-width: 480px) {
          .fixed.top-3 {
            top: 0.5rem;
            right: 0.5rem;
            left: 0.5rem;
          }
        }
      `}</style>
    </>
  );
};

export default Navigation;