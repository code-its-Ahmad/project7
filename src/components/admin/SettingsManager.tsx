import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  User,
  Mail,
  Phone,
  Globe,
  Lock,
  FileText,
  Sparkles,
  CheckCircle,
  KeyRound,
  Shield,
  Upload,
} from 'lucide-react';
import { portfolioAPI, authAPI, uploadAPI, Profile } from '../../api/services';
import { usePortfolio } from '../../context/PortfolioContext';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';
import toast from 'react-hot-toast';

const SettingsManager: React.FC = () => {
  const { profile, refetch } = usePortfolio();
  const { user, updateUser } = useAuth();
  const { playClick, playSuccess } = useSound();

  const [formData, setFormData] = useState<Partial<Profile>>({
    name: '',
    titles: [],
    tagline: '',
    bio: '',
    about_story: '',
    about_philosophy: '',
    location: '',
    email: '',
    phone: '',
    whatsapp: '',
    github: '',
    linkedin: '',
    twitter: '',
    discord: '',
    resume_url: '',
    avatar_url: '/assets/profile.png',
    available_for_hire: true,
    years_experience: '3+',
    happy_clients: '100+',
    projects_completed: '50+',
    satisfaction_rate: '99%',
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
  });

  const [titlesInput, setTitlesInput] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Security Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Admin Profile
  const [adminName, setAdminName] = useState(user?.name || '');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');

  useEffect(() => {
    if (profile) {
      setFormData({ ...profile });
      setTitlesInput(profile.titles?.join(', ') || '');
    }
  }, [profile]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const titlesArray = titlesInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await portfolioAPI.updateProfile({
        ...formData,
        titles: titlesArray,
      });

      playSuccess();
      toast.success('Portfolio profile & SEO settings updated successfully!');
      refetch();
    } catch (err: any) {
      toast.error('Failed to update profile settings.');
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingResume(true);
      const res = await uploadAPI.uploadFile(file);
      setFormData((prev) => ({ ...prev, resume_url: res.url }));
      toast.success('Resume PDF uploaded and linked!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to upload resume.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const res = await uploadAPI.uploadFile(file);
      setFormData((prev) => ({ ...prev, avatar_url: res.url }));
      toast.success('Avatar image uploaded!');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to upload avatar image.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      await authAPI.changePassword(currentPassword, newPassword);
      playSuccess();
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to change password.');
    }
  };

  const handleAdminProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authAPI.updateProfile(adminName, adminEmail);
      if (user) {
        updateUser({ ...user, name: adminName, email: adminEmail });
      }
      playSuccess();
      toast.success('Admin user profile updated!');
    } catch (err: any) {
      toast.error('Failed to update admin user.');
    }
  };

  return (
    <div className="space-y-10 max-w-5xl">
      {/* 1. Main Profile & Bio Section */}
      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-gray-800 pb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Profile, Bio & Socials</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Update personal identity, titles, contact coordinates, and highlights displayed across the portfolio.
            </p>
          </div>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-500/20 transition-all self-start sm:self-auto"
          >
            <Save className="w-4 h-4" />
            <span>Save Profile Settings</span>
          </button>
        </div>

        {/* Identity & Titles */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-blue-500" />
            <span>Primary Identity</span>
          </h3>

          {/* Avatar / Profile Photo Preview & Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700/60">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-tr from-blue-600 to-purple-600 border-2 border-white dark:border-gray-700 shadow-md shrink-0">
              <img
                src={formData.avatar_url || '/assets/profile.png'}
                alt="Profile Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/profile.png';
                }}
              />
            </div>
            <div className="flex-1 space-y-1.5 text-center sm:text-left">
              <div className="font-semibold text-xs text-gray-900 dark:text-white">
                Developer Portrait / Avatar
              </div>
              <div className="text-[11px] text-gray-500 dark:text-gray-400">
                Shown across hero, about section, and chatbot headers.
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingAvatar ? 'Uploading...' : 'Upload Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    className="hidden"
                  />
                </label>
                {formData.avatar_url && (
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, avatar_url: '/assets/profile.png' })}
                    className="px-2.5 py-1.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs hover:bg-gray-300 transition-colors"
                  >
                    Reset Default
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Full Name *
              </label>
              <input aria-label="Full Name"
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Location / City
              </label>
              <input aria-label="Location / City"
                type="text"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Lahore, Pakistan"
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Rotating Hero Roles (Comma separated)
            </label>
            <input aria-label="Rotating Hero Roles (Comma separated)"
              type="text"
              value={titlesInput}
              onChange={(e) => setTitlesInput(e.target.value)}
              placeholder="Full Stack Developer, AI/ML Engineer, Mobile Architect, DevOps Engineer"
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Hero Tagline / Subtitle
            </label>
            <textarea aria-label="Hero Tagline / Subtitle"
              rows={2}
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              About Story & Background (About Section)
            </label>
            <textarea aria-label="About Story & Background (About Section)"
              rows={3}
              value={formData.about_story || ''}
              onChange={(e) => setFormData({ ...formData, about_story: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Engineering Philosophy & Principles
            </label>
            <textarea aria-label="Engineering Philosophy & Principles"
              rows={2}
              value={formData.about_philosophy || ''}
              onChange={(e) => setFormData({ ...formData, about_philosophy: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Highlight Metrics */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Key Metrics & Availability</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Years Experience
              </label>
              <input aria-label="Years Experience"
                type="text"
                value={formData.years_experience || ''}
                onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Happy Clients
              </label>
              <input aria-label="Happy Clients"
                type="text"
                value={formData.happy_clients || ''}
                onChange={(e) => setFormData({ ...formData, happy_clients: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Completed Projects
              </label>
              <input aria-label="Completed Projects"
                type="text"
                value={formData.projects_completed || ''}
                onChange={(e) => setFormData({ ...formData, projects_completed: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-center font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Satisfaction Rate
              </label>
              <input aria-label="Satisfaction Rate"
                type="text"
                value={formData.satisfaction_rate || ''}
                onChange={(e) => setFormData({ ...formData, satisfaction_rate: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white text-center font-bold text-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData.available_for_hire)}
                onChange={(e) => setFormData({ ...formData, available_for_hire: e.target.checked })}
                className="w-4 h-4 text-emerald-500 rounded"
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                Display "Available for Freelance & Full-time Opportunities" Badge
              </span>
            </label>
          </div>
        </div>

        {/* Contact Links & Resume */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <span>Social Links & Resume / CV Link</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <input aria-label="Email Address"
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                WhatsApp Link / Number
              </label>
              <input aria-label="WhatsApp Link / Number"
                type="text"
                value={formData.whatsapp || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                GitHub Profile URL
              </label>
              <input aria-label="GitHub Profile URL"
                type="text"
                value={formData.github || ''}
                onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                LinkedIn Profile URL
              </label>
              <input aria-label="LinkedIn Profile URL"
                type="text"
                value={formData.linkedin || ''}
                onChange={(e) => setFormData({ ...formData, linkedin: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Resume / CV Link or Upload PDF
            </label>
            <div className="flex items-center gap-3">
              <input aria-label="Resume / CV Link or Upload PDF"
                type="text"
                value={formData.resume_url || ''}
                onChange={(e) => setFormData({ ...formData, resume_url: e.target.value })}
                placeholder="Google Drive link or /uploads/resume.pdf"
                className="flex-1 px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              />
              <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-xs font-semibold cursor-pointer border border-gray-200 dark:border-gray-700">
                <Upload className="w-4 h-4" />
                <span>{isUploadingResume ? 'Uploading...' : 'Upload PDF'}</span>
                <input type="file" accept=".pdf" onChange={handleResumeUpload} className="hidden" />
              </label>
            </div>
          </div>
        </div>

        {/* SEO Meta Tags */}
        <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-emerald-500" />
            <span>SEO & OpenGraph Configuration</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Page Meta Title
            </label>
            <input aria-label="Page Meta Title"
              type="text"
              value={formData.meta_title || ''}
              onChange={(e) => setFormData({ ...formData, meta_title: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Meta Description
            </label>
            <textarea aria-label="Meta Description"
              rows={2}
              value={formData.meta_description || ''}
              onChange={(e) => setFormData({ ...formData, meta_description: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Meta Keywords (Comma separated)
            </label>
            <input aria-label="Meta Keywords (Comma separated)"
              type="text"
              value={formData.meta_keywords || ''}
              onChange={(e) => setFormData({ ...formData, meta_keywords: e.target.value })}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/25 transition-all"
        >
          Save All Portfolio & SEO Changes
        </button>
      </form>

      {/* 2. Admin Security & Credentials Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200 dark:border-gray-800">
        {/* Change Password */}
        <form onSubmit={handlePasswordChange} className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-red-500" />
            <span>Change Admin Password</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Current Password *
            </label>
            <input aria-label="Current Password"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              New Password *
            </label>
            <input aria-label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password *
            </label>
            <input aria-label="Confirm New Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-red-500/20 transition-all"
          >
            Update Admin Password
          </button>
        </form>

        {/* Update Admin Email & Name */}
        <form onSubmit={handleAdminProfileUpdate} className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <span>Admin User Credentials</span>
          </h3>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Admin Name
            </label>
            <input aria-label="Admin Name"
              type="text"
              required
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Admin Login Email
            </label>
            <input aria-label="Admin Login Email"
              type="email"
              required
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-xs text-gray-500">
            Current Role: <span className="font-bold text-blue-500">Super Administrator</span>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-purple-500/20 transition-all"
          >
            Update Admin Profile
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsManager;
