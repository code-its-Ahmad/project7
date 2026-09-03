import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import {
  Search,
  Sparkles,
  Cpu,
  Layers,
  Globe,
  LayoutGrid,
  BarChart3,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  Award,
  Clock,
  ShieldCheck,
  TrendingUp,
  Compass,
  Radio,
  Zap,
  Flame,
  Activity,
  Maximize2,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { Skill } from '../api/services';
import { getSkillLevelFromPercentage } from '../lib/utils';
import SkillsSphere3D from './3D/SkillsSphere3D';


type ViewMode = 'cosmos' | 'grid' | 'matrix';
type SortOption = 'percentage-desc' | 'percentage-asc' | 'name-asc' | 'featured' | 'experience';
type TierOption = 'all' | 'expert' | 'advanced' | 'intermediate';

const Skills: React.FC = () => {
  const { skills } = usePortfolio();
  const { playClick, playHover, playWhoosh } = useSound();

  // Default to 3D cosmos view for the full solar system experience!
  const [viewMode, setViewMode] = useState<ViewMode>('cosmos');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('percentage-desc');
  const [selectedTier, setSelectedTier] = useState<TierOption>('all');
  const [activeModalSkill, setActiveModalSkill] = useState<Skill | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    skills.forEach((s) => {
      if (s.category) set.add(s.category);
    });
    return ['All', ...Array.from(set)];
  }, [skills]);

  // Dynamic counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: skills.length };
    skills.forEach((s) => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    return counts;
  }, [skills]);

  // Overall analytics metrics
  const stats = useMemo(() => {
    if (!skills.length) return { total: 0, avgMastery: 0, expertCount: 0, categoriesCount: 0 };
    const total = skills.length;
    const avgMastery = Math.round(skills.reduce((acc, s) => acc + (s.percentage || 0), 0) / total);
    const expertCount = skills.filter((s) => (s.percentage || 0) >= 90).length;
    const categoriesCount = new Set(skills.map((s) => s.category)).size;
    return { total, avgMastery, expertCount, categoriesCount };
  }, [skills]);

  // Filter and sort skills
  const filteredAndSortedSkills = useMemo(() => {
    return skills
      .filter((skill) => {
        const matchesCategory =
          selectedCategory === 'All' || skill.category.toLowerCase() === selectedCategory.toLowerCase();

        const matchesSearch =
          skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          skill.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (skill.level && skill.level.toLowerCase().includes(searchQuery.toLowerCase()));

        let matchesTier = true;
        if (selectedTier === 'expert') matchesTier = skill.percentage >= 90;
        else if (selectedTier === 'advanced') matchesTier = skill.percentage >= 80 && skill.percentage < 90;
        else if (selectedTier === 'intermediate') matchesTier = skill.percentage < 80;

        return matchesCategory && matchesSearch && matchesTier;
      })
      .sort((a, b) => {
        if (sortBy === 'percentage-desc') return (b.percentage || 0) - (a.percentage || 0);
        if (sortBy === 'percentage-asc') return (a.percentage || 0) - (b.percentage || 0);
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
        if (sortBy === 'featured') return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
        if (sortBy === 'experience') {
          const yrsA = parseInt(a.years_experience || '0', 10) || 0;
          const yrsB = parseInt(b.years_experience || '0', 10) || 0;
          return yrsB - yrsA;
        }
        return 0;
      });
  }, [skills, selectedCategory, searchQuery, sortBy, selectedTier]);

  // Grouped by category for Matrix View
  const groupedSkills = useMemo(() => {
    const map: Record<string, Skill[]> = {};
    filteredAndSortedSkills.forEach((s) => {
      if (!map[s.category]) map[s.category] = [];
      map[s.category].push(s);
    });
    return map;
  }, [filteredAndSortedSkills]);

  // Active Category Telemetry summary for Cosmos view
  const activeCategorySummary = useMemo(() => {
    const cat = selectedCategory === 'All' ? 'Complete Cosmos' : selectedCategory;
    const catSkills = selectedCategory === 'All'
      ? skills
      : skills.filter((s) => s.category.toLowerCase() === selectedCategory.toLowerCase());
    const count = catSkills.length;
    const avg = count ? Math.round(catSkills.reduce((acc, s) => acc + (s.percentage || 0), 0) / count) : 0;
    const topSkill = catSkills.slice().sort((a, b) => b.percentage - a.percentage)[0]?.name || 'N/A';
    return { name: cat, count, avg, topSkill };
  }, [skills, selectedCategory]);

  const getCategoryGradient = (category: string) => {
    const norm = (category || '').toLowerCase();
    if (norm.includes('front')) {
      return {
        gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
        border: 'border-cyan-500/40',
        glow: 'rgba(6, 182, 212, 0.25)',
        badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
        planetAlias: 'Cybele-Prime',
      };
    }
    if (norm.includes('back')) {
      return {
        gradient: 'from-emerald-400 via-teal-500 to-green-600',
        border: 'border-emerald-500/40',
        glow: 'rgba(16, 185, 129, 0.25)',
        badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        planetAlias: 'Terracore-VII',
      };
    }
    if (norm.includes('ai') || norm.includes('ml')) {
      return {
        gradient: 'from-purple-400 via-pink-500 to-rose-500',
        border: 'border-purple-500/40',
        glow: 'rgba(168, 85, 247, 0.25)',
        badge: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
        planetAlias: 'Singularity-X',
      };
    }
    if (norm.includes('mobile')) {
      return {
        gradient: 'from-sky-400 via-blue-500 to-cyan-500',
        border: 'border-sky-500/40',
        glow: 'rgba(14, 165, 233, 0.25)',
        badge: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
        planetAlias: 'Aetheria-IV',
      };
    }
    if (norm.includes('database') || norm.includes('data')) {
      return {
        gradient: 'from-amber-400 via-orange-500 to-yellow-600',
        border: 'border-amber-500/40',
        glow: 'rgba(245, 158, 11, 0.25)',
        badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        planetAlias: 'Chronos-Titan',
      };
    }
    if (norm.includes('devops') || norm.includes('cloud')) {
      return {
        gradient: 'from-rose-400 via-red-500 to-orange-600',
        border: 'border-rose-500/40',
        glow: 'rgba(244, 63, 94, 0.25)',
        badge: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        planetAlias: 'Vulkan-Forge',
      };
    }
    return {
      gradient: 'from-indigo-400 via-purple-500 to-pink-500',
      border: 'border-indigo-500/40',
      glow: 'rgba(99, 102, 241, 0.25)',
      badge: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
      planetAlias: 'Celestial-Orb',
    };
  };

  const handleOpenSkillModal = (skill: Skill) => {
    playClick();
    setActiveModalSkill(skill);
  };

  const handleCategorySelect = (category: string) => {
    playWhoosh();
    setSelectedCategory(category);
  };

  const handleResetFilters = () => {
    playWhoosh();
    setSelectedCategory('All');
    setSearchQuery('');
    setSelectedTier('all');
    setSortBy('percentage-desc');
  };

  return (
    <section
      id="skills"
      className="min-h-screen py-16 sm:py-20 px-3 sm:px-6 lg:px-8 relative overflow-hidden bg-[#030712] text-white selection:bg-cyan-500 selection:text-black"
    >
      {/* Background Cosmic Glow Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[350px] bg-gradient-to-r from-blue-600/15 via-purple-600/15 to-cyan-500/15 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 blur-[130px] pointer-events-none -z-10" />

      <div className="relative z-10 max-w-7xl mx-auto w-full space-y-7 sm:space-y-9">
        {/* ─── SECTION HEADER ──────────────────────────────────────────────── */}
        <div className="text-center space-y-3">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-500/15 via-purple-500/15 to-pink-500/15 border border-cyan-500/30 text-xs font-black tracking-widest uppercase text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.25)] backdrop-blur-xl"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Celestial Engineering & 3D Cosmos Matrix</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight"
          >
            <span className="bg-gradient-to-r from-cyan-300 via-blue-400 to-indigo-300 bg-clip-text text-transparent">
              Solar System
            </span>{' '}
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-rose-400 bg-clip-text text-transparent">
              Tech Stack
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xs sm:text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed"
          >
            Explore an ultra-realistic 3D celestial cosmos. Each tech domain forms a planetary body with skill
            satellites orbiting along gravitational trajectories. Fully interactive and buttery-smooth across all devices.
          </motion.p>
        </div>

        {/* ─── METRIC TELEMETRY COUNTER CARDS ─────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-4 rounded-3xl bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-lg flex items-center gap-3.5 group hover:border-cyan-500/40 transition-all">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{stats.total}</div>
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Satellites / Skills</div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-3xl bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-lg flex items-center gap-3.5 group hover:border-purple-500/40 transition-all">
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-400 group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{stats.avgMastery}%</div>
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Avg Gravitational Index</div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-3xl bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-lg flex items-center gap-3.5 group hover:border-amber-500/40 transition-all">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 group-hover:scale-110 transition-transform">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{stats.expertCount}</div>
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Expert Tier (90%+)</div>
            </div>
          </div>

          <div className="p-3.5 sm:p-4 rounded-3xl bg-gray-900/60 backdrop-blur-xl border border-white/10 shadow-lg flex items-center gap-3.5 group hover:border-emerald-500/40 transition-all">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 group-hover:scale-110 transition-transform">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-white">{stats.categoriesCount}</div>
              <div className="text-[10px] sm:text-xs text-gray-400 font-medium">Planetary Systems</div>
            </div>
          </div>
        </div>

        {/* ─── VIEW SWITCHER & CONTROL HUB ─────────────────────────────────── */}
        <div className="space-y-3.5 p-4 sm:p-5 rounded-3xl bg-gray-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-black/60 border border-white/10 self-start">
              <button
                onClick={() => {
                  playWhoosh();
                  setViewMode('cosmos');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  viewMode === 'cosmos'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>3D Cosmos</span>
              </button>

              <button
                onClick={() => {
                  playWhoosh();
                  setViewMode('grid');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  viewMode === 'grid'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 scale-105'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>3D Cards</span>
              </button>

              <button
                onClick={() => {
                  playWhoosh();
                  setViewMode('matrix');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  viewMode === 'matrix'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/30 scale-105'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Matrix</span>
              </button>
            </div>

            {/* Search Input & Sort Dropdown */}
            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full lg:w-auto">
              <div className="relative w-full sm:w-60">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search satellites, levels..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs bg-black/50 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-white placeholder-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="relative w-full sm:w-auto">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    playClick();
                    setSortBy(e.target.value as SortOption);
                  }}
                  className="w-full sm:w-auto pl-7 pr-7 py-1.5 text-xs bg-black/50 border border-white/10 rounded-xl text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer appearance-none"
                >
                  <option value="percentage-desc">⚡ Mastery: High to Low</option>
                  <option value="percentage-asc">📉 Mastery: Low to High</option>
                  <option value="name-asc">🔤 Alphabetical (A-Z)</option>
                  <option value="featured">⭐ Featured First</option>
                  <option value="experience">⏳ Experience (Years)</option>
                </select>
                <ArrowUpDown className="w-3 h-3 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category Planetary Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((cat) => {
              const count = categoryCounts[cat] || 0;
              const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase();
              return (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  onMouseEnter={playHover}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/40 scale-105'
                      : 'bg-black/50 text-gray-300 hover:text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  <span>{cat}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                      isSelected ? 'bg-black/25 text-black' : 'bg-white/10 text-gray-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Mastery Tier Quick Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-white/5 text-xs">
            <span className="text-[10px] text-gray-400 font-semibold mr-1 flex items-center gap-1">
              <SlidersHorizontal className="w-3 h-3 text-cyan-400" /> Tier:
            </span>

            {[
              { id: 'all', label: 'All Orbits' },
              { id: 'expert', label: '💎 Expert (90%+)' },
              { id: 'advanced', label: '⚡ Advanced (80-89%)' },
              { id: 'intermediate', label: '🚀 Intermediate (<80%)' },
            ].map((tier) => (
              <button
                key={tier.id}
                onClick={() => {
                  playClick();
                  setSelectedTier(tier.id as TierOption);
                }}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-medium transition-all ${
                  selectedTier === tier.id
                    ? 'bg-white/20 text-white border border-white/30 shadow-sm'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                {tier.label}
              </button>
            ))}

            {(selectedCategory !== 'All' || searchQuery || selectedTier !== 'all') && (
              <button
                onClick={handleResetFilters}
                className="ml-auto text-[10px] text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-2"
              >
                Reset Telemetry
              </button>
            )}
          </div>
        </div>

        {/* ─── VIEW 1: 3D SOLAR SYSTEM COSMOS ─────────────────────────────── */}
        {viewMode === 'cosmos' && filteredAndSortedSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            className="space-y-4"
          >
            {/* The 3D Canvas Solar System Engine */}
            <SkillsSphere3D
              skills={filteredAndSortedSkills}
              onSelectSkill={handleOpenSkillModal}
              selectedSkillId={activeModalSkill?.id}
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />

            {/* Planetary Telemetry Scanner Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-gray-900/90 via-black/80 to-gray-900/90 border border-white/10 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-cyan-400">
                      Cosmic Scanner
                    </span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    {activeCategorySummary.name}
                  </h4>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 w-full sm:w-auto text-center sm:text-left">
                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-gray-400 font-bold uppercase">Satellites</div>
                  <div className="text-sm font-black text-cyan-300">{activeCategorySummary.count}</div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-gray-400 font-bold uppercase">Avg Gravity</div>
                  <div className="text-sm font-black text-purple-300">{activeCategorySummary.avg}%</div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5">
                  <div className="text-[9px] text-gray-400 font-bold uppercase">Apex Tech</div>
                  <div className="text-xs font-extrabold text-emerald-300 truncate max-w-[80px]">
                    {activeCategorySummary.topSkill}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ─── VIEW 2: 3D PERSPECTIVE TILT CARDS GRID ──────────────────────── */}
        {viewMode === 'grid' && filteredAndSortedSkills.length > 0 && (
          <motion.div
            layout
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4"
          >
            <AnimatePresence>
              {filteredAndSortedSkills.map((skill, index) => {
                const style = getCategoryGradient(skill.category);
                const isExpert = skill.percentage >= 90;

                return (
                  <motion.div
                    layout
                    key={skill.id || `${skill.name}-${index}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.25, delay: Math.min(index * 0.02, 0.25) }}
                  >
                    <Tilt
                      tiltMaxAngleX={10}
                      tiltMaxAngleY={10}
                      perspective={1000}
                      scale={1.02}
                      glareEnable={false}
                      tiltEnable={typeof window !== 'undefined' ? window.innerWidth > 768 : true}
                      transitionSpeed={400}
                      className="h-full"
                    >
                      <div
                        onClick={() => handleOpenSkillModal(skill)}
                        onMouseEnter={playHover}
                        className="h-full p-3.5 sm:p-4 rounded-3xl bg-gray-900/80 backdrop-blur-xl border border-white/10 hover:border-cyan-500/50 shadow-lg hover:shadow-2xl transition-all flex flex-col justify-between space-y-3 cursor-pointer group"
                      >
                        {/* Top info row */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[8px] font-extrabold uppercase tracking-wider border ${style.badge}`}
                          >
                            {skill.category}
                          </span>
                          {skill.years_experience && (
                            <span className="text-[9px] text-gray-400 font-semibold flex items-center gap-0.5">
                              <Clock className="w-2.5 h-2.5" />
                              {skill.years_experience}
                            </span>
                          )}
                        </div>

                        {/* Main Icon and Name */}
                        <div className="text-center space-y-1.5">
                          <div className="text-2xl sm:text-3xl group-hover:scale-115 transition-transform drop-shadow">
                            {skill.icon || '⚡'}
                          </div>

                          <div>
                            <h3 className="font-extrabold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                              {skill.name}
                            </h3>
                            <div className="text-[9px] text-gray-400 font-medium">
                              {getSkillLevelFromPercentage(skill.percentage)}
                            </div>
                          </div>
                        </div>

                        {/* Mastery Gauge & Percentage */}
                        <div className="space-y-1 pt-1 border-t border-white/5">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className="text-gray-400">Gravitational Pull</span>
                            <span className="text-white font-extrabold">
                              {skill.percentage}%
                            </span>
                          </div>

                          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${style.gradient}`}
                              style={{ width: `${skill.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </Tilt>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ─── VIEW 3: PROFICIENCY MATRIX ─────────────────────────────────── */}
        {viewMode === 'matrix' && filteredAndSortedSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-4"
          >
            {Object.entries(groupedSkills).map(([category, catSkills]) => {
              const style = getCategoryGradient(category);
              const avg = Math.round(
                catSkills.reduce((sum, s) => sum + (s.percentage || 0), 0) / (catSkills.length || 1)
              );

              return (
                <div
                  key={category}
                  className="p-4 sm:p-6 rounded-3xl bg-gray-900/80 backdrop-blur-2xl border border-white/10 shadow-xl space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${style.gradient} shadow-md`} />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-white">{category} System</h3>
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-mono">
                            {style.planetAlias}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-400">
                          {catSkills.length} Satellites Mastered • Gravitational Pull: {avg}%
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 min-w-[160px]">
                      <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${style.gradient}`}
                          style={{ width: `${avg}%` }}
                        />
                      </div>
                      <span className="text-xs font-black text-white">{avg}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {catSkills.map((skill) => (
                      <div
                        key={skill.id}
                        onClick={() => handleOpenSkillModal(skill)}
                        onMouseEnter={playHover}
                        className="p-3 rounded-2xl bg-black/40 hover:bg-white/5 border border-white/5 hover:border-cyan-500/40 transition-all flex items-center justify-between gap-2.5 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="text-xl group-hover:scale-115 transition-transform">
                            {skill.icon || '⚡'}
                          </span>
                          <div className="truncate">
                            <div className="text-xs font-bold text-white group-hover:text-cyan-300 truncate">
                              {skill.name}
                            </div>
                            <div className="text-[9px] text-gray-400">
                              {getSkillLevelFromPercentage(skill.percentage)} {skill.years_experience ? `• ${skill.years_experience}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-white">{skill.percentage}%</div>
                          <div className="w-14 bg-white/10 rounded-full h-1 mt-0.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full bg-gradient-to-r ${style.gradient}`}
                              style={{ width: `${skill.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* ─── SKILL INSPECTION LIGHTBOX MODAL ────────────────────────────── */}
        <AnimatePresence>
          {activeModalSkill && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveModalSkill(null)}
                className="absolute inset-0 bg-black/80 backdrop-blur-xl"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-10 w-full max-w-md rounded-3xl bg-gradient-to-b from-gray-900 via-gray-950 to-black border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.25)] p-5 sm:p-7 space-y-5 overflow-hidden"
              >
                <button
                  onClick={() => {
                    playClick();
                    setActiveModalSkill(null);
                  }}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-white/20 flex items-center justify-center text-2xl shadow-inner">
                    {activeModalSkill.icon || '⚡'}
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 mb-0.5">
                      {activeModalSkill.category} System
                    </span>
                    <h3 className="text-xl font-black text-white">{activeModalSkill.name}</h3>
                    <div className="text-xs text-gray-400">
                      Orbital Rank: <span className="text-cyan-300 font-bold">{getSkillLevelFromPercentage(activeModalSkill.percentage)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/50 border border-white/10 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-300">Competency Field</span>
                    <span className="text-base font-black text-cyan-400">
                      {activeModalSkill.percentage}%
                    </span>
                  </div>

                  <div className="w-full bg-white/10 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
                      style={{ width: `${activeModalSkill.percentage}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 text-[10px] text-gray-400">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Production Verified</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeModalSkill.years_experience || '3+ Years'} Exp</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveModalSkill(null)}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl text-xs shadow-lg shadow-cyan-500/25 transition-all"
                >
                  Close Telemetry
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default Skills;