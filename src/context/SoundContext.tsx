import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { soundManager } from '../components/common/SoundManager';

interface SoundContextType {
  isMuted: boolean;
  toggleMute: () => void;
  playHover: () => void;
  playClick: () => void;
  playSuccess: () => void;
  playWhoosh: () => void;
  playBoot: () => void;
  playKeypress: () => void;
  playBeep: (pitch?: number) => void;
  vibrate: (pattern?: number | number[]) => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

/*
 * These eight delegates close over nothing at all — they are pure pass-throughs
 * to a module singleton. Declaring them at module scope makes their identities
 * permanently stable, which matters more than it looks:
 *
 * `SoundProvider` sits above `BrowserRouter` in the tree, so it wraps the entire
 * application. Previously the provider handed down a **fresh object literal with
 * eight fresh function identities on every render**. That invalidated every
 * `useCallback` that depended on them — all five in `Navigation`, all of
 * `CommandPalette`'s command list — so the memoisation throughout the app was
 * decorative, and a single mute toggle re-rendered every consumer.
 */
const playHover = () => soundManager.playHover();
const playClick = () => soundManager.playClick();
const playSuccess = () => soundManager.playSuccess();
const playWhoosh = () => soundManager.playWhoosh();
const playBoot = () => soundManager.playBoot();
const playKeypress = () => soundManager.playKeypress();
const playBeep = (pitch?: number) => soundManager.playBeep(pitch);
const vibrate = (pattern?: number | number[]) => soundManager.vibrate(pattern);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.getMuted());

  // Functional update so the callback needs no dependency on `isMuted`.
  const toggleMute = useCallback(() => {
    setIsMuted((previous) => {
      const next = !previous;
      soundManager.setMuted(next);
      return next;
    });
  }, []);

  const value = useMemo<SoundContextType>(
    () => ({
      isMuted,
      toggleMute,
      playHover,
      playClick,
      playSuccess,
      playWhoosh,
      playBoot,
      playKeypress,
      playBeep,
      vibrate,
    }),
    [isMuted, toggleMute]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
};

export const useSound = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
};
