import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, KeyRound, Loader2, Mail, Save, Shield, Trash2, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI, uploadAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useSound } from '../../context/SoundContext';

/**
 * Account screen for the signed-in owner.
 *
 * Everything here writes to the real auth user (name and avatar live in user
 * metadata, e-mail and password go through the auth server) — this is the
 * admin's own identity, separate from the public "Profile & SEO" content that
 * the portfolio renders.
 */
const AdminProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { playClick, playSuccess } = useSound();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setName(user.name ?? '');
    setEmail(user.email ?? '');
    setAvatarUrl(user.avatar_url ?? '');
  }, [user]);

  const initials =
    (name || user?.email || 'A')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'A';

  const handleAvatarPick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }

    try {
      setIsUploading(true);
      const { url } = await uploadAPI.uploadFile(file);
      const { user: updated } = await authAPI.updateAccount({ avatar_url: url });
      setAvatarUrl(url);
      updateUser(updated);
      playSuccess();
      toast.success('Avatar updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not upload that image.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      const { user: updated } = await authAPI.updateAccount({ avatar_url: '' });
      setAvatarUrl('');
      updateUser(updated);
      toast.success('Avatar removed.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not remove the avatar.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleIdentitySubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      toast.error('Name cannot be empty.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    try {
      setIsSavingIdentity(true);
      playClick();
      const emailChanged = trimmedEmail !== (user?.email ?? '').toLowerCase();
      const { user: updated } = await authAPI.updateAccount({
        name: trimmedName,
        email: trimmedEmail,
      });
      updateUser(updated);
      playSuccess();
      toast.success(
        emailChanged
          ? 'Saved. Check your new inbox to confirm the address before using it to sign in.'
          : 'Account details updated.',
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your account details.');
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handlePasswordSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    try {
      setIsSavingPassword(true);
      playClick();
      await authAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      playSuccess();
      toast.success('Password updated.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update your password.');
    } finally {
      setIsSavingPassword(false);
    }
  };

  const inputClass =
    'w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelClass = 'block text-xs font-semibold text-gray-600 dark:text-gray-300 mb-1.5';
  const cardClass =
    'p-5 sm:p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-3xl"
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">My Account</h1>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
          Your sign-in identity for the admin suite.
        </p>
      </div>

      {/* Avatar */}
      <section className={cardClass}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <div className="relative shrink-0 mx-auto sm:mx-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Your admin avatar"
                className="w-24 h-24 rounded-2xl object-cover border border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-black">
                {initials}
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {name || 'Site Owner'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 break-all">{email}</div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                {avatarUrl ? 'Change avatar' : 'Upload avatar'}
              </button>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarPick}
              className="hidden"
            />
          </div>
        </div>
      </section>

      {/* Identity */}
      <form onSubmit={handleIdentitySubmit} className={`${cardClass} space-y-4`}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <User className="w-4 h-4 text-blue-500" />
          Name &amp; Email
        </h2>

        <div>
          <label htmlFor="account-name" className={labelClass}>
            Display name
          </label>
          <input aria-label="Display name"
            id="account-name"
            type="text"
            value={name}
            maxLength={80}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="account-email" className={labelClass}>
            Sign-in email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input aria-label="Sign-in email"
              id="account-email"
              type="email"
              value={email}
              maxLength={255}
              autoComplete="email"
              onChange={(e) => setEmail(e.target.value)}
              className={`${inputClass} pl-10`}
            />
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
            Changing this sends a confirmation link to the new address. Keep using the old email
            until it is confirmed.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSavingIdentity}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-bold disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {isSavingIdentity ? 'Saving...' : 'Save changes'}
        </button>
      </form>

      {/* Password */}
      <form onSubmit={handlePasswordSubmit} className={`${cardClass} space-y-4`}>
        <h2 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <KeyRound className="w-4 h-4 text-purple-500" />
          Change password
        </h2>

        <div>
          <label htmlFor="account-current-password" className={labelClass}>
            Current password
          </label>
          <input aria-label="Current password"
            id="account-current-password"
            type="password"
            required
            autoComplete="current-password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="account-new-password" className={labelClass}>
              New password
            </label>
            <input aria-label="New password"
              id="account-new-password"
              type="password"
              required
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="account-confirm-password" className={labelClass}>
              Confirm new password
            </label>
            <input aria-label="Confirm new password"
              id="account-confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          Your current password is re-verified before the change is applied.
        </div>

        <button
          type="submit"
          disabled={isSavingPassword}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white dark:text-gray-900 text-white text-sm font-bold disabled:opacity-50"
        >
          <KeyRound className="w-4 h-4" />
          {isSavingPassword ? 'Updating...' : 'Update password'}
        </button>
      </form>
    </motion.div>
  );
};

export default AdminProfile;
