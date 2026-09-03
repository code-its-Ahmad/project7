import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';
import { Download, ChevronDown, Code, Cpu, Database, Send, Sparkles } from 'lucide-react';
import CodingScene from './3D/CodingScene';
import { useTheme } from '../context/ThemeContext';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { useDeviceCapabilities } from '../context/DeviceCapabilitiesContext';
import { analyticsAPI } from '../api/services';
import { EASE_OUT } from '../lib/motion';

const Hero = () => {
  const { theme } = useTheme();
  const { profile } = usePortfolio();
  const { playClick, playHover } = useSound();
  const { reducedMotion } = useDeviceCapabilities();
  const [currentRole, setCurrentRole] = useState(0);
  const [typedName, setTypedName] = useState('');

  const heroRef = useRef<HTMLElement | null>(null);

  // Scroll-linked parallax and fade
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const rawOpacity = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.9, 0]);
  const rawY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const rawGlowY1 = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const rawGlowY2 = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const rawScale = useTransform(scrollYProgress, [0, 0.8, 1], [1, 0.98, 0.92]);

  const smoothOpacity = useSpring(rawOpacity, { stiffness: 120, damping: 24 });
  const smoothY = useSpring(rawY, { stiffness: 120, damping: 24 });
  const smoothScale = useSpring(rawScale, { stiffness: 120, damping: 24 });

  const heroName = profile?.name || 'Muhammad Ahmad';
  const roles = profile?.titles?.length
    ? profile.titles
    : [
      'Full Stack Developer',
      'AI/ML Engineer',
      'Mobile App Architect',
      'Cloud & DevOps Engineer',
      'UI/UX Designer',
    ];

  // Smooth typing effect for Name
  useEffect(() => {
    let i = 0;
    setTypedName('');
    const typeInterval = setInterval(() => {
      if (i < heroName.length) {
        setTypedName(heroName.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typeInterval);
      }
    }, 70);

    return () => clearInterval(typeInterval);
  }, [heroName]);

  // Role switching animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentRole((prev) => (prev + 1) % roles.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [roles.length]);

  const downloadCV = () => {
    playClick();
    analyticsAPI.track('cv_download', { source: 'hero_button' });
    const cvUrl =
      profile?.resume_url ||
      'https://drive.google.com/file/d/1LEb7Scv_BQzuClhKMqYnNDqrOdwfnJI0/view?usp=sharing';
    window.open(cvUrl, '_blank', 'noopener,noreferrer');
  };

  const scrollTo = (id: string) => {
    playClick();
    const el = document.getElementById(id);
    if (el) {
      const offset = 75;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const offsetPosition = elementRect - bodyRect - offset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  const roleVariants = {
    hidden: { opacity: 0, y: 14, scale: 0.96 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: EASE_OUT } },
    exit: { opacity: 0, y: -14, scale: 0.96, transition: { duration: 0.2 } },
  };

  return (
    <section
      ref={heroRef}
      id="home"
      className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 pb-12 sm:pb-16"
    >
      {/* 3D Background Scene */}
      <div className="absolute inset-0 pointer-events-none">
        <CodingScene theme={theme} />
      </div>

      {/* Layered Gradient Overlays with Parallax */}
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
        className="absolute top-20 left-10 w-32 sm:w-56 h-32 sm:h-56 bg-blue-500/20 rounded-full blur-3xl pointer-events-none animate-magnetic-float"
      />
      <motion.div
        style={reducedMotion ? undefined : { y: rawGlowY2 }}
        className="absolute bottom-20 right-10 w-36 sm:w-64 h-36 sm:h-64 bg-purple-500/20 rounded-full blur-3xl pointer-events-none animate-magnetic-float"
      />

      {/* Main Hero Content (scroll-animated) */}
      <motion.div
        style={reducedMotion ? undefined : { opacity: smoothOpacity, y: smoothY, scale: smoothScale }}
        className="relative z-20 text-center max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8"
      >
        {/* Availability Badge with Shimmer Sweep */}
        {profile?.available_for_hire !== false && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="group relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-md text-emerald-400 text-[11px] sm:text-xs font-semibold shadow-lg shadow-emerald-500/10 overflow-hidden cursor-default"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="truncate">Available for Worldwide Remote & Freelance Roles</span>
            <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
          </motion.div>
        )}

        {/* Hero Name & Dynamic Role Typing */}
        <div className="space-y-2 sm:space-y-3">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT }}
            className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-blue-400 via-purple-300 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg min-h-[48px] sm:min-h-[64px] md:min-h-[80px] flex items-center justify-center"
          >
            <span>{typedName}</span>
            <span className="inline-block w-1 sm:w-1.5 h-7 sm:h-12 bg-blue-400 ml-1.5 animate-pulse rounded-full" />
          </motion.h1>

          <div className="h-8 sm:h-10 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.span
                key={currentRole}
                variants={roleVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-100 via-blue-200 to-white bg-clip-text text-transparent drop-shadow"
              >
                {roles[currentRole]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* Tagline / Subtitle */}
        <motion.p
          className="text-xs sm:text-sm md:text-base text-gray-200 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
        >
          {profile?.tagline ||
            'Crafting high-performance digital ecosystems with modern web architectures, AI/ML deep learning pipelines, and world-class UI/UX design.'}
        </motion.p>

        {/* Quick Skill Pillar Badges with Micro-interactions */}
        <motion.div
          className="flex flex-wrap justify-center gap-2 sm:gap-3 py-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
        >
          {[
            { icon: Code, label: 'Full Stack Web' },
            { icon: Cpu, label: 'AI/ML & Vision' },
            { icon: Database, label: 'Cloud & DevOps' },
          ].map((skill, index) => {
            const Icon = skill.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white/10 dark:bg-gray-900/60 backdrop-blur-md border border-white/10 dark:border-gray-800 text-[11px] sm:text-xs font-semibold text-gray-200 shadow-sm transition-all hover:border-blue-500/40 hover:shadow-blue-500/10 cursor-default"
              >
                <Icon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>{skill.label}</span>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA Buttons with Shimmer & Elastic Physics */}
        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2 max-w-md sm:max-w-none mx-auto w-full"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45, ease: EASE_OUT }}
        >
          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={downloadCV}
            onMouseEnter={playHover}
            className="group relative overflow-hidden w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Download className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
            <span>Download CV / Resume</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => scrollTo('projects')}
            onMouseEnter={playHover}
            className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/20 dark:bg-gray-800/80 border border-white/15 dark:border-gray-700 text-white font-bold text-xs sm:text-sm backdrop-blur-md shadow-lg flex items-center justify-center gap-2 transition-all hover:border-blue-400/40"
          >
            <span>Explore Projects</span>
            <ChevronDown className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => scrollTo('contact')}
            onMouseEnter={playHover}
            className="group relative overflow-hidden w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-purple-500/20 flex items-center justify-center gap-2 transition-all"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Send className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            <span>Let's Talk</span>
          </motion.button>
        </motion.div>

        {/* Live Counters / Statistics with Stagger Entrance */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 pt-6 max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT }}
        >
          {[
            { value: profile?.projects_completed || '50+', label: 'Projects Built', color: 'text-blue-400' },
            { value: profile?.years_experience || '3+', label: 'Years Experience', color: 'text-purple-400' },
            { value: profile?.happy_clients || '100+', label: 'Global Clients', color: 'text-cyan-400' },
            { value: profile?.satisfaction_rate || '99%', label: 'Satisfaction', color: 'text-emerald-400' },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -3, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="p-3 sm:p-4 rounded-2xl bg-white/5 dark:bg-gray-900/50 backdrop-blur-md border border-white/10 dark:border-gray-800 text-center transition-colors hover:border-blue-500/30 hover:bg-white/10"
            >
              <div className={`text-xl sm:text-2xl md:text-3xl font-extrabold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-[10px] sm:text-xs text-gray-300 dark:text-gray-400 font-medium mt-0.5">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default Hero;