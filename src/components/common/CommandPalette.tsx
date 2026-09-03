import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Home,
  User,
  Briefcase,
  Code,
  Folder,
  Award,
  MessageSquare,
  Download,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  ShieldAlert,
  ExternalLink,
  X,
  Sparkles,
  Bot,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useSound } from '../../context/SoundContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { useAuth } from '../../context/AuthContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { isMuted, toggleMute, playHover, playClick, playWhoosh } = useSound();
  const { projects, profile } = usePortfolio();
  const { isAuthenticated } = useAuth();

  // Keyboard shortcut listener for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or custom event
          const event = new CustomEvent('open-command-palette');
          window.dispatchEvent(event);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const scrollTo = (id: string) => {
    playWhoosh();
    onClose();
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        el?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    } else {
      const el = document.getElementById(id);
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const downloadCV = () => {
    playClick();
    onClose();
    window.open(
      profile?.resume_url || 'https://drive.google.com/file/d/1LEb7Scv_BQzuClhKMqYnNDqrOdwfnJI0/view?usp=sharing',
      '_blank'
    );
  };

  // Commands list
  const baseCommands = [
    { id: 'home', title: 'Home', subtitle: 'Back to top overview', icon: Home, action: () => scrollTo('home'), category: 'Navigation' },
    { id: 'about', title: 'About Me', subtitle: 'Story, tech stack & milestones', icon: User, action: () => scrollTo('about'), category: 'Navigation' },
    { id: 'projects', title: 'Featured Projects', subtitle: 'Interactive case studies & 3D apps', icon: Folder, action: () => scrollTo('projects'), category: 'Navigation' },
    { id: 'skills', title: 'Skills & Tech Stack', subtitle: 'Frontend, Backend, AI/ML & DevOps', icon: Code, action: () => scrollTo('skills'), category: 'Navigation' },
    { id: 'experience', title: 'Experience & Timeline', subtitle: 'Work history & career milestones', icon: Briefcase, action: () => scrollTo('experience'), category: 'Navigation' },
    { id: 'services', title: 'Services & Estimator', subtitle: 'Offerings & interactive quote estimator', icon: Sparkles, action: () => scrollTo('services'), category: 'Navigation' },
    { id: 'certificates', title: 'Certificates & Credentials', subtitle: 'Meta, Stanford, AWS, Google verifications', icon: Award, action: () => scrollTo('certificates'), category: 'Navigation' },
    { id: 'contact', title: 'Contact & Inquiries', subtitle: 'WhatsApp, Email, Direct inquiry form', icon: MessageSquare, action: () => scrollTo('contact'), category: 'Navigation' },
    {
      id: 'chatbot',
      title: 'Chat with 3D AI Assistant',
      subtitle: 'Ask about skills, projects, rates, or book a project inquiry',
      icon: Bot,
      action: () => {
        playClick();
        onClose();
        window.dispatchEvent(new CustomEvent('open-chatbot'));
      },
      category: 'Actions',
    },
    { id: 'cv', title: 'Download Resume / CV', subtitle: 'Get latest PDF document', icon: Download, action: downloadCV, category: 'Actions' },
    {
      id: 'theme',
      title: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
      subtitle: 'Toggle global visual theme',
      icon: theme === 'dark' ? Sun : Moon,
      action: () => {
        playClick();
        toggleTheme();
        onClose();
      },
      category: 'Actions',
    },
    {
      id: 'sound',
      title: isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects',
      subtitle: 'Toggle interactive UI audio',
      icon: isMuted ? Volume2 : VolumeX,
      action: () => {
        toggleMute();
        onClose();
      },
      category: 'Actions',
    },
    ...(isAuthenticated
      ? [
          {
            id: 'admin',
            title: 'Admin Control Panel',
            subtitle: 'Full portfolio management & inquiries inbox',
            icon: ShieldAlert,
            action: () => {
              playClick();
              onClose();
              navigate('/admin');
            },
            category: 'Admin',
          },
        ]
      : []),
  ];

  // Dynamic project search items
  const projectCommands = projects.map((p) => ({
    id: `project-${p.id}`,
    title: p.title,
    subtitle: `${p.category} — ${p.short_description.slice(0, 60)}...`,
    icon: Folder,
    action: () => {
      scrollTo('projects');
    },
    category: 'Projects',
  }));

  const allItems = [...baseCommands, ...projectCommands];

  const filteredItems = query.trim()
    ? allItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : baseCommands;

  // Handle arrow key selection
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      playHover();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      playHover();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            className="relative w-full max-w-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden z-10"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-gray-200 dark:border-gray-800">
              <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search projects, skills, sections, or actions (e.g., 'AI', 'React', 'CV')..."
                className="w-full bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-base focus:outline-none"
              />
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
              {filteredItems.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <Search className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No commands or projects match "{query}"</p>
                </div>
              ) : (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  const isSelected = index === selectedIndex;
                  return (
                    <motion.div
                      key={item.id}
                      onClick={() => item.action()}
                      onMouseEnter={() => {
                        setSelectedIndex(index);
                        playHover();
                      }}
                      className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800/60 text-gray-800 dark:text-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-100 dark:bg-gray-800 text-blue-500 dark:text-blue-400'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-sm truncate">{item.title}</div>
                          <div
                            className={`text-xs truncate ${
                              isSelected ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {item.subtitle}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                          isSelected
                            ? 'bg-white/20 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        }`}
                      >
                        {item.category}
                      </span>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer Shortcut Hints */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 dark:bg-gray-950/60 border-t border-gray-200 dark:border-gray-800 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-3">
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 font-mono text-[10px]">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 font-mono text-[10px] ml-1">↓</kbd> Navigate
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 font-mono text-[10px]">Enter</kbd> Select
                </span>
                <span>
                  <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-800 font-mono text-[10px]">Esc</kbd> Close
                </span>
              </div>
              <div className="text-[11px] font-medium text-blue-500 dark:text-blue-400">
                Muhammad Ahmad Portfolio
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
