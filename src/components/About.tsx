import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  motion,
  AnimatePresence,
  useInView,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type Variants,
} from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import {
  User,
  Layers,
  GraduationCap,
  Sparkles,
  Download,
  Code2,
  Globe,
  CheckCircle2,
  Zap,
  Heart,
  BookOpen,
  Award,
  Brain,
  Cloud,
  Database,
  Target,
  Clock,
  Star,
  ArrowRight,
  Terminal,
  Shield,
  Rocket,
  Cpu,
  Gauge,
  Workflow,
  Bot,
  Eye,
  Server,
} from 'lucide-react';
import ComputersCanvas from './3D/Computers';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { useCountUp } from '../hooks/useCountUp';

/**
 * ABOUT — Professional / Advanced Edition
 *
 * Design goals:
 * - Premium portfolio presentation.
 * - Scroll-linked storytelling instead of random animation.
 * - 3D ComputersCanvas retained as requested.
 * - Adaptive animation budget for low-end Android devices such as Infinix Hot 10.
 * - Touch-safe interactions; no hover-only functionality.
 * - Reduced-motion support.
 * - No horizontal overflow.
 * - Avoids large always-running animation loops.
 */

type TabId = 'story' | 'architecture' | 'education' | 'philosophy' | 'toolkit';

interface TimelineItem {
  year: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface TechCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
  skills: { name: string; level: number }[];
}

interface PhilosophyCard {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
}

interface FunStat {
  end: number;
  suffix: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const JOURNEY_TIMELINE: TimelineItem[] = [
  {
    year: '2021',
    title: 'Computer Science Foundations',
    description:
      'Started BS Computer Science with a strong focus on algorithms, data structures, software architecture, and problem solving.',
    icon: GraduationCap,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    year: '2022',
    title: 'Full-Stack Product Engineering',
    description:
      'Built production-oriented web systems, dashboards, APIs, database workflows, and business-focused digital experiences.',
    icon: Rocket,
    color: 'from-purple-500 to-pink-500',
  },
  {
    year: '2023',
    title: 'AI, ML & Computer Vision',
    description:
      'Expanded into TensorFlow, PyTorch, OpenCV, deep learning, computer vision, model inference, and intelligent automation.',
    icon: Brain,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    year: '2024',
    title: 'Cloud & Scalable Systems',
    description:
      'Focused on scalable application architecture, Dockerized services, cloud deployment, CI/CD, databases, caching, and reliability.',
    icon: Cloud,
    color: 'from-orange-500 to-amber-500',
  },
  {
    year: '2025 — Present',
    title: 'AI Solutions & Advanced Web Engineering',
    description:
      'Combining high-quality web engineering with custom AI models, AI agents, automation, computer vision, and polished interactive interfaces.',
    icon: Star,
    color: 'from-indigo-500 to-violet-500',
  },
];

const TECH_CATEGORIES: TechCategory[] = [
  {
    name: 'Frontend Engineering',
    icon: Code2,
    color: 'text-blue-500',
    gradient: 'from-blue-500/20 to-cyan-500/20',
    skills: [
      { name: 'React / Next.js', level: 96 },
      { name: 'TypeScript', level: 94 },
      { name: 'Tailwind CSS / CSS', level: 95 },
      { name: 'Three.js / React Three Fiber', level: 88 },
      { name: 'Framer Motion', level: 92 },
    ],
  },
  {
    name: 'Backend & Cloud',
    icon: Database,
    color: 'text-purple-500',
    gradient: 'from-purple-500/20 to-pink-500/20',
    skills: [
      { name: 'Node.js / Express', level: 94 },
      { name: 'Python / FastAPI', level: 90 },
      { name: 'PostgreSQL / MongoDB / Redis', level: 92 },
      { name: 'REST / GraphQL APIs', level: 93 },
      { name: 'Docker / AWS / CI/CD', level: 87 },
    ],
  },
  {
    name: 'AI, ML & Vision',
    icon: Brain,
    color: 'text-emerald-500',
    gradient: 'from-emerald-500/20 to-teal-500/20',
    skills: [
      { name: 'TensorFlow / PyTorch', level: 88 },
      { name: 'OpenCV / Computer Vision', level: 86 },
      { name: 'LLM Agents / AI Workflows', level: 90 },
      { name: 'Model Optimization / Inference', level: 85 },
      { name: 'Scikit-Learn Pipelines', level: 89 },
    ],
  },
  {
    name: 'Automation & Quality',
    icon: Workflow,
    color: 'text-orange-500',
    gradient: 'from-orange-500/20 to-amber-500/20',
    skills: [
      { name: 'AI Automation', level: 92 },
      { name: 'Custom AI Agent Workflows', level: 90 },
      { name: 'Automated Software QA', level: 88 },
      { name: 'API / Integration Testing', level: 91 },
      { name: 'CI/CD Quality Gates', level: 86 },
    ],
  },
];

const PHILOSOPHY_CARDS: PhilosophyCard[] = [
  {
    title: 'Architecture First',
    description:
      'Design boundaries, data flow, failure handling, security, and maintainability before adding unnecessary complexity.',
    icon: Shield,
    gradient: 'from-blue-600 to-cyan-600',
  },
  {
    title: 'Performance by Design',
    description:
      'Animations, assets, rendering, network requests, and component lifecycles are treated as measurable performance decisions.',
    icon: Gauge,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    title: 'Human-Centered UX',
    description:
      'Interfaces should communicate hierarchy instantly, remain accessible, and feel responsive on both desktop and budget hardware.',
    icon: Heart,
    gradient: 'from-pink-500 to-rose-600',
  },
  {
    title: 'Useful Intelligence',
    description:
      'AI should solve a real workflow: automate repetitive work, surface insight, assist decisions, or improve measurable productivity.',
    icon: Bot,
    gradient: 'from-emerald-500 to-teal-600',
  },
];

const FUN_STATS: FunStat[] = [
  { end: 50, suffix: '+', label: 'Production Projects', icon: Rocket, color: 'text-blue-500' },
  { end: 3, suffix: '+', label: 'Years Experience', icon: Clock, color: 'text-purple-500' },
  { end: 100, suffix: '+', label: 'Global Clients', icon: Globe, color: 'text-emerald-500' },
  { end: 99, suffix: '%', label: 'Client Satisfaction', icon: Star, color: 'text-amber-500' },
];

const TERMINAL_OUTPUTS: Record<string, string> = {
  whoami: `Name: Muhammad Ahmad
Role: Full Stack Engineer & AI Solutions Specialist
Focus: Production web systems, custom AI, AI agents & automation
Mode: Worldwide remote collaboration`,
  'cat stack.json': `{
  "frontend": ["React", "Next.js", "TypeScript", "Three.js"],
  "backend": ["Node.js", "Python", "FastAPI", "PostgreSQL"],
  "ai": ["TensorFlow", "PyTorch", "OpenCV", "LLM Agents"],
  "delivery": ["Docker", "AWS", "CI/CD", "Automated QA"]
}`,
  'git status': `On branch production-main

Architecture:
  ✓ Modular components
  ✓ Typed data flow
  ✓ Responsive layouts
  ✓ Performance-aware animations
  ✓ Production-oriented integration

working tree clean.`,
  'system.check()': `[SYSTEM CHECK]
UI rendering        : adaptive
scroll orchestration: enabled
3D experience       : enabled
reduced-motion      : respected
touch interaction   : enabled
responsive layout   : all breakpoints
performance budget  : device-aware`,
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 120, damping: 22 },
  },
};

function useDeviceProfile() {
  const [profile, setProfile] = useState({
    isMobile: false,
    isLowPower: false,
  });

  useEffect(() => {
    const nav = navigator as Navigator & { deviceMemory?: number };
    const connection = (
      nav as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;

    const update = () => {
      const width = window.innerWidth;
      const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
      const slowNetwork =
        connection?.saveData === true ||
        connection?.effectiveType === 'slow-2g' ||
        connection?.effectiveType === '2g';

      setProfile({
        isMobile: width < 768 || coarsePointer,
        isLowPower: lowMemory || slowNetwork || width < 640,
      });
    };

    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return profile;
}

const Reveal = memo(function Reveal({
  children,
  className = '',
  delay = 0,
  y = 24,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
});

Reveal.displayName = 'Reveal';

const StatCounter = memo(function StatCounter({ stat }: { stat: FunStat }) {
  const { ref, displayValue } = useCountUp({
    end: stat.end,
    suffix: stat.suffix,
    duration: 1700,
    delay: 100,
  });
  const Icon = stat.icon;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white/75 p-4 shadow-lg shadow-gray-200/30 backdrop-blur-xl transition-colors dark:border-gray-800/70 dark:bg-gray-900/70 dark:shadow-black/20"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-blue-500/10 blur-2xl transition-transform duration-500 group-hover:scale-150" />
      <div className="relative z-10 text-center">
        <Icon className={`mx-auto mb-1.5 h-5 w-5 ${stat.color}`} />
        <div ref={ref as React.RefObject<HTMLDivElement>} className={`text-2xl font-black ${stat.color}`}>
          {displayValue}
        </div>
        <div className="mt-0.5 truncate text-[10px] font-semibold text-gray-500 dark:text-gray-400">
          {stat.label}
        </div>
      </div>
    </motion.div>
  );
});
StatCounter.displayName = 'StatCounter';

const SkillProgressBar = memo(function SkillProgressBar({
  name,
  level,
  delay,
}: {
  name: string;
  level: number;
  delay: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });

  return (
    <div ref={ref} className="space-y-1">
      <div className="flex items-center justify-between gap-2 text-[11px]">
        <span className="min-w-0 truncate font-semibold text-gray-800 dark:text-gray-200">{name}</span>
        <span className="shrink-0 font-bold text-blue-600 dark:text-blue-400">{level}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
          initial={{ width: 0 }}
          animate={inView ? { width: `${level}%` } : { width: 0 }}
          transition={{ duration: 0.9, delay: delay * 0.06, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
});
SkillProgressBar.displayName = 'SkillProgressBar';

const TimelineEntry = memo(function TimelineEntry({
  item,
  index,
  reducedMotion,
}: {
  item: TimelineItem;
  index: number;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const Icon = item.icon;

  return (
    <motion.div
      ref={ref}
      initial={reducedMotion ? false : { opacity: 0, x: -22 }}
      animate={inView ? { opacity: 1, x: 0 } : undefined}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }
      }
      className="group relative border-l-2 border-blue-500/20 pb-5 pl-7 last:pb-1 dark:border-blue-500/15"
    >
      <div className="absolute -left-[14px] top-0 flex h-6 w-6 items-center justify-center rounded-full border-2 border-blue-500 bg-white text-blue-600 shadow-md transition-transform duration-300 group-hover:scale-110 dark:bg-gray-950 dark:text-blue-400">
        <Icon className="h-3 w-3" />
      </div>

      <div className="rounded-2xl border border-gray-200/70 bg-gray-50/80 p-3.5 shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md dark:border-gray-800/70 dark:bg-gray-800/45">
        <div className="mb-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
          {item.year}
        </div>
        <h5 className="text-sm font-extrabold text-gray-900 dark:text-white">{item.title}</h5>
        <p className="mt-1 text-[11px] leading-relaxed text-gray-600 dark:text-gray-400">{item.description}</p>
      </div>
    </motion.div>
  );
});
TimelineEntry.displayName = 'TimelineEntry';

const About = () => {
  const { profile } = usePortfolio();
  const { playClick, playHover, playWhoosh } = useSound();
  const shouldReduceMotion = useReducedMotion();
  const { isMobile, isLowPower } = useDeviceProfile();

  const [activeTab, setActiveTab] = useState<TabId>('story');
  const [terminalCmd, setTerminalCmd] = useState('whoami');
  const [threeDReady, setThreeDReady] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 70,
    damping: 28,
    mass: 0.35,
  });

  const backgroundY = useTransform(
    smoothScroll,
    [0, 1],
    shouldReduceMotion || isLowPower ? [0, 0] : [20, -70],
  );

  const gridY = useTransform(
    smoothScroll,
    [0, 1],
    shouldReduceMotion || isLowPower ? [0, 0] : [30, -45],
  );

  // Delay expensive 3D mounting until the primary layout has painted.
  // On a low-power phone it still appears, but after a small idle window.
  useEffect(() => {
    let cancelled = false;
    const delay = isLowPower ? 900 : 250;

    const timer = window.setTimeout(() => {
      if (!cancelled) setThreeDReady(true);
    }, delay);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [isLowPower]);

  const downloadCV = useCallback(() => {
    playClick();
    const url =
      profile?.resume_url ||
      'https://drive.google.com/file/d/1LEb7Scv_BQzuClhKMqYnNDqrOdwfnJI0/view?usp=sharing';
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [playClick, profile?.resume_url]);

  const tabs = useMemo(
    () => [
      { id: 'story' as const, label: 'Story', icon: User },
      { id: 'architecture' as const, label: 'Architecture', icon: Layers },
      { id: 'education' as const, label: 'Education', icon: GraduationCap },
      { id: 'philosophy' as const, label: 'Philosophy', icon: Sparkles },
      { id: 'toolkit' as const, label: 'Toolkit', icon: Terminal },
    ],
    [],
  );

  const selectTab = useCallback(
    (id: TabId) => {
      playWhoosh();
      setActiveTab(id);
    },
    [playWhoosh],
  );

  const capabilityItems = useMemo(
    () => [
      { label: 'Production Web Engineering', icon: Code2 },
      { label: 'Custom AI Model Development', icon: Brain },
      { label: 'AI Agents & Automation', icon: Bot },
      { label: 'Computer Vision Systems', icon: Eye },
      { label: 'Scalable APIs & Cloud', icon: Server },
      { label: 'Automated Software QA', icon: CheckCircle2 },
    ],
    [],
  );

  return (
    <section
      ref={sectionRef}
      id="about"
      className="relative isolate min-h-screen overflow-hidden bg-gradient-to-b from-gray-100 via-gray-50 to-gray-100 px-4 py-16 transition-colors duration-300 sm:px-6 sm:py-24 lg:px-8 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900"
    >
      {/* Scroll-linked visual field. It moves as one system instead of many independent loops. */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        style={{ y: backgroundY }}
      >
        <div className="absolute left-[4%] top-20 h-56 w-56 rounded-full bg-blue-500/10 blur-[90px] sm:h-80 sm:w-80" />
        <div className="absolute right-[2%] top-[42%] h-64 w-64 rounded-full bg-purple-500/10 blur-[105px] sm:h-96 sm:w-96" />
        <div className="absolute bottom-10 left-[28%] h-56 w-56 rounded-full bg-emerald-500/8 blur-[100px]" />
      </motion.div>

      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.045] dark:opacity-[0.025]"
        style={{ y: gridY }}
      >
        <div
          className="h-[125%] w-full"
          style={{
            backgroundImage:
              'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
            backgroundSize: isMobile ? '42px 42px' : '56px 56px',
          }}
        />
      </motion.div>

      <div className="relative z-10 mx-auto w-full max-w-7xl">
        {/* Header */}
        <Reveal className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-blue-600 backdrop-blur-md dark:text-blue-400">
            <Sparkles className="h-3.5 w-3.5" />
            Engineering • AI • Automation
          </div>

          <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-5xl md:text-6xl dark:text-white">
            About{' '}
            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Muhammad Ahmad
            </span>
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-xs leading-6 text-gray-600 sm:text-sm md:text-base dark:text-gray-400">
            Full-stack web engineering meets practical AI: scalable systems, custom intelligent
            workflows, automation, computer vision, and high-quality interactive experiences.
          </p>
        </Reveal>

        {/* Main split layout */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12 lg:gap-8">
          {/* Left identity / 3D */}
          <Reveal className="lg:col-span-5" delay={0.05}>
            <div className="space-y-4">
              <Tilt
                tiltMaxAngleX={isMobile || isLowPower ? 0 : 5}
                tiltMaxAngleY={isMobile || isLowPower ? 0 : 5}
                perspective={1100}
                scale={isMobile || isLowPower ? 1 : 1.012}
                transitionSpeed={650}
                tiltEnable={!isMobile && !isLowPower && !shouldReduceMotion}
                glareEnable={!isMobile && !isLowPower && !shouldReduceMotion}
                glareMaxOpacity={0.08}
              >
                <div className="group relative overflow-hidden rounded-[1.7rem] border border-gray-200/70 bg-white/80 p-4 shadow-2xl shadow-gray-300/25 backdrop-blur-xl sm:p-6 dark:border-gray-800/70 dark:bg-gray-900/75 dark:shadow-black/25">
                  <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-500/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />

                  <div className="relative mb-5 overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/20 via-indigo-950/15 to-purple-950/20">
                    <div className="absolute left-3 top-3 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[9px] font-bold text-white/80 backdrop-blur-md">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Interactive 3D workspace
                    </div>

                    <div className="h-52 w-full sm:h-60">
                      {threeDReady ? (
                        <ComputersCanvas />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <div className="text-center">
                            <Cpu className="mx-auto h-7 w-7 animate-pulse text-blue-400" />
                            <p className="mt-2 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                              Initializing 3D experience…
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5 shadow-lg">
                      <img
                        src={profile?.avatar_url || '/assets/profile.png'}
                        alt={profile?.name || 'Muhammad Ahmad'}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full rounded-[14px] object-cover"
                        onError={(e) => {
                          const image = e.currentTarget;
                          if (image.src.endsWith('/assets/profile.png')) return;
                          image.src = '/assets/profile.png';
                        }}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">
                          Full Stack + AI
                        </span>
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500">
                          {profile?.years_experience || '3+'} Yrs
                        </span>
                      </div>
                      <h3 className="truncate text-lg font-black text-gray-950 sm:text-xl dark:text-white">
                        {profile?.name || 'Muhammad Ahmad'}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-6 text-gray-600 dark:text-gray-400">
                    {profile?.bio ||
                      'Building production-ready websites, custom AI systems, intelligent agents, automation workflows, and scalable software with a performance-first mindset.'}
                  </p>

                  <div className="mt-5 flex flex-col gap-2.5 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={downloadCV}
                      onMouseEnter={playHover}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-500/20 transition hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download CV
                    </motion.button>

                    <span className="text-center text-[11px] font-semibold text-gray-500 sm:text-right dark:text-gray-400">
                      {profile?.location || 'Lahore, Pakistan'}
                    </span>
                  </div>
                </div>
              </Tilt>

              {/* Capability matrix */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: Target, label: 'Pixel-Perfect UI' },
                  { icon: Zap, label: 'Performance First' },
                  { icon: Shield, label: 'Secure Architecture' },
                  { icon: Bot, label: 'Practical AI' },
                ].map(({ icon: Icon, label }, index) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={shouldReduceMotion || isMobile ? undefined : { y: -2 }}
                    className="flex min-w-0 items-center gap-2 rounded-xl border border-gray-200/70 bg-white/65 p-3 text-[10px] font-bold text-gray-700 backdrop-blur dark:border-gray-800/70 dark:bg-gray-900/60 dark:text-gray-300"
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                    <span className="truncate">{label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Right interactive content */}
          <Reveal className="lg:col-span-7" delay={0.1}>
            <div className="space-y-4">
              {/* Scrollable tab rail on phones: prevents wrapping explosion */}
              <div
                role="tablist"
                aria-label="About sections"
                className="scrollbar-none flex snap-x gap-1.5 overflow-x-auto rounded-2xl border border-gray-200/70 bg-gray-200/60 p-1 backdrop-blur-md dark:border-gray-800/70 dark:bg-gray-800/60"
              >
                {tabs.map(({ id, label, icon: Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      role="tab"
                      aria-selected={active}
                      onClick={() => selectTab(id)}
                      onMouseEnter={playHover}
                      className={`flex min-h-10 shrink-0 snap-start items-center gap-1.5 rounded-xl px-3 text-[11px] font-bold transition-all duration-200 sm:text-xs ${active
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-600 hover:bg-white/60 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-700/50 dark:hover:text-white'
                        }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>

              <div className="min-h-[390px] rounded-[1.7rem] border border-gray-200/80 bg-white/90 p-4 shadow-2xl shadow-gray-300/20 backdrop-blur-xl sm:p-7 dark:border-gray-800/80 dark:bg-gray-900/90 dark:shadow-black/20">
                <AnimatePresence mode="wait" initial={false}>
                  {activeTab === 'story' && (
                    <motion.div
                      key="story"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                      className="space-y-6"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Rocket className="h-4 w-4 text-blue-500" />
                          <h4 className="text-base font-black text-gray-950 sm:text-lg dark:text-white">
                            From Ideas to Production Systems
                          </h4>
                        </div>
                        <p className="mt-2 text-xs leading-6 text-gray-600 sm:text-sm dark:text-gray-400">
                          {profile?.about_story ||
                            'I focus on turning difficult business and technical requirements into reliable digital products. My work combines web engineering, AI, automation, data, and thoughtful UX rather than treating them as isolated technologies.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-2 border-y border-gray-100 py-4 sm:grid-cols-2 dark:border-gray-800">
                        {capabilityItems.map(({ label, icon: Icon }) => (
                          <div key={label} className="flex items-center gap-2 text-[11px] font-bold text-gray-800 dark:text-gray-200">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                            <Icon className="h-3.5 w-3.5 shrink-0 text-blue-500" />
                            <span>{label}</span>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="mb-3 flex items-center gap-2 text-xs font-black text-gray-950 dark:text-white">
                          <Clock className="h-3.5 w-3.5 text-blue-500" />
                          Engineering Journey
                        </div>
                        <div>
                          {JOURNEY_TIMELINE.map((item, index) => (
                            <TimelineEntry
                              key={item.year}
                              item={item}
                              index={index}
                              reducedMotion={Boolean(shouldReduceMotion)}
                            />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'architecture' && (
                    <motion.div
                      key="architecture"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                      className="space-y-5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4 w-4 text-purple-500" />
                          <h4 className="text-base font-black text-gray-950 sm:text-lg dark:text-white">
                            Engineering Architecture
                          </h4>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-gray-600 dark:text-gray-400">
                          Modular components, typed data flow, resilient APIs, measurable performance, and AI workflows designed around real use cases.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {TECH_CATEGORIES.map((category, categoryIndex) => {
                          const Icon = category.icon;
                          return (
                            <div
                              key={category.name}
                              className="rounded-2xl border border-gray-200/70 bg-gray-50/80 p-3.5 dark:border-gray-800/70 dark:bg-gray-800/45"
                            >
                              <div className="mb-3 flex items-center gap-2">
                                <Icon className={`h-4 w-4 ${category.color}`} />
                                <span className="text-xs font-black text-gray-900 dark:text-white">
                                  {category.name}
                                </span>
                              </div>
                              <div className="space-y-2.5">
                                {category.skills.map((skill, skillIndex) => (
                                  <SkillProgressBar
                                    key={skill.name}
                                    name={skill.name}
                                    level={skill.level}
                                    delay={categoryIndex + skillIndex}
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'education' && (
                    <motion.div
                      key="education"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                      className="space-y-5"
                    >
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-blue-500" />
                        <h4 className="text-base font-black text-gray-950 sm:text-lg dark:text-white">
                          Education & Professional Foundations
                        </h4>
                      </div>

                      <div className="rounded-2xl border border-blue-200/60 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:border-blue-800/40 dark:from-blue-950/30 dark:to-indigo-950/30">
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl bg-blue-600 p-2 text-white shadow-lg shadow-blue-500/20">
                            <GraduationCap className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-sm font-black text-blue-700 dark:text-blue-300">
                              Bachelor of Science in Computer Science
                            </h5>
                            <p className="mt-1.5 text-xs leading-5 text-gray-600 dark:text-gray-400">
                              Strong foundations in data structures, algorithms, software engineering, databases, machine learning, and distributed systems.
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                          {['Algorithms', 'Machine Learning', 'Databases', 'Distributed Systems', 'Software Architecture'].map((subject) => (
                            <span
                              key={subject}
                              className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[9px] font-bold text-blue-600 dark:text-blue-400"
                            >
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 flex items-center gap-1.5 text-xs font-black text-gray-900 dark:text-white">
                          <Award className="h-3.5 w-3.5 text-amber-500" />
                          Professional Learning Areas
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {[
                            ['Web Engineering', Code2],
                            ['AI / Machine Learning', Brain],
                            ['Cloud Architecture', Cloud],
                            ['Software Quality', CheckCircle2],
                          ].map(([label, Icon]) => {
                            const ItemIcon = Icon as React.ComponentType<{ className?: string }>;
                            return (
                              <div
                                key={label as string}
                                className="flex items-center gap-2.5 rounded-xl border border-gray-200/70 bg-gray-50/80 p-3 dark:border-gray-800/70 dark:bg-gray-800/50"
                              >
                                <ItemIcon className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">{label as string}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'philosophy' && (
                    <motion.div
                      key="philosophy"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                      className="space-y-5"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-purple-500" />
                          <h4 className="text-base font-black text-gray-950 sm:text-lg dark:text-white">
                            How I Engineer
                          </h4>
                        </div>
                        <p className="mt-1.5 text-xs leading-5 text-gray-600 dark:text-gray-400">
                          {profile?.about_philosophy ||
                            'Clean architecture, measurable performance, useful AI, and interfaces that remain intuitive across devices.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        {PHILOSOPHY_CARDS.map((card) => {
                          const Icon = card.icon;
                          return (
                            <motion.div
                              key={card.title}
                              whileHover={shouldReduceMotion || isMobile ? undefined : { y: -3 }}
                              className="rounded-2xl border border-gray-200/70 bg-gray-50/80 p-4 shadow-sm transition-shadow hover:shadow-md dark:border-gray-800/70 dark:bg-gray-800/45"
                            >
                              <div className="flex items-center gap-2.5">
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} text-white`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <h5 className="text-xs font-black text-gray-900 sm:text-sm dark:text-white">
                                  {card.title}
                                </h5>
                              </div>
                              <p className="mt-2 text-[11px] leading-5 text-gray-600 dark:text-gray-400">
                                {card.description}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'toolkit' && (
                    <motion.div
                      key="toolkit"
                      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -10 }}
                      transition={{ duration: shouldReduceMotion ? 0 : 0.3 }}
                      className="space-y-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Terminal className="h-4 w-4 text-emerald-500" />
                          <h4 className="text-base font-black text-gray-950 sm:text-lg dark:text-white">
                            Developer Toolkit
                          </h4>
                        </div>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          An interactive, presentation-only terminal for exploring the engineering profile.
                        </p>
                      </div>

                      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {Object.keys(TERMINAL_OUTPUTS).map((cmd) => (
                          <button
                            key={cmd}
                            onClick={() => {
                              playClick();
                              setTerminalCmd(cmd);
                            }}
                            className={`shrink-0 rounded-xl px-3 py-1.5 font-mono text-[10px] font-bold transition ${terminalCmd === cmd
                              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                              }`}
                          >
                            $ {cmd}
                          </button>
                        ))}
                      </div>

                      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-[#090d16] font-mono shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-800 bg-[#0f172a] px-3 py-2.5 sm:px-4">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            <span className="ml-1.5 text-[9px] font-bold text-gray-400">ahmad@portfolio</span>
                          </div>
                          <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                            ● READY
                          </span>
                        </div>

                        <div className="max-h-60 overflow-y-auto p-4 text-[10px] leading-5 text-gray-300">
                          <div className="mb-2 flex flex-wrap gap-1.5 text-emerald-400">
                            <span>ahmad@portfolio:~$</span>
                            <span className="break-all text-white">{terminalCmd}</span>
                          </div>
                          <pre className="whitespace-pre-wrap break-words text-blue-200/90">
                            {TERMINAL_OUTPUTS[terminalCmd]}
                          </pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {[
                          ['Editor', 'VS Code'],
                          ['Cloud', 'AWS / Vercel'],
                          ['VCS', 'Git / CI'],
                          ['Testing', 'API / QA'],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-gray-200/70 bg-gray-50 p-2.5 text-center dark:border-gray-800/70 dark:bg-gray-800/50"
                          >
                            <div className="text-[8px] font-black uppercase tracking-wider text-gray-400">{label}</div>
                            <div className="mt-0.5 truncate text-[10px] font-black text-gray-900 dark:text-white">{value}</div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Reveal>
        </div>

        {/* Stats */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-4 sm:gap-4"
        >
          {FUN_STATS.map((stat) => (
            <StatCounter key={stat.label} stat={stat} />
          ))}
        </motion.div>

        {/* Bottom engineering principles */}
        <Reveal className="mt-8 sm:mt-12" delay={0.05}>
          <div className="relative overflow-hidden rounded-[1.7rem] border border-gray-200/70 bg-white/70 p-5 shadow-xl backdrop-blur-xl sm:p-7 dark:border-gray-800/70 dark:bg-gray-900/65">
            <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[1fr_auto]">
              <div>
                <div className="mb-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-blue-500">
                  <Workflow className="h-3.5 w-3.5" />
                  Build • Automate • Scale
                </div>
                <h3 className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl dark:text-white">
                  Engineering with a measurable purpose.
                </h3>
                <p className="mt-2 max-w-2xl text-xs leading-5 text-gray-600 sm:text-sm dark:text-gray-400">
                  The goal is not to add technology for appearance. The goal is to create software that is reliable, fast, maintainable, useful, and ready to grow.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 md:justify-end">
                {['Responsive', 'Performance', 'Security', 'AI-ready'].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-[10px] font-bold text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute -bottom-16 -right-16 h-40 w-40 rounded-full bg-blue-500/10 blur-3xl" />
          </div>
        </Reveal>
      </div>
    </section>
  );
};

export default About;
