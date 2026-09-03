import React, { useState, useEffect } from 'react';
import { scrollToSection as scrollToSectionLib } from '@/lib/scrollTo';
import { motion } from 'framer-motion';
import {
  ArrowUp,
  Globe,
  Clock,
  Mail,
  Terminal,
} from 'lucide-react';
import { FaGithub, FaLinkedin, FaWhatsapp } from 'react-icons/fa';
import { usePortfolio } from '../context/PortfolioContext';
import { useSound } from '../context/SoundContext';
import { EASE_OUT } from '../lib/motion';

interface FooterProps {
  onOpenTerminal?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onOpenTerminal }) => {
  const { profile } = usePortfolio();
  const { playClick, playHover, playWhoosh, vibrate } = useSound();

  const [pktTime, setPktTime] = useState('');
  const [visitorTime, setVisitorTime] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);

  // Live clocks for Visitor & Ahmad (Islamabad/PKT UTC+5)
  useEffect(() => {
    const updateClocks = () => {
      const now = new Date();
      setPktTime(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Asia/Karachi',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
      setVisitorTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };

    updateClocks();
    const interval = setInterval(updateClocks, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scroll Progress Ring Calculation
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress(Math.min((window.scrollY / totalScroll) * 100, 100));
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    vibrate(15);
    playWhoosh();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    vibrate(12);
    playClick();
    // Shared util: document-absolute offset, correct --nav-offset clearance,
    // and it works for sections that have not been lazily mounted yet.
    scrollToSectionLib(id, { updateHash: true });
  };

  const email = profile?.email || 'Ahmadrajpootr1@gmail.com';
  const whatsapp = profile?.whatsapp || 'https://wa.me/923314815161';
  const linkedin = profile?.linkedin || 'https://www.linkedin.com/in/muhammad-ahmad-565206291/';
  const github = profile?.github || 'https://github.com/code-its-Ahmad';

  const quickLinks = [
    { label: 'Home', id: 'home' },
    { label: 'About Story', id: 'about' },
    { label: 'Projects Showcase', id: 'projects' },
    { label: 'Skill Matrix', id: 'skills' },
    { label: 'Services & Pricing', id: 'services' },
    { label: 'Career Roadmap', id: 'experience' },
    { label: 'Certifications', id: 'certificates' },
    { label: 'Contact', id: 'contact' },
  ];

  return (
    <footer className="relative bg-gray-950 text-white border-t border-gray-800/80 pt-16 pb-24 lg:pb-16 overflow-hidden select-none">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 opacity-[0.04] pointer-events-none bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:3rem_3rem]" />

      {/* Floating Ambient Glow Orbs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Top Info & Timezone Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10 border-b border-gray-800/80"
        >
          {/* Brand & Status */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6 }}
                className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center font-extrabold text-sm shadow-lg shadow-blue-500/25 border border-white/20 cursor-pointer"
              >
                MA
              </motion.div>
              <div>
                <h3 className="text-base font-extrabold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Muhammad Ahmad
                </h3>
                <p className="text-xs text-gray-400 font-mono">
                  Full Stack & AI Engineer
                </p>
              </div>
            </div>

            {/* Live Availability Beacon */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Available for Worldwide Contracts & Roles</span>
            </div>
          </div>

          {/* Dual Live Clocks */}
          <div className="p-4 rounded-2xl bg-gray-900/60 border border-gray-800/80 space-y-2 backdrop-blur-md">
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono pb-1 border-b border-gray-800">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Clock className="w-3.5 h-3.5" />
                Ahmad (Islamabad / PKT UTC+5):
              </span>
              <span className="text-white font-bold">{pktTime || 'Loading...'}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400 font-mono">
              <span className="flex items-center gap-1.5 text-purple-400">
                <Globe className="w-3.5 h-3.5" />
                Your Local Time:
              </span>
              <span className="text-gray-300 font-semibold">{visitorTime || 'Loading...'}</span>
            </div>
          </div>

          {/* Quick Actions & Terminal Trigger */}
          <div className="flex flex-col justify-center space-y-2.5">
            {onOpenTerminal && (
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  vibrate(12);
                  playClick();
                  onOpenTerminal();
                }}
                onMouseEnter={playHover}
                className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:text-white text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all shadow-sm shadow-cyan-500/10"
              >
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Launch Cyber Terminal HUD</span>
              </motion.button>
            )}

            <div className="flex items-center justify-between gap-2">
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={playHover}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <FaWhatsapp className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                href={`mailto:${email}`}
                onMouseEnter={playHover}
                className="flex-1 py-2 px-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </motion.a>
            </div>
          </div>
        </motion.div>

        {/* Middle Navigation & Social Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
          className="grid grid-cols-1 md:grid-cols-4 gap-8"
        >
          {/* Quick Nav Links */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
              Quick Navigation
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {quickLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollToSection(link.id)}
                  onMouseEnter={playHover}
                  className="text-left text-xs text-gray-400 hover:text-cyan-400 transition-colors py-1 truncate hover:translate-x-1 duration-200"
                >
                  → {link.label}
                </button>
              ))}
            </div>
          </div>

          {/* Social Matrix */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">
              Connect & Code
            </h4>
            <div className="flex flex-wrap gap-2">
              <motion.a
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href={github}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={playHover}
                className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-600 text-gray-300 hover:text-white transition-all shadow-sm"
                title="GitHub"
              >
                <FaGithub className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href={linkedin}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={playHover}
                className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-blue-500/50 text-gray-300 hover:text-blue-400 transition-all shadow-sm"
                title="LinkedIn"
              >
                <FaLinkedin className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href={whatsapp}
                target="_blank"
                rel="noreferrer"
                onMouseEnter={playHover}
                className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-emerald-500/50 text-gray-300 hover:text-emerald-400 transition-all shadow-sm"
                title="WhatsApp Direct"
              >
                <FaWhatsapp className="w-4 h-4" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.12, y: -2 }}
                whileTap={{ scale: 0.9 }}
                href={`mailto:${email}`}
                onMouseEnter={playHover}
                className="p-2.5 rounded-xl bg-gray-900 border border-gray-800 hover:border-cyan-500/50 text-gray-300 hover:text-cyan-400 transition-all shadow-sm"
                title="Email Direct"
              >
                <Mail className="w-4 h-4" />
              </motion.a>
            </div>
          </div>

          {/* Scroll To Top Ring Action with bounce */}
          <div className="flex flex-col items-start md:items-end justify-center space-y-2">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={scrollToTop}
              onMouseEnter={playHover}
              className="group relative flex items-center gap-3 p-2.5 rounded-2xl bg-gray-900/80 hover:bg-gray-800 border border-gray-800 hover:border-cyan-500/40 text-xs font-semibold text-gray-300 hover:text-white transition-all shadow-sm"
            >
              {/* Circular SVG Progress Meter */}
              <div className="relative w-8 h-8 flex items-center justify-center">
                <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-800"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-cyan-400 transition-all duration-150"
                    strokeDasharray={`${scrollProgress}, 100`}
                    strokeWidth="3"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <ArrowUp className="w-3.5 h-3.5 absolute text-cyan-400 group-hover:-translate-y-1 transition-transform" />
              </div>
              <span className="font-mono text-[11px] pr-1">Back to Top</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Bottom Copyright & Tech Stack Badge */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pt-8 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 font-mono"
        >
          <p>© {new Date().getFullYear()} Muhammad Ahmad. Engineered for Zero-Lag Excellence.</p>
          <div className="flex items-center space-x-2 text-[11px] text-gray-400">
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
              React 19
            </span>
            <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              Three.js
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
              Tailwind
            </span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;
