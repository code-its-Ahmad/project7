import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, ShieldCheck, UserCircle2, Users } from 'lucide-react';
import { adminUsersAPI, type AdminDirectoryUser } from '../../api/services';

/**
 * Read-only account directory.
 *
 * The CMS is deliberately single-owner: this screen exists so the owner can see
 * which accounts exist and which one carries the admin role, but no promotion
 * or deletion is possible from the browser.
 */
const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

const UserManager: React.FC = () => {
  const [users, setUsers] = useState<AdminDirectoryUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await adminUsersAPI.list();
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">Users</h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Every account with access to this project.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-xs font-bold disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="p-5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <div className="text-sm font-bold text-red-700 dark:text-red-300">
              Could not load accounts
            </div>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
          </div>
        </div>
      )}

      {!isLoading && !error && users.length === 0 && (
        <div className="p-10 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 text-center">
          <Users className="w-8 h-8 mx-auto text-gray-400" />
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 mt-3">
            No accounts yet
          </p>
        </div>
      )}

      {!isLoading && !error && users.length > 0 && (
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={`${user.name || user.email} avatar`}
                  className="w-12 h-12 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                  <UserCircle2 className="w-6 h-6 text-gray-400" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                    {user.name || 'Unnamed account'}
                  </span>
                  {user.is_you && (
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-[10px] font-bold">
                      You
                    </span>
                  )}
                  {user.roles.includes('admin') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold">
                      <ShieldCheck className="w-3 h-3" />
                      Owner
                    </span>
                  )}
                  {!user.email_confirmed && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-300 text-[10px] font-bold">
                      Email unconfirmed
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 break-all mt-0.5">
                  {user.email}
                </div>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 sm:text-right shrink-0 space-y-0.5">
                <div>Joined {formatDate(user.created_at)}</div>
                <div>Last sign-in {formatDate(user.last_sign_in_at)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        This CMS is single-owner by design — accounts cannot be created or promoted from here.
      </p>
    </motion.div>
  );
};

export default UserManager;
