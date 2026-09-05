import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useScroll, useTransform, useSpring, type Variants } from 'framer-motion';
import {
  Menu,
  X,
  ChevronDown,
  User,
  Home,
  Briefcase,
  Code,
  Folder,
  Award,
  MessageSquare,
  Sparkles,
  Users,
  Command,
  Terminal,
  Volume2,
  VolumeX,
  Bot,
  Send,
} from 'lucide-react';
import logoimage from '../assets/image .png';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '../context/ThemeContext';
import { useSound } from '../context/SoundContext';
import { useActiveSection } from '../hooks/useActiveSection';
import { scrollToSection as scrollToSectionLib } from '../lib/scrollTo';

interface NavigationProps {
  onOpenCommandPalette?: () => void;
  onOpenTerminal?: () => void;
}

/**
 * Navigation bar items mapping to sections on the page.
 * Stable constant declared outside component to prevent re-render re-registrations.
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

/** Section ids for the high-performance scroll spy */
const NAV_SECTION_IDS = NAV_ITEMS.map((item) => item.id);

/** Navbar clearance offset in pixels */
const NAV_OFFSET = 88;

// ─── Animation Variants ───────────────────────────────────────────────────────

/** Whole navbar entrance: spring scale and rotate */
const navVariants: Variants = {
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

/** Staggered nav item entrance with 3D rotation */
const itemVariants: Variants = {
  hidden: { opacity: 0, x: 50, rotateY: 45 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    rotateY: 0,
    transition: {
      delay: i * 0.07,
      duration: 0.5,
      ease: [0.68, -0.55, 0.265, 1.55],
      type: 'spring',
      stiffness: 140,
      damping: 12,
    },
  }),
};

/** Mobile card banner swiper: morphing from circle to rounded rectangle */
const bannerVariants: Variants = {
  hidden: { scale: 0, opacity: 0, borderRadius: '50%' },
  visible: {
    scale: 1,
    opacity: 1,
    borderRadius: '16px',
    transition: {
      duration: 0.5,
      ease: [0.68, -0.55, 0.265, 1.55],
      type: 'spring',
      stiffness: 160,
      damping: 12,
      staggerChildren: 0.06,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    borderRadius: '50%',
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

/** Menu toggle button: hover bounce & tap full spin */
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

/** Backdrop overlay fade */
const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] } },
  exit: { opacity: 0, transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } },
};

// ─── Component ────────────────────────────────────────────────────────────────

const Navigation: React.FC<NavigationProps> = ({ onOpenCommandPalette, onOpenTerminal }) => {
  const { theme } = useTheme();
  const { isMuted, toggleMute, playClick, playHover, playWhoosh, vibrate } = useSound();

  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const activeSection = useActiveSection(NAV_SECTION_IDS, NAV_OFFSET);

  const navRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Scroll-based animations & progress bar
  const { scrollY, scrollYProgress } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 200], [1, 0.97]);
  const navScale = useTransform(scrollY, [0, 200], [1, 0.98]);
  const navBlur = useTransform(scrollY, [0, 200], ['blur(0px)', 'blur(3px)']);

  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 30,
    restDelta: 0.001,
  });

  // Reset mobile menu on screen resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(false);
      }
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clean body scroll lock without layout jump or page reset
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
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

  // Simplified touch swipe handling on the navbar
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.touches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    if (Math.abs(diff) > 50 && !isOpen) {
      setIsOpen(true);
      touchStartX.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  // Smooth scroll with audio feedback & offset
  const scrollToSection = useCallback(
    (sectionId: string) => {
      vibrate(8);
      playWhoosh();
      setIsOpen(false);

      requestAnimationFrame(() => {
        scrollToSectionLib(sectionId, { updateHash: true });
      });
    },
    [playWhoosh, vibrate]
  );

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

      {/* Main Dynamic Floating Navbar with spring entrance & scroll transforms */}
      <motion.nav
        ref={navRef}
        variants={navVariants}
        initial="hidden"
        animate="visible"
        style={{
          opacity: navOpacity,
          scale: navScale,
          backdropFilter: navBlur,
          WebkitBackdropFilter: navBlur,
          willChange: 'opacity, transform',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-3 right-3 left-3 z-50 transition-all duration-500 mx-auto max-w-[1440px] ${isOpen
            ? 'bg-gray-50/95 dark:bg-gray-950/95 shadow-xl shadow-blue-500/20'
            : 'bg-gray-50/90 dark:bg-gray-950/90 shadow-lg shadow-blue-500/15'
          } rounded-2xl border border-blue-500/25 overflow-visible`}
      >
        <div className="flex items-center justify-between p-2 max-w-7xl mx-auto">
          {/* Logo / Brand with 360° spin avatar hover & pulsating gradient text */}
          <motion.div
            className="flex items-center gap-2.5 cursor-pointer select-none text-left focus:outline-none min-w-0"
            onClick={() => scrollToSection('home')}
            onMouseEnter={playHover}
            whileHover={{ scale: 1.08, y: -2 }}
            whileTap={{ scale: 0.92 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="relative shrink-0">
              <motion.img
                src={logoimage}
                alt="Muhammad Ahmad Profile"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/profile.png';
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full border-2 border-blue-500/50 object-cover shrink-0"
                initial={{ opacity: 0, scale: 0.6, rotate: -90 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 140 }}
                whileHover={{
                  borderColor: 'rgba(59, 130, 246, 0.8)',
                  boxShadow: '0 0 12px rgba(59, 130, 246, 0.4)',
                  rotate: 360,
                  transition: { duration: 0.5 },
                }}
              />
              <motion.span
                className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-gray-950"
                animate={{
                  scale: [1, 1.35, 1],
                  opacity: [1, 0.6, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </div>

            <div className="min-w-0">
              <motion.div
                className="font-bold text-sm sm:text-lg xl:text-xl bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent tracking-tight truncate"
                animate={{ x: [0, 3, 0], opacity: [1, 0.8, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                Muhammad Ahmad
              </motion.div>
              <motion.span
                className="block text-[8px] min-[400px]:text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 font-medium tracking-tight truncate -mt-0.5"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 140, damping: 14 }}
              >
                Full Stack & AI Engineer
              </motion.span>
            </div>
          </motion.div>

          {/* Desktop Navigation Links */}
          <div
            className="hidden lg:flex items-center gap-1 xl:gap-1.5 bg-gray-100/15 dark:bg-gray-900/15 rounded-full p-1.5"
            style={{ perspective: 600 }}
          >
            <div className="flex items-center gap-1 xl:gap-1.5">
              {NAV_ITEMS.map((item, index) => {
                const isActive = activeSection === item.id;
                const Icon = item.icon;
                return (
                  <motion.button
                    key={item.id}
                    custom={index}
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{
                      scale: 1.15,
                      y: -4,
                      backgroundColor: 'rgba(96, 165, 250, 0.25)',
                      boxShadow: '0 4px 12px rgba(96, 165, 250, 0.35)',
                      rotateY: index % 2 === 0 ? 10 : -10,
                    }}
                    whileTap={{ scale: 0.85, rotateY: 0 }}
                    onClick={() => scrollToSection(item.id)}
                    onMouseEnter={playHover}
                    className={`relative flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm font-medium rounded-full transition-all duration-400 whitespace-nowrap focus:outline-none ${isActive
                        ? 'text-blue-400 bg-blue-400/25 border border-blue-400/35'
                        : 'text-gray-900 dark:text-white hover:text-blue-400'
                      }`}
                    style={{ transformStyle: 'preserve-3d' }}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <Icon
                      size={16}
                      className="group-hover:animate-pulse shrink-0"
                      style={{ willChange: 'transform' }}
                    />
                    <span className="hidden xl:inline">{item.label}</span>

                    {/* Animated gradient underline indicator */}
                    <motion.span
                      className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                      initial={{ scaleX: 0, originX: 0 }}
                      animate={isActive ? { scaleX: 1 } : { scaleX: 0 }}
                      transition={{ duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }}
                    />
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Right Action Tools & Mobile Menu Toggle */}
          <div className="flex items-center space-x-1 sm:space-x-1.5">
            {/* Command Palette Trigger (⌘K) */}
            <motion.button
              onClick={() => {
                vibrate(10);
                playClick();
                if (onOpenCommandPalette) onOpenCommandPalette();
              }}
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
              onClick={() => {
                vibrate(10);
                playClick();
                toggleMute();
              }}
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

            {/* Theme Toggle (Dark / Light) */}
            <ThemeToggle />

            {/* Mobile Menu Toggle Button */}
            <motion.button
              onClick={() => {
                vibrate(10);
                playClick();
                setIsOpen(!isOpen);
              }}
              variants={toggleVariants}
              whileHover="hover"
              whileTap="tap"
              className="lg:hidden p-2 rounded-full bg-gradient-to-r from-blue-500/25 to-purple-500/25 text-gray-900 dark:text-white relative overflow-hidden border border-blue-500/20"
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400/30 to-purple-400/30"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <motion.div
                animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
                transition={{ duration: 0.5, ease: [0.68, -0.55, 0.265, 1.55] }}
                className="relative w-6 h-6"
              >
                <Menu
                  size={22}
                  className={`absolute inset-0 m-auto transition-all duration-500 ${isOpen ? 'opacity-0 scale-0' : 'opacity-100 scale-100'
                    } text-blue-400`}
                />
                <X
                  size={22}
                  className={`absolute inset-0 m-auto transition-all duration-500 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    } text-purple-400`}
                />
              </motion.div>
            </motion.button>
          </div>
        </div>

        <style>{`
          nav {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            -webkit-tap-highlight-color: transparent;
            touch-action: manipulation;
          }
          .group:hover .animate-pulse {
            animation: pulse 1.5s ease-in-out infinite;
          }
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.7; }
          }
          @media (max-width: 1280px) {
            nav {
              top: 0.75rem;
              right: 0.75rem;
              left: 0.75rem;
            }
            .rounded-2xl {
              border-radius: 1rem;
            }
          }
          @media (max-width: 768px) {
            nav {
              top: 0.5rem;
              right: 0.5rem;
              left: 0.5rem;
            }
            .rounded-2xl {
              border-radius: 0.75rem;
            }
          }
          @media (max-width: 480px) {
            nav {
              top: 0.5rem;
              right: 0.5rem;
              left: 0.5rem;
            }
            .rounded-2xl {
              border-radius: 0.625rem;
            }
          }
          @media (max-width: 360px) {
            nav {
              top: 0.5rem;
              right: 0.5rem;
              left: 0.5rem;
            }
            .rounded-2xl {
              border-radius: 0.5rem;
            }
          }
        `}</style>
      </motion.nav>

      {/* ─── Mobile/Tablet Navigation Drawer via React Portal ───────────────────
          Mounting to document.body prevents CSS transform clipping/stacking issues
          from the fixed/scaled motion.nav parent container. ────────────────── */}
      {mounted && typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Fullscreen Backdrop Blur Overlay */}
              <motion.div
                key="nav-backdrop"
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[998] lg:hidden"
                variants={backdropVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={() => setIsOpen(false)}
                aria-hidden="true"
              />

              {/* Centered Drawer Container */}
              <div
                key="nav-drawer-wrapper"
                className="fixed top-[66px] sm:top-[74px] left-0 right-0 z-[999] flex justify-center pointer-events-none lg:hidden px-3"
              >
                <motion.div
                  variants={bannerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ transformOrigin: 'top center', perspective: 1000, willChange: 'transform, opacity' }}
                  className="pointer-events-auto bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-2xl rounded-2xl border border-blue-500/25 shadow-2xl shadow-blue-500/20 w-full max-w-[370px] overflow-hidden flex flex-col max-h-[calc(100dvh-84px)]"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Mobile Navigation Menu"
                >
                  {/* Header row */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200/60 dark:border-gray-800/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={logoimage}
                        alt="Muhammad Ahmad"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/profile.png';
                        }}
                        className="w-7 h-7 rounded-full border border-blue-500/50 object-cover shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                          Muhammad Ahmad
                        </span>
                        <span className="text-[10px] text-blue-500 dark:text-blue-400 block font-medium -mt-0.5">
                          Navigation Menu
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {/* Theme Toggle inside drawer */}
                      <ThemeToggle size="sm" />

                      {/* Audio Mute button inside drawer header */}
                      <motion.button
                        onClick={() => {
                          vibrate(10);
                          playClick();
                          toggleMute();
                        }}
                        title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
                        className={`p-1.5 rounded-lg border transition-colors ${isMuted
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-transparent'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                          }`}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </motion.button>

                      {/* Close Button */}
                      <motion.button
                        onClick={() => setIsOpen(false)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                        aria-label="Close navigation menu"
                        whileHover={{ scale: 1.15, rotate: 90 }}
                        whileTap={{ scale: 0.85 }}
                      >
                        <X className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  {/* Scrollable Nav Items list */}
                  <div className="flex-1 overflow-y-auto overscroll-contain py-2 px-3 space-y-1.5 scrollbar-thin scrollbar-thumb-blue-500/20">
                    {NAV_ITEMS.map((item, index) => {
                      const isActive = activeSection === item.id;
                      const Icon = item.icon;
                      return (
                        <motion.button
                          key={item.id}
                          custom={index}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          whileHover={{
                            scale: 1.03,
                            x: 8,
                            rotateY: index % 2 === 0 ? 12 : -12,
                            backgroundColor: 'rgba(96, 165, 250, 0.2)',
                            boxShadow: '0 5px 15px rgba(96, 165, 250, 0.25)',
                            zIndex: 10,
                          }}
                          whileTap={{ scale: 0.95, rotateY: 0, zIndex: 10 }}
                          onClick={() => scrollToSection(item.id)}
                          onMouseEnter={playHover}
                          className={`flex items-center gap-3 w-full text-left py-2.5 px-3.5 text-sm font-medium rounded-xl transition-all duration-300 relative ${isActive
                              ? 'text-blue-500 dark:text-blue-400 bg-blue-500/15 dark:bg-blue-400/15 border border-blue-500/35 font-semibold'
                              : 'text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100/50 dark:hover:bg-gray-800/40'
                            }`}
                          style={{
                            transformStyle: 'preserve-3d',
                            boxShadow: isActive ? '0 4px 12px rgba(59, 130, 246, 0.15)' : 'none',
                            willChange: 'transform, background-color',
                          }}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {/* Active vertical accent bar */}
                          <motion.div
                            className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-blue-400 to-purple-500 rounded-r-full"
                            initial={{ scaleY: 0 }}
                            animate={isActive ? { scaleY: 1 } : { scaleY: 0 }}
                            transition={{ duration: 0.4, ease: [0.68, -0.55, 0.265, 1.55] }}
                          />
                          <Icon size={18} className="shrink-0 group-hover:animate-pulse" />
                          <span className="flex-1">{item.label}</span>

                          {/* Active pulsating blue dot */}
                          {isActive && (
                            <motion.div
                              className="w-2 h-2 bg-blue-400 rounded-full shrink-0"
                              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: [0.68, -0.55, 0.265, 1.55] }}
                            />
                          )}
                        </motion.button>
                      );
                    })}

                    {/* Mobile Drawer Action Shortcuts */}
                    <div className="pt-2 pb-1 border-t border-gray-200/60 dark:border-gray-800/80 grid grid-cols-3 gap-1.5 text-xs w-full">
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
                          vibrate(12);
                          playClick();
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
                          vibrate(10);
                          playClick();
                          if (onOpenCommandPalette) onOpenCommandPalette();
                        }}
                        className="py-2 px-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-semibold flex items-center justify-center gap-1 text-[11px] touch-manipulation transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.93 }}
                      >
                        <Command className="w-3.5 h-3.5 shrink-0" />
                        <span>⌘K</span>
                      </motion.button>
                    </div>

                    {/* Direct CTA */}
                    <motion.button
                      onClick={() => scrollToSection('contact')}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 touch-manipulation transition-colors relative overflow-hidden"
                      whileHover={{ scale: 1.02, boxShadow: '0 8px 24px rgba(59,130,246,0.35)' }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                        animate={{ x: ['-200%', '200%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                      />
                      <Send className="w-3.5 h-3.5 shrink-0 relative z-10" />
                      <span className="relative z-10">Get In Touch</span>
                    </motion.button>
                  </div>

                  {/* Bouncing ChevronDown indicator at bottom (from original animation) */}
                  <div className="py-1.5 flex items-center justify-center bg-gray-100/40 dark:bg-gray-900/40 border-t border-gray-200/40 dark:border-gray-800/40 shrink-0">
                    <motion.div
                      animate={{ y: [0, 6, 0], opacity: [1, 0.6, 1], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: [0.68, -0.55, 0.265, 1.55] }}
                    >
                      <ChevronDown size={16} className="text-blue-400 animate-pulse" />
                    </motion.div>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};

export default Navigation;