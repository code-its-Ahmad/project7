import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Code2,
  MessageSquare,
  Eye,
  Download,
  Users,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { analyticsAPI } from '../../api/services';
import { usePortfolio } from '../../context/PortfolioContext';
import { useSound } from '../../context/SoundContext';

interface AdminDashboardProps {
  onNavigate: (tab: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { projects, skills, testimonials, profile } = usePortfolio();
  const { playClick, playHover } = useSound();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await analyticsAPI.getSummary();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch analytics summary:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const counts = stats?.counts || {
    projects: projects.length,
    skills: skills.length,
    testimonials: testimonials.length,
    unreadMessages: 0,
    totalMessages: 0,
    pageViews: 0,
    cvDownloads: 0,
  };

  const skillCategoryCount = new Set(skills.map((s) => s.category).filter(Boolean)).size;

  const ratedTestimonials = testimonials.filter((t) => Number(t.rating) > 0);
  const averageRating = ratedTestimonials.length
    ? ratedTestimonials.reduce((sum, t) => sum + Number(t.rating), 0) / ratedTestimonials.length
    : 0;

  const kpis = [
    {
      title: 'Total Projects',
      value: counts.projects ?? projects.length,
      change: 'Published in portfolio',
      icon: FolderKanban,
      color: 'from-blue-500 to-indigo-600',
      tab: 'projects',
    },
    {
      title: 'Skills & Tech',
      value: counts.skills ?? skills.length,
      change: skillCategoryCount
        ? `Covering ${skillCategoryCount} categor${skillCategoryCount === 1 ? 'y' : 'ies'}`
        : 'No categories yet',
      icon: Code2,
      color: 'from-purple-500 to-pink-600',
      tab: 'skills',
    },
    {
      title: 'Inquiries & Leads',
      value: counts.totalMessages ?? 0,
      subValue: counts.unreadMessages ? `${counts.unreadMessages} Unread` : 'All Read',
      icon: MessageSquare,
      color: 'from-emerald-500 to-teal-600',
      tab: 'messages',
      badge: counts.unreadMessages,
    },
    {
      title: 'Total Page Views',
      value: counts.pageViews ?? 0,
      change: 'Tracked pageview events',
      icon: Eye,
      color: 'from-amber-500 to-orange-600',
      tab: 'dashboard',
    },
    {
      title: 'CV / Resume Downloads',
      value: counts.cvDownloads ?? 0,
      change: 'Tracked download events',
      icon: Download,
      color: 'from-cyan-500 to-blue-600',
      tab: 'settings',
    },
    {
      title: 'Client Reviews',
      value: counts.testimonials ?? testimonials.length,
      change: averageRating ? `${averageRating.toFixed(1)} average rating` : 'No ratings yet',
      icon: Users,
      color: 'from-rose-500 to-red-600',
      tab: 'testimonials',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-xl shadow-blue-500/15"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Control Suite Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {profile?.name || 'Muhammad Ahmad'}!
            </h2>
            <p className="text-blue-100 text-sm max-w-xl">
              All portfolio sections are actively powered by your live cloud database. You can manage projects, update skills, moderate client reviews, and reply to client inquiries in real time.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                playClick();
                onNavigate('projects');
              }}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-semibold text-sm shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project</span>
            </button>
            <button
              onClick={() => {
                playClick();
                onNavigate('messages');
              }}
              onMouseEnter={playHover}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 text-white backdrop-blur-md rounded-xl font-semibold text-sm transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>View Inbox</span>
            </button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => {
                playClick();
                if (kpi.tab !== 'dashboard') onNavigate(kpi.tab);
              }}
              onMouseEnter={playHover}
              className="group p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  {kpi.title}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${kpi.color} text-white flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-4 flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-gray-900 dark:text-white">
                  {kpi.value}
                </span>
                {kpi.badge ? (
                  <span className="px-2.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                    {kpi.subValue}
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-500 dark:text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {kpi.change}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Two Column Layout: Top Projects & Recent Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Projects Leaderboard */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <FolderKanban className="w-5 h-5 text-blue-500" />
              <span>Projects Showcase</span>
            </h3>
            <button
              onClick={() => onNavigate('projects')}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <span>Manage All</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {projects.slice(0, 5).map((project, index) => (
              <div
                key={project.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors"
              >
                <div className="flex items-center space-x-3 overflow-hidden">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {index + 1}
                  </span>
                  <div className="truncate">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {project.title}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {project.category}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 shrink-0 text-xs font-medium text-gray-500">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-gray-400" />
                    {project.views || 0}
                  </span>
                  <span className="flex items-center gap-1 text-pink-500">
                    ♥ {project.likes || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Inquiries & Leads */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" />
              <span>Recent Inquiries</span>
            </h3>
            <button
              onClick={() => onNavigate('messages')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View Inbox</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats?.recentMessages?.length > 0 ? (
              stats.recentMessages.map((msg: any) => (
                <div
                  key={msg.id}
                  onClick={() => onNavigate('messages')}
                  className="p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">
                      {msg.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        msg.status === 'unread'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {msg.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                    {msg.subject || msg.email}
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Source: {msg.source}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                No recent inquiries yet. New submissions will appear here automatically!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
