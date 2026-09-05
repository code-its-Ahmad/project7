import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Quote,
  Plus,
  X,
  MessageSquareHeart,
  CheckCircle,
  Camera,
  Upload,
  LayoutGrid,
  Layers,
  Loader2,
  User,
  Building2,
  Briefcase,
  Heart,
  ThumbsUp,
  Award,
  Search,
  Trash2,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { useDeviceCapabilities } from '../context/DeviceCapabilitiesContext';
import { testimonialsAPI, uploadAPI, Testimonial } from '../api/services';
import { optimizeAvatarImage } from '../lib/imageCompressor';
import toast from 'react-hot-toast';
import { EASE_OUT } from '../lib/motion';
import ThreeDParallaxCarousel from './common/ThreeDParallaxCarousel';

interface ReviewFormState {
  name: string;
  role: string;
  company: string;
  rating: number;
  text: string;
  project_name: string;
  avatar: string;
}

const EMPTY_FORM: ReviewFormState = {
  name: '',
  role: '',
  company: '',
  rating: 5,
  text: '',
  project_name: '',
  avatar: '',
};

const RATING_DESCRIPTIONS: Record<number, { text: string; emoji: string }> = {
  5: { text: 'Exceptional Excellence & Quality', emoji: '🌟' },
  4: { text: 'Great Experience & Delivery', emoji: '🚀' },
  3: { text: 'Good Work & Solid Output', emoji: '👍' },
  2: { text: 'Fair with Room for Improvement', emoji: '👌' },
  1: { text: 'Needs Improvement', emoji: '🌱' },
};

/* ─── Interactive Star Rating Input with Dynamic Feedback ─── */
const StarRatingInput: React.FC<{
  rating: number;
  onChange: (r: number) => void;
  playClick?: () => void;
}> = ({ rating, onChange, playClick }) => {
  const [hover, setHover] = useState(0);
  const activeRating = hover || rating;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => {
              playClick?.();
              onChange(star);
            }}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl transition-all duration-200 hover:scale-125 active:scale-95 focus:outline-none focus:ring-2 focus:ring-pink-500/40"
            aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
          >
            <Star
              className={`w-7 h-7 transition-colors duration-200 ${
                star <= activeRating
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.4)]'
                  : 'text-gray-300 dark:text-gray-700'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-xs font-black px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
          {activeRating}.0 / 5.0
        </span>
      </div>
      <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
        <span>{RATING_DESCRIPTIONS[activeRating]?.emoji}</span>
        <span>{RATING_DESCRIPTIONS[activeRating]?.text}</span>
      </p>
    </div>
  );
};

/* ─── Grid Testimonial Card ─── */
const TestimonialGridCard: React.FC<{
  item: Testimonial;
  index: number;
  isFeatured?: boolean;
}> = ({ item, index, isFeatured = false }) => {
  const rating = Number(item.rating) || 5;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30px' }}
      transition={{ delay: Math.min(index * 0.05, 0.25), ease: EASE_OUT }}
      className={`group relative flex flex-col justify-between rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
        isFeatured
          ? 'border-pink-500/40 dark:border-pink-500/30 shadow-pink-500/10 ring-1 ring-pink-500/20'
          : 'border-gray-200 dark:border-gray-800 hover:border-pink-400/40 dark:hover:border-pink-500/30'
      }`}
    >
      {/* Top Gradient Accent */}
      <div
        className={`absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r ${
          isFeatured
            ? 'from-transparent via-pink-500 to-transparent'
            : 'from-transparent via-pink-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'
        }`}
      />

      {isFeatured && (
        <div className="absolute top-3.5 right-3.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[9px] font-bold tracking-wider uppercase flex items-center gap-1 shadow-md shadow-pink-500/20">
          <Award className="w-2.5 h-2.5" />
          Featured
        </div>
      )}

      <div className="p-4 sm:p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-3">
          {/* Star Rating */}
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < rating
                    ? 'fill-amber-400 text-amber-400 drop-shadow-[0_1px_4px_rgba(251,191,36,0.3)]'
                    : 'text-gray-200 dark:text-gray-700'
                }`}
              />
            ))}
            <span className="ml-1.5 text-[10px] font-bold text-gray-500 dark:text-gray-400">
              {rating}.0
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-900/40">
              <ShieldCheck className="w-2.5 h-2.5" /> Verified
            </span>
          </div>

          {/* Feedback Text */}
          <div className="relative">
            <Quote className="w-5 h-5 text-pink-500/15 dark:text-pink-400/20 absolute -top-1 -left-1 pointer-events-none" />
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 leading-relaxed pl-3 italic font-normal line-clamp-4">
              &ldquo;{item.text}&rdquo;
            </p>
          </div>
        </div>

        {/* Project Tag */}
        {item.project_name && (
          <div className="flex items-center gap-1.5 pt-1">
            <Briefcase className="w-3 h-3 text-pink-500/70 shrink-0" />
            <span className="text-[10px] font-semibold text-pink-600 dark:text-pink-400 truncate">
              {item.project_name}
            </span>
          </div>
        )}
      </div>

      {/* Author Footer */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-gray-100 dark:border-gray-800/80 flex items-center gap-3 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="relative shrink-0">
          <img
            src={
              item.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                item.name
              )}&background=ec4899&color=fff&size=96`
            }
            alt={item.name}
            loading="lazy"
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl object-cover border-2 border-pink-500/30 shadow-sm"
            onError={(e: any) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                item.name
              )}&background=6366f1&color=fff&size=96`;
            }}
          />
          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
            <CheckCircle className="w-2 h-2 text-white" />
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
            {item.name}
          </div>
          <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 truncate">
            {[item.role, item.company].filter(Boolean).join(' · ') || 'Verified Client'}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

/* ─── Main Testimonials Component ─── */
const Testimonials: React.FC = () => {
  const { testimonials, refetch, isLoading } = usePortfolio();
  const { playClick, playHover, playSuccess, playWhoosh } = useSound();
  const { tier } = useDeviceCapabilities();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [carouselIndex, setCarouselIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'carousel3d' | 'grid'>('carousel3d');
  const [filterRating, setFilterRating] = useState<'all' | '5' | '4' | 'featured'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [formData, setFormData] = useState<ReviewFormState>(EMPTY_FORM);
  const [charCount, setCharCount] = useState(0);

  // Infinix Hot 10 / compact screen detection
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth <= 640
  );

  useEffect(() => {
    const handleResize = () => {
      setIsNarrow(window.innerWidth <= 640);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateForm = useCallback(
    <K extends keyof ReviewFormState>(k: K, v: ReviewFormState[K]) => {
      setFormData((prev) => ({ ...prev, [k]: v }));
    },
    []
  );

  // Filter & Search Logic
  const filteredTestimonials = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return testimonials.filter((item) => {
      const numRating = Number(item.rating) || 5;
      if (filterRating === '5' && numRating < 5) return false;
      if (filterRating === '4' && numRating < 4) return false;
      if (filterRating === 'featured' && !item.is_featured) return false;

      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        (item.company || '').toLowerCase().includes(q) ||
        (item.role || '').toLowerCase().includes(q) ||
        (item.project_name || '').toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q)
      );
    });
  }, [testimonials, filterRating, searchQuery]);

  /* ── Avatar Upload with Client-Side Image Optimization ── */
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (JPG, PNG, WebP).');
      return;
    }

    try {
      setIsUploadingAvatar(true);
      const optimized = await optimizeAvatarImage(file, 240, 0.85);
      setAvatarPreview(optimized.dataUrl);

      try {
        const res = await uploadAPI.uploadFile(optimized.file);
        updateForm('avatar', res.url);
        toast.success('Profile photo ready!');
      } catch {
        updateForm('avatar', optimized.dataUrl);
        toast.success('Photo attached!');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to process image.');
      setAvatarPreview('');
      updateForm('avatar', '');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const removeAvatar = () => {
    setAvatarPreview('');
    updateForm('avatar', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    toast('Photo removed');
  };

  /* ── Submit Review to Live Backend ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Please provide your full name.');
      return;
    }

    if (!formData.text.trim() || formData.text.trim().length < 20) {
      toast.error('Please write at least 20 characters of honest feedback.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<Testimonial> = {
        name: formData.name.trim(),
        role: formData.role.trim() || 'Client',
        company: formData.company.trim() || '',
        project_name: formData.project_name.trim() || undefined,
        rating: formData.rating || 5,
        text: formData.text.trim(),
        avatar: formData.avatar || undefined,
      };

      const res = await testimonialsAPI.submit(payload);
      playSuccess();
      toast.success(
        res.message ||
          'Thank you! Your client review was submitted and will appear upon review.',
        { duration: 5500 }
      );

      setIsModalOpen(false);
      setFormData(EMPTY_FORM);
      setAvatarPreview('');
      setCharCount(0);
      await refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openModal = () => {
    playClick();
    setFormData(EMPTY_FORM);
    setAvatarPreview('');
    setCharCount(0);
    setIsModalOpen(true);
  };

  /* ── Live Computed Trust Statistics from Database ── */
  const totalRated = testimonials.filter((t) => Number(t.rating) > 0);
  const avgRating = totalRated.length
    ? (
        totalRated.reduce((s, t) => s + Number(t.rating), 0) / totalRated.length
      ).toFixed(1)
    : '5.0';
  const fiveStarsCount = testimonials.filter((t) => Number(t.rating) >= 5).length;
  const satisfactionRate = testimonials.length
    ? Math.round(
        (testimonials.filter((t) => Number(t.rating) >= 4).length /
          testimonials.length) *
          100
      )
    : 100;

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative min-h-screen flex items-center justify-center py-16 sm:py-24 lg:py-32 px-3.5 sm:px-6 lg:px-8 bg-gradient-to-b from-gray-50 via-white to-gray-100 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 overflow-hidden transition-colors duration-300"
    >
      {/* Ambient Lighting Orbs */}
      <div className="absolute top-1/4 -left-12 w-64 sm:w-96 h-64 sm:h-96 bg-pink-500/10 dark:bg-pink-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-12 w-64 sm:w-96 h-64 sm:h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-8 sm:space-y-12">
        {/* Section Header */}
        <div className="text-center space-y-3 px-1">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-bold text-pink-600 dark:text-pink-400 backdrop-blur-md shadow-sm"
          >
            <MessageSquareHeart className="w-3.5 h-3.5" />
            <span>Verified Endorsements</span>
          </motion.div>

          <motion.h2
            id="testimonials-heading"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.08, ease: EASE_OUT }}
            className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight"
          >
            <span className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Real Client
            </span>{' '}
            <span className="bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Feedback
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.14, ease: EASE_OUT }}
            className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 max-w-xl mx-auto leading-relaxed"
          >
            Authentic reviews from founders, enterprise clients, and engineering leads.
          </motion.p>
        </div>

        {/* Live Trust Metrics Dock */}
        {testimonials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 max-w-2xl mx-auto"
          >
            {[
              {
                icon: Star,
                label: 'Avg Rating',
                value: `${avgRating} / 5.0`,
                color: 'text-amber-500',
                bg: 'bg-amber-500/10',
              },
              {
                icon: ThumbsUp,
                label: 'Real Reviews',
                value: testimonials.length,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
              },
              {
                icon: Heart,
                label: '5-Star Ratings',
                value: fiveStarsCount,
                color: 'text-pink-500',
                bg: 'bg-pink-500/10',
              },
              {
                icon: Sparkles,
                label: 'Satisfaction',
                value: `${satisfactionRate}%`,
                color: 'text-purple-500',
                bg: 'bg-purple-500/10',
              },
            ].map(({ icon: Icon, label, value, color, bg }) => (
              <div
                key={label}
                className="p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/80 dark:border-gray-800 shadow-md text-center space-y-1 hover:border-pink-500/30 transition-colors"
              >
                <div
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl ${bg} ${color} flex items-center justify-center mx-auto`}
                >
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div className="text-base sm:text-xl font-extrabold text-gray-900 dark:text-white">
                  {value}
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Filter & Control Bar */}
        <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-lg space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Left: View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 self-start">
              {[
                { mode: 'carousel3d' as const, icon: Layers, label: '3D Parallax Carousel' },
                { mode: 'grid' as const, icon: LayoutGrid, label: 'Grid Explorer' },
              ].map(({ mode, icon: Icon, label }) => (
                <button
                  key={mode}
                  onClick={() => {
                    playClick();
                    setViewMode(mode);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    viewMode === mode
                      ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-md'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="capitalize">{label}</span>
                </button>
              ))}
            </div>

            {/* Center: Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reviews by name, company, or stack..."
                className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: Write Review CTA */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={openModal}
              onMouseEnter={playHover}
              className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-md shadow-pink-500/25 transition-all shrink-0 min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Leave a Review</span>
            </motion.button>
          </div>

          {/* Rating Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide pt-1">
            {[
              { id: 'all' as const, label: 'All Reviews', count: testimonials.length },
              {
                id: '5' as const,
                label: '5-Star Only',
                icon: Star,
                count: testimonials.filter((t) => Number(t.rating) >= 5).length,
              },
              {
                id: '4' as const,
                label: '4+ Stars',
                count: testimonials.filter((t) => Number(t.rating) >= 4).length,
              },
              {
                id: 'featured' as const,
                label: 'Featured',
                icon: Award,
                count: testimonials.filter((t) => t.is_featured).length,
              },
            ].map(({ id, label, icon: Icon, count }) => (
              <button
                key={id}
                onClick={() => {
                  playClick();
                  setFilterRating(id);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  filterRating === id
                    ? 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/30'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {Icon && <Icon className="w-3 h-3 text-amber-500" />}
                <span>{label}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16 space-y-3">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin" />
            <p className="text-xs font-semibold text-gray-500">Loading verified reviews...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredTestimonials.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-14 px-4 space-y-4 rounded-3xl bg-white/60 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800"
          >
            <MessageSquareHeart className="w-12 h-12 text-pink-500/40 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {testimonials.length === 0 ? 'No reviews yet' : 'No matching reviews found'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                {testimonials.length === 0
                  ? 'Be the first client to leave feedback and share your experience!'
                  : 'Try adjusting your search or rating filters to see more client reviews.'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={openModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 shadow-lg shadow-pink-500/20"
            >
              <Plus className="w-4 h-4" /> Submit Client Review
            </motion.button>
          </motion.div>
        )}

        {/* ═══ VIEW MODE 1: 3D PARALLAX GLASSMORPHIC CAROUSEL ═══ */}
        {!isLoading && filteredTestimonials.length > 0 && viewMode === 'carousel3d' && (
          <div className="space-y-4">
            <ThreeDParallaxCarousel<Testimonial>
              items={filteredTestimonials}
              keyExtractor={(item) => item.id}
              activeIndex={carouselIndex}
              onActiveChange={setCarouselIndex}
              accentColor="236, 72, 153"
              ariaLabel="Verified Client Feedback 3D Carousel"
              autoPlayInterval={tier === 'low' ? 0 : 6500}
              renderItem={({ item, isActive, parallaxX }) => (
                <div
                  onMouseEnter={playHover}
                  className={`relative w-full h-full rounded-3xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl border shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between p-6 sm:p-8 md:p-9 ${
                    item.is_featured
                      ? 'border-pink-500/40 dark:border-pink-500/30 shadow-pink-500/15'
                      : 'border-gray-200/90 dark:border-gray-800/90'
                  }`}
                  style={{
                    boxShadow: isActive
                      ? '0 24px 60px -20px rgba(236, 72, 153, 0.45), 0 0 0 1px rgba(236, 72, 153, 0.25)'
                      : '0 12px 30px -15px rgba(0, 0, 0, 0.3)',
                    transformStyle: 'preserve-3d',
                  }}
                >
                  {/* Top Accent line */}
                  <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-transparent via-pink-500 to-transparent" />

                  {/* Parallax Watermark Quote */}
                  <div
                    className="absolute top-5 right-6 pointer-events-none transition-transform duration-500"
                    style={{
                      transform: `translate3d(${parallaxX * -0.3}px, 0, -10px)`,
                    }}
                  >
                    <Quote className="w-12 sm:w-16 h-12 sm:h-16 text-pink-500/10 dark:text-pink-400/15" />
                  </div>

                  {item.is_featured && (
                    <div
                      className="absolute top-4 right-4 px-2.5 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white text-[10px] font-bold flex items-center gap-1 shadow-md shadow-pink-500/20"
                      style={{ transform: 'translateZ(20px)' }}
                    >
                      <Award className="w-3 h-3" /> Featured
                    </div>
                  )}

                  <div className="space-y-4" style={{ transform: 'translateZ(12px)' }}>
                    {/* Rating Stars */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            i < (Number(item.rating) || 5)
                              ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.35)]'
                              : 'text-gray-200 dark:text-gray-700'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-xs font-bold text-gray-500 dark:text-gray-400">
                        {item.rating || 5}.0 / 5.0
                      </span>
                      <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/40">
                        <ShieldCheck className="w-3 h-3" /> Verified Client
                      </span>
                    </div>

                    {/* Quote Text */}
                    <blockquote className="text-sm sm:text-base md:text-lg font-medium text-gray-800 dark:text-gray-100 leading-relaxed italic line-clamp-5 sm:line-clamp-6">
                      &ldquo;{item.text}&rdquo;
                    </blockquote>
                  </div>

                  {/* Author Card Footer */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 mt-4 border-t border-gray-100 dark:border-gray-800"
                    style={{ transform: 'translateZ(15px)' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={
                            item.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              item.name
                            )}&background=ec4899&color=fff&size=120`
                          }
                          alt={item.name}
                          loading="lazy"
                          className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl object-cover border-2 border-pink-500/30 shadow-md"
                          onError={(e: any) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                              item.name
                            )}&background=6366f1&color=fff&size=120`;
                          }}
                        />
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900 flex items-center justify-center">
                          <CheckCircle className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      <div>
                        <div className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                          {[item.role, item.company].filter(Boolean).join(' · ') ||
                            'Verified Client'}
                        </div>
                      </div>
                    </div>

                    {item.project_name && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-400 border border-pink-100 dark:border-pink-900/40 self-start sm:self-auto">
                        <Briefcase className="w-3 h-3" />
                        <span>{item.project_name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            />
          </div>
        )}

        {/* ═══ VIEW MODE 2: RESPONSIVE GRID EXPLORER ═══ */}
        {!isLoading && filteredTestimonials.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredTestimonials.map((item, i) => (
              <TestimonialGridCard
                key={item.id}
                item={item}
                index={i}
                isFeatured={Boolean(item.is_featured)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══ SUBMIT REVIEW MODAL (Bottom sheet on mobile / Centered Dialog on Desktop) ═══ */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/75 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isSubmitting && setIsModalOpen(false)}
            />

            {/* Modal Dialog */}
            <motion.div
              className="relative w-full sm:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border-t sm:border border-gray-200 dark:border-gray-800 z-10 overflow-hidden flex flex-col max-h-[90vh] sm:max-h-[85vh]"
              initial={{ opacity: 0, y: isNarrow ? '100%' : 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: isNarrow ? '100%' : 20 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {/* Top Accent Gradient */}
              <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-500 via-pink-500 to-purple-500" />

              {/* Mobile Drag Indicator */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden shrink-0">
                <div className="w-12 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/10 text-pink-500 flex items-center justify-center">
                    <MessageSquareHeart className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                      Submit Client Review
                    </h3>
                    <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400">
                      Share your real experience &amp; feedback
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsModalOpen(false)}
                  className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form Content (Scrollable) */}
              <div className="overflow-y-auto px-5 sm:px-6 py-4 space-y-4">
                <form id="client-review-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Photo Upload */}
                  <div className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-gray-800/50 border border-gray-200/60 dark:border-gray-700/60 flex items-center gap-3.5">
                    <div className="relative shrink-0">
                      <div
                        className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex items-center justify-center transition-all ${
                          avatarPreview || formData.avatar
                            ? 'border-pink-500 shadow-md'
                            : 'border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                        }`}
                      >
                        {isUploadingAvatar ? (
                          <Loader2 className="w-5 h-5 text-pink-500 animate-spin" />
                        ) : avatarPreview || formData.avatar ? (
                          <img
                            src={avatarPreview || formData.avatar}
                            alt="Avatar preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-gray-400" />
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingAvatar}
                        className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-pink-500 hover:bg-pink-600 text-white flex items-center justify-center shadow-md transition-all active:scale-90 disabled:opacity-50"
                        title="Upload Photo"
                      >
                        <Camera className="w-3 h-3" />
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                        Profile Photo <span className="text-gray-400 font-normal">(optional)</span>
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        Automatic square crop &amp; optimization
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingAvatar}
                          className="flex items-center gap-1 text-[11px] font-bold text-pink-600 dark:text-pink-400 hover:underline disabled:opacity-50"
                        >
                          <Upload className="w-3 h-3" />
                          {formData.avatar ? 'Change photo' : 'Upload photo'}
                        </button>
                        {formData.avatar && (
                          <button
                            type="button"
                            onClick={removeAvatar}
                            className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:underline"
                          >
                            <Trash2 className="w-3 h-3" /> Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Full Name <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => updateForm('name', e.target.value)}
                        placeholder="e.g. Sarah Lin or Alex Rivera"
                        className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* Role & Company Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Role / Title
                      </label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.role}
                          onChange={(e) => updateForm('role', e.target.value)}
                          placeholder="CTO / Founder"
                          className="w-full pl-9 pr-2 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                        Company / Org
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => updateForm('company', e.target.value)}
                          placeholder="Tech Labs Inc"
                          className="w-full pl-9 pr-2 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Project Name */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Project Delivered <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.project_name}
                      onChange={(e) => updateForm('project_name', e.target.value)}
                      placeholder="e.g. AI Workflow Platform or Mobile App"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400"
                    />
                  </div>

                  {/* Rating Selector */}
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Overall Rating <span className="text-pink-500">*</span>
                    </label>
                    <StarRatingInput
                      rating={formData.rating}
                      onChange={(r) => updateForm('rating', r)}
                      playClick={playClick}
                    />
                  </div>

                  {/* Feedback Textarea */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Your Feedback &amp; Endorsement <span className="text-pink-500">*</span>
                      </label>
                      <span
                        className={`text-[10px] font-bold ${
                          charCount < 20 ? 'text-amber-500' : 'text-emerald-500'
                        }`}
                      >
                        {charCount} / 20 min characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      required
                      minLength={20}
                      value={formData.text}
                      onChange={(e) => {
                        updateForm('text', e.target.value);
                        setCharCount(e.target.value.trim().length);
                      }}
                      placeholder="Describe what stood out about working together — technical skill, responsiveness, architecture quality, and value delivered..."
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-pink-500 placeholder-gray-400 resize-none leading-relaxed"
                    />
                  </div>
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-900/70 flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 px-3 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 min-h-[40px]"
                >
                  Cancel
                </button>
                <motion.button
                  form="client-review-form"
                  type="submit"
                  disabled={isSubmitting || isUploadingAvatar || charCount < 20}
                  whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-[2] py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 shadow-md shadow-pink-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 min-h-[40px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Submitting Feedback...</span>
                    </>
                  ) : isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Optimizing Photo...</span>
                    </>
                  ) : (
                    <>
                      <MessageSquareHeart className="w-3.5 h-3.5" />
                      <span>Submit Real Review</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default Testimonials;
