import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowRight, Home, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/services';
import { useSound } from '../context/SoundContext';
import toast from 'react-hot-toast';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  /**
   * `null` while the check is in flight. When the database has no owner yet the
   * screen turns into a one-time setup form — this is the only way the very
   * first administrator account can ever be created, and the server function
   * refuses to run once an owner exists.
   */
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);
  const { login } = useAuth();
  const { playClick, playSuccess } = useSound();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    authAPI
      .needsSetup()
      .then((value) => {
        if (active) setNeedsSetup(value);
      })
      .catch(() => {
        if (active) setNeedsSetup(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    if (needsSetup) {
      if (!name.trim()) {
        toast.error('Please enter your name');
        return;
      }
      if (password.length < 8) {
        toast.error('Use at least 8 characters for the owner password');
        return;
      }
    }

    try {
      setIsLoading(true);
      playClick();
      if (needsSetup) {
        await authAPI.createOwner(name.trim(), email.trim(), password);
        setNeedsSetup(false);
      }
      await login(email.trim(), password);
      playSuccess();
      toast.success('Welcome back!');
      navigate('/admin');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid credentials.';
      toast.error(message);

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-950 via-slate-900 to-gray-900 text-white relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      <motion.div
        className="relative w-full max-w-md bg-gray-900/80 backdrop-blur-2xl p-8 rounded-3xl border border-gray-800 shadow-2xl space-y-6"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/25 mb-2">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Admin Suite
          </h1>
          <p className="text-xs text-gray-400">
            {needsSetup
              ? 'Create the one-time owner account for this portfolio'
              : 'Muhammad Ahmad Portfolio Control Center'}
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {needsSetup && (
            <div>
              <label htmlFor="admin-name" className="block text-xs font-semibold text-gray-300 mb-1.5">
                Your Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="admin-name"
                  type="text"
                  required
                  maxLength={80}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Muhammad Ahmad"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="admin-email" className="block text-xs font-semibold text-gray-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                maxLength={255}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@muhammadahmad.com"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="admin-password" className="block text-xs font-semibold text-gray-300 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={needsSetup ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-800/80 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || needsSetup === null}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <span>
              {needsSetup === null
                ? 'Checking...'
                : isLoading
                  ? needsSetup
                    ? 'Creating owner account...'
                    : 'Authenticating...'
                  : needsSetup
                    ? 'Create Owner Account'
                    : 'Sign In to Admin Hub'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Footer navigation */}
        <div className="pt-2 border-t border-gray-800 flex flex-col items-center gap-3">
          <Link
            to="/"
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return to Portfolio</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
