import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { authAPI, type AdminUser } from '../api/services';

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AdminUser) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication is owned entirely by Lovable Cloud.
 *
 * The browser never decides who is an admin: `authAPI.isOwner` reads the
 * `user_roles` table, and every write policy in the database re-checks the
 * same role server-side. This context only mirrors that state into the UI.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /** Resolve the signed-in user into an owner profile, or clear the session. */
  const resolveOwner = useCallback(
    async (userId: string, email: string, name?: string, avatarUrl?: string) => {
      const isOwner = await authAPI.isOwner(userId);
      if (!isOwner) {
        setUser(null);
        return;
      }
      setUser({
        id: userId,
        email,
        name: name ?? 'Site Owner',
        role: 'admin',
        avatar_url: avatarUrl ?? '',
      });
    },
    [],
  );

  useEffect(() => {
    let active = true;

    // Registered before the initial check so no auth event is missed.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (!session?.user) {
        setUser(null);
        setIsLoading(false);
        return;
      }
      // Never call other Supabase APIs inside the callback — defer it.
      const { id, email, user_metadata } = session.user;
      setTimeout(() => {
        if (!active) return;
        void resolveOwner(
          id,
          email ?? '',
          user_metadata?.name as string | undefined,
          user_metadata?.avatar_url as string | undefined,
        ).finally(() => {
          if (active) setIsLoading(false);
        });
      }, 0);
    });

    // getUser() re-validates the token with the auth server, unlike getSession().
    supabase.auth
      .getUser()
      .then(({ data, error }) => {
        if (!active) return;
        if (error || !data.user) {
          setUser(null);
          setIsLoading(false);
          return;
        }
        return resolveOwner(
          data.user.id,
          data.user.email ?? '',
          data.user.user_metadata?.name as string | undefined,
        ).finally(() => {
          if (active) setIsLoading(false);
        });
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [resolveOwner]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authAPI.login(email, password);
    setUser(res.user);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await authAPI.logout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updated: AdminUser) => {
    setUser(updated);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
