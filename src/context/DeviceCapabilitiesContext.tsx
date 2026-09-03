import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  applyCapabilitiesToDocument,
  detectCapabilities,
  SSR_CAPABILITIES,
  type DeviceCapabilities,
} from '@/lib/deviceTier';

const DeviceCapabilitiesContext = createContext<DeviceCapabilities>(SSR_CAPABILITIES);

/**
 * Detection is done during module evaluation of the provider's first render so
 * the very first paint already has the correct tier. Re-detected on
 * orientation / viewport changes because rotating a phone changes the
 * shortest-side signal and, on foldables, the actual device class.
 */
export const DeviceCapabilitiesProvider = ({ children }: { children: ReactNode }) => {
  const [caps, setCaps] = useState<DeviceCapabilities>(() => {
    const initial = detectCapabilities();
    applyCapabilitiesToDocument(initial);
    return initial;
  });

  useEffect(() => {
    let frame = 0;

    const recheck = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const next = detectCapabilities();
        setCaps((prev) => {
          // Only re-render when something meaningful actually changed.
          if (
            prev.tier === next.tier &&
            prev.reducedMotion === next.reducedMotion &&
            prev.isTouch === next.isTouch &&
            prev.saveData === next.saveData
          ) {
            return prev;
          }
          applyCapabilitiesToDocument(next);
          return next;
        });
      });
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    motionQuery.addEventListener('change', recheck);
    window.addEventListener('orientationchange', recheck);
    window.addEventListener('resize', recheck, { passive: true });

    return () => {
      cancelAnimationFrame(frame);
      motionQuery.removeEventListener('change', recheck);
      window.removeEventListener('orientationchange', recheck);
      window.removeEventListener('resize', recheck);
    };
  }, []);

  return (
    <DeviceCapabilitiesContext.Provider value={caps}>{children}</DeviceCapabilitiesContext.Provider>
  );
};

/** Read the current device tier and capability flags. */
export const useDeviceCapabilities = (): DeviceCapabilities =>
  useContext(DeviceCapabilitiesContext);

/**
 * Convenience selector for the extremely common "should this heavy visual
 * mount at all?" question.
 */
export const useCanRender3D = (): boolean => {
  const { enable3D } = useDeviceCapabilities();
  return enable3D;
};

/** Motion duration scaler — collapses animation to near-zero on low tier. */
export const useMotionScale = (): number => {
  const { tier, reducedMotion } = useDeviceCapabilities();
  return useMemo(() => {
    if (reducedMotion) return 0;
    if (tier === 'low') return 0.6;
    return 1;
  }, [tier, reducedMotion]);
};
