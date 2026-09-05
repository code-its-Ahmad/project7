import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { Download, ChevronDown, Code, Cpu, Database, Cloud, Send, Sparkles } from 'lucide-react';
import CodingScene from './3D/CodingScene';
import { useTheme } from '../context/ThemeContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { useDeviceCapabilities } from '../context/DeviceCapabilitiesContext';
import { analyticsAPI } from '../api/services';
import { scrollToSection } from '../lib/scrollTo';
import { EASE_OUT } from '../lib/motion';

const Hero = () => {
  const { theme } = useTheme();
  const { profile } = usePortfolio();
  const { playClick, playHover } = useSound();
  const { reducedMotion } = useDeviceCapabilities();
  const [currentRole, setCurrentRole] = useState(0);
  const [typedName, setTypedName] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const heroRef = useRef<HTMLElement | null>(null);

  const heroName = profile?.name || 'Muhammad Ahmad';
  const roles = profile?.titles?.length
    ? profile.titles
    : [
        'Full Stack Developer',
        'AI/ML Engineer',
        'Cloud & DevOps Architect',
        'UI/UX Specialist',
        'Blockchain Developer',
      ];

  // Typing animation for hero name
  useEffect(() => {
    setIsLoaded(true);
    let i = 0;
    setTypedName('');
    const typeInterval = setInterval(() => {
      if (i < heroName.length) {
        setTypedName(heroName.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 80);

    return () => clearInterval(typeInterval);
  }, [heroName]);

  // Role switching animation cycle
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [roles.length]);

  // Scroll-based parallax physics (starts at 100% opacity at top, smoothly fades & glides as user scrolls)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const rawOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.85, 0]);
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const rawScale = useTransform(scrollYProgress, [0, 0.8, 1], [1, 0.98, 0.93]);
  const rawGlowY1 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const rawGlowY2 = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const smoothOpacity = useSpring(rawOpacity, { stiffness: 120, damping: 24 });
  const smoothY = useSpring(rawY, { stiffness: 120, damping: 24 });
  const smoothScale = useSpring(rawScale, { stiffness: 120, damping: 24 });

  const downloadCV = () => {
    playClick();
    analyticsAPI.track('cv_download', { source: 'hero_button' });
    const cvUrl =
      profile?.resume_url ||
      'https://drive.google.com/file/d/1LEb7Scv_BQzuClhKMqYnNDqrOdwfnJI0/view?usp=sharing';
    window.open(cvUrl, '_blank', 'noopener,noreferrer');
  };

  const handleScrollTo = (sectionId: string) => {
    playClick();
    scrollToSection(sectionId);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: EASE_OUT, staggerChildren: 0.12 },
    },
  };

  const roleContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.035,
        delayChildren: 0.05,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2, ease: EASE_OUT },
    },
  };

  const roleCharVariants = {
    hidden: { opacity: 0, y: 10, filter: 'blur(4px)' },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
      transition: { duration: 0.25, ease: EASE_OUT },
    },
  };

  const buttonVariants = {
    hover: { scale: 1.04, y: -2, transition: { duration: 0.25, ease: EASE_OUT } },
    tap: { scale: 0.96 },
  };

  return (
    <section
      ref={heroRef}
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-16 sm:pb-20"
    >
      {/* 3D Background Scene */}
      <div className="absolute inset-0 pointer-events-none">
        <CodingScene theme={theme} />
      </div>

      {/* Layered Gradient Overlays */}
      <div
        className={`absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black/90 z-10 pointer-events-none transition-opacity duration-300 ${
          theme === 'dark' ? 'opacity-90' : 'opacity-65'
        }`}
      />
      <div
        className={`absolute inset-0 bg-gradient-to-r from-blue-900/20 via-transparent to-purple-900/20 z-10 pointer-events-none transition-opacity duration-300 ${
          theme === 'dark' ? 'opacity-100' : 'opacity-70'
        }`}
      />

      {/* Floating Animated Ambient Glows with Scroll Parallax */}
      <motion.div
        style={reducedMotion ? undefined : { y: rawGlowY1 }}
        className="absolute top-16 sm:top-24 left-6 sm:left-12 w-28 sm:w-56 h-28 sm:h-56 bg-blue-600/25 rounded-full blur-3xl pointer-events-none"
        animate={
          reducedMotion
            ? undefined
            : {
                scale: [1, 1.2, 1],
                opacity: [0.2, 0.35, 0.2],
                x: [-10, 10, -10],
              }
        }
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        style={reducedMotion ? undefined : { y: rawGlowY2 }}
        className="absolute bottom-16 sm:bottom-24 right-6 sm:right-12 w-32 sm:w-64 h-32 sm:h-64 bg-purple-600/25 rounded-full blur-3xl pointer-events-none"
        animate={
          reducedMotion
            ? undefined
            : {
                scale: [1, 1.25, 1],
                opacity: [0.2, 0.38, 0.2],
                x: [10, -10, 10],
              }
        }
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-1/3 right-8 sm:right-20 w-10 sm:w-16 h-10 sm:h-16 bg-cyan-500/20 rounded-xl rotate-45 blur-lg pointer-events-none"
        animate={
          reducedMotion
            ? undefined
            : {
                y: [-12, 12, -12],
                rotate: [45, 60, 45],
              }
        }
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-1/3 left-8 sm:left-20 w-8 sm:w-14 h-8 sm:h-14 bg-emerald-500/20 rounded-full blur-md pointer-events-none"
        animate={
          reducedMotion
            ? undefined
            : {
                scale: [1, 1.2, 1],
                y: [8, -8, 8],
              }
        }
        transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />

      {/* Main Content */}
      <motion.div
        style={reducedMotion ? undefined : { opacity: smoothOpacity, y: smoothY, scale: smoothScale }}
        className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate={isLoaded ? 'visible' : 'hidden'}
      >
        {/* Availability Badge */}
        {profile?.available_for_hire !== false && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="group relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md text-emerald-400 text-xs sm:text-sm font-semibold shadow-lg shadow-emerald-500/10 overflow-hidden cursor-default"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="truncate">Available for Worldwide Remote & Freelance Roles</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          </motion.div>
        )}

        {/* Hero Title & Staggered Role Typography */}
        <div className="space-y-3 sm:space-y-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-2xl min-h-[50px] sm:min-h-[70px] md:min-h-[90px] flex items-center justify-center"
          >
            <span>{typedName}</span>
            <span className="inline-block w-1 sm:w-1.5 h-7 sm:h-12 bg-blue-400 ml-2 animate-pulse rounded-full" />
          </motion.h1>

          <div className="h-10 sm:h-12 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentRole}
                variants={roleContainerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="inline-flex flex-wrap justify-center items-center text-lg sm:text-2xl md:text-3xl font-bold text-gray-200 dark:text-white"
              >
                {roles[currentRole].split('').map((char, index) => (
                  <motion.span
                    key={`${currentRole}-${index}`}
                    variants={roleCharVariants}
                    className="inline-block hover:text-blue-400 transition-colors duration-200"
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Subtitle / Tagline */}
        <motion.p
          className="text-xs sm:text-sm md:text-base text-gray-200 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
        >
          {profile?.tagline ||
            'Crafting high-performance digital ecosystems with cutting-edge technology, creative problem-solving, and a passion for transforming ideas into reality.'}
        </motion.p>

        {/* Skill Icons with Micro-Interactions */}
        <motion.div
          className="flex flex-wrap justify-center gap-2.5 sm:gap-4 py-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
        >
          {[
            {
              icon: Code,
              label: 'Frontend',
              bgClass: 'bg-blue-500/15 border-blue-500/30 text-blue-400 group-hover:bg-blue-500/30',
              hoverText: 'group-hover:text-blue-300',
            },
            {
              icon: Database,
              label: 'Backend',
              bgClass: 'bg-purple-500/15 border-purple-500/30 text-purple-400 group-hover:bg-purple-500/30',
              hoverText: 'group-hover:text-purple-300',
            },
            {
              icon: Cpu,
              label: 'AI/ML',
              bgClass: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400 group-hover:bg-cyan-500/30',
              hoverText: 'group-hover:text-cyan-300',
            },
            {
              icon: Cloud,
              label: 'DevOps & Cloud',
              bgClass: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/30',
              hoverText: 'group-hover:text-emerald-300',
            },
          ].map((skill, index) => {
            const Icon = skill.icon;
            return (
              <motion.div
                key={index}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-white/10 dark:bg-gray-900/60 backdrop-blur-md border border-white/10 dark:border-gray-800 text-xs sm:text-sm font-semibold text-gray-200 shadow-sm transition-all hover:border-blue-500/40 hover:shadow-blue-500/10 cursor-pointer group"
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onMouseEnter={playHover}
              >
                <div className={`p-1 rounded-lg border transition-all duration-300 ${skill.bgClass}`}>
                  <Icon className="w-3.5 sm:w-4 h-3.5 sm:h-4 group-hover:animate-pulse" />
                </div>
                <span className={`text-gray-300 transition-colors ${skill.hoverText}`}>
                  {skill.label}
                </span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Buttons with Sheen & Physics */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center pt-2 max-w-lg sm:max-w-none mx-auto w-full"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: EASE_OUT }}
        >
          <motion.button
            onClick={downloadCV}
            onMouseEnter={playHover}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="group relative overflow-hidden w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-semibold text-sm sm:text-base shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2.5 transition-all"
            aria-label="Download CV"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <Download className="w-4 sm:w-5 h-4 sm:h-5 group-hover:animate-bounce relative z-10" />
            <span className="relative z-10">Download CV</span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/15 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          </motion.button>

          <motion.button
            onClick={() => handleScrollTo('projects')}
            onMouseEnter={playHover}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="group relative overflow-hidden w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold text-sm sm:text-base shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 flex items-center justify-center gap-2.5 transition-all"
            aria-label="Explore My Work"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            <span className="relative z-10">Explore My Work</span>
            <ChevronDown className="w-4 sm:w-5 h-4 sm:h-5 group-hover:animate-bounce relative z-10" />
            <div className="absolute top-0 left-0 w-full h-full bg-white/15 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          </motion.button>

          <motion.button
            onClick={() => handleScrollTo('contact')}
            onMouseEnter={playHover}
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            className="group relative overflow-hidden w-full sm:w-auto px-5 sm:px-7 py-3.5 sm:py-4 rounded-xl bg-white/10 hover:bg-white/20 dark:bg-gray-800/80 border border-white/15 dark:border-gray-700 text-white font-semibold text-sm sm:text-base backdrop-blur-md shadow-lg flex items-center justify-center gap-2.5 transition-all hover:border-cyan-400/40"
            aria-label="Let's Talk"
          >
            <Send className="w-4 h-4 transition-transform group-hover:translate-x-0.5 relative z-10 text-cyan-400" />
            <span className="relative z-10">Let's Talk</span>
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
          </motion.button>
        </motion.div>

        {/* Statistics Grid */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 pt-6 max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT }}
        >
          {[
            {
              value: profile?.projects_completed || '50+',
              label: 'Projects Built',
              colorClass: 'text-blue-400',
              borderHover: 'hover:border-blue-500/40 hover:bg-blue-500/5',
            },
            {
              value: profile?.years_experience || '3+',
              label: 'Years Experience',
              colorClass: 'text-purple-400',
              borderHover: 'hover:border-purple-500/40 hover:bg-purple-500/5',
            },
            {
              value: profile?.happy_clients || '100+',
              label: 'Happy Clients',
              colorClass: 'text-cyan-400',
              borderHover: 'hover:border-cyan-500/40 hover:bg-cyan-500/5',
            },
            {
              value: profile?.satisfaction_rate || '24/7',
              label: 'Support & Quality',
              colorClass: 'text-emerald-400',
              borderHover: 'hover:border-emerald-500/40 hover:bg-emerald-500/5',
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              className={`p-3.5 sm:p-4 rounded-2xl bg-white/5 dark:bg-gray-900/50 backdrop-blur-md border border-white/10 dark:border-gray-800 text-center transition-all duration-300 cursor-pointer ${stat.borderHover}`}
              whileHover={{ scale: 1.05, y: -3 }}
              transition={{ duration: 0.2 }}
              onMouseEnter={playHover}
            >
              <motion.div
                className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold ${stat.colorClass}`}
                animate={
                  reducedMotion
                    ? undefined
                    : {
                        scale: [1, 1.04, 1],
                      }
                }
                transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.2 }}
              >
                {stat.value}
              </motion.div>
              <div className="text-gray-300 dark:text-gray-400 text-xs sm:text-sm font-medium mt-1">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Scroll Down Indicator */}
        <motion.div
          className="pt-6 sm:pt-8 flex flex-col items-center cursor-pointer group"
          onClick={() => handleScrollTo('about')}
          onMouseEnter={playHover}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <div className="w-6 h-10 border-2 border-gray-400/80 dark:border-gray-300/80 rounded-full flex justify-center p-1 group-hover:border-blue-400 transition-colors">
            <motion.div
              className="w-1.5 h-2 bg-gray-400 dark:bg-gray-300 rounded-full group-hover:bg-blue-400 transition-colors"
              animate={
                reducedMotion
                  ? undefined
                  : {
                      y: [0, 14, 0],
                    }
              }
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-300 mt-1.5 group-hover:text-blue-400 group-hover:translate-y-0.5 transition-all" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;