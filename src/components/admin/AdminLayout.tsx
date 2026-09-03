import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Code2,
  Briefcase,
  Layers,
  Award,
  MessageSquare,
  Bot,
  Settings,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Sparkles,
  Users,
  ShieldCheck,
  Bell,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  UserCog,
  CircleUser,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSound } from '../../context/SoundContext';

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  unreadCount?: number;
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  unreadCount = 0,
  children,
}) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isMuted, toggleMute, playClick, playHover } = useSound();
  const navigate = useNavigate();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'projects', label: 'Projects', icon: FolderKanban },
    { id: 'skills', label: 'Skills & Tech', icon: Code2 },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'services', label: 'Services', icon: Layers },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'testimonials', label: 'Testimonials', icon: Users },
    { id: 'messages', label: 'Inbox & Leads', icon: MessageSquare, badge: unreadCount },
    { id: 'chatbot', label: 'AI Chatbot KB', icon: Bot },
    { id: 'settings', label: 'Profile & SEO', icon: Settings },
    { id: 'users', label: 'Users', icon: UserCog },
    { id: 'account', label: 'My Account', icon: CircleUser },
  ];

  const handleLogout = () => {
    playClick();
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 flex flex-col md:flex-row transition-colors duration-300">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
            A
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            Admin Suite
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          >
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white dark:bg-gray-900/95 border-r border-gray-200 dark:border-gray-800 flex flex-col z-50 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
              MA
            </div>
            <div>
              <div className="font-bold text-base bg-gradient-to-r from-blue-500 to-purple-400 bg-clip-text text-transparent">
                Muhammad Ahmad
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Portfolio Control Hub
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playClick();
                  onTabChange(item.id);
                  setIsSidebarOpen(false);
                }}
                onMouseEnter={playHover}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25 font-semibold'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-500 dark:text-blue-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                      isActive ? 'bg-white text-blue-600' : 'bg-red-500 text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800/60">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center font-bold text-xs">
                {user?.name?.charAt(0) || 'A'}
              </div>
              <div className="truncate">
                <div className="text-xs font-semibold truncate">{user?.name || 'Administrator'}</div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* External Public Portfolio Link */}
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-xl transition-colors"
          >
            <span>View Live Portfolio</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar for Desktop */}
        <div className="hidden md:flex items-center justify-between px-8 py-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30">
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold capitalize text-gray-800 dark:text-white">
              {currentTab === 'chatbot' ? 'AI Chatbot Knowledge Base' : currentTab.replace('-', ' ')}
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20 rounded-full flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Cloud Database Connected
            </span>
          </div>

          <div className="flex items-center space-x-3">
            {/* Audio Toggle */}
            <button
              onClick={() => {
                playClick();
                toggleMute();
              }}
              title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={() => {
                playClick();
                toggleTheme();
              }}
              title="Toggle Dark / Light Theme"
              className="p-2 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 hover:text-yellow-500 dark:hover:text-yellow-400 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl shadow-md shadow-blue-500/20 transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Site</span>
            </Link>
          </div>
        </div>

        {/* Tab Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
