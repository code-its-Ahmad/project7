/**
 * Device capability tiering.
 *
 * The portfolio ships several WebGL scenes, a particle canvas and a large
 * amount of spring/blur animation. On a budget Android device (the reference
 * target here is an Infinix Hot 10: Helio G70, Mali-G52 MP2, 4 GB RAM,
 * 360 x 800 CSS px) running all of that concurrently drops the page to single
 * digit frame rates and can make the browser discard WebGL contexts entirely.
 *
 * Rather than branching on screen width — which wrongly punishes small
 * flagships and wrongly rewards large cheap tablets — we score the actual
 * hardware and connection, then expose a coarse tier plus a set of concrete
 * capability flags that components can read.
 *
 * Detection runs once, synchronously, before first paint, so there is never a
 * frame where heavy effects mount and then get torn down.
 */

export type DeviceTier = 'low' | 'mid' | 'high';

export interface DeviceCapabilities {
  tier: DeviceTier;
  /** Mount Three.js / WebGL scenes at all. */
  enable3D: boolean;
  /** Run the 2D particle background. */
  enableParticles: boolean;
  /** Replace the native pointer with the animated cursor. */
  enableCustomCursor: boolean;
  /** Allow expensive backdrop-filter blurs. */
  enableHeavyBlur: boolean;
  /** Allow WebGL shadow maps. */
  enableShadows: boolean;
  /** Allow multi-canvas scenes to be alive simultaneously. */
  enableConcurrentCanvases: boolean;
  /** Upper bound for renderer.setPixelRatio. */
  maxDpr: number;
  /** Particle budget for the 2D background. */
  particleCount: number;
  /** User asked for reduced motion, or hardware is too weak to justify it. */
  reducedMotion: boolean;
  /** Coarse pointer (touch) device. */
  isTouch: boolean;
  /** Network is metered or slow — defer non-essential downloads. */
  saveData: boolean;
}

interface NavigatorWithHints extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
    addEventListener?: (type: string, listener: () => void) => void;
    removeEventListener?: (type: string, listener: () => void) => void;
  };
}

/** GPUs that cannot sustain 60fps with more than trivial WebGL work. */
const WEAK_GPU_PATTERN =
  /mali-?4|mali-?t7|mali-?t8|mali-?g3[1-9]|mali-?g5[12]|mali-?g57 mc1|adreno[^\d]*(2\d\d|30[05]|306|308|30[89]|4\d\d|505|506|50[89]|51\d|610|612|61[89])|powervr\s*(ge|g6|sgx)|videocore|swiftshader|llvmpipe|software/i;

let probedRenderer: string | null | undefined;

/**
 * Read the unmasked GL renderer string once. The throwaway context is
 * explicitly released so it never counts against the browser's live WebGL
 * context budget (a real limit we are already close to on this page).
 */
function probeGpuRenderer(): string | null {
  if (probedRenderer !== undefined) return probedRenderer;

  probedRenderer = null;
  try {
    const canvas = document.createElement('canvas');
    const gl = (canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

    if (gl) {
      const info = gl.getExtension('WEBGL_debug_renderer_info');
      if (info) {
        probedRenderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL) ?? '');
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    }
  } catch {
    probedRenderer = null;
  }

  return probedRenderer;
}

function hasWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(
      canvas.getContext('webgl2') ||
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl')
    );
  } catch {
    return false;
  }
}

function buildCapabilities(tier: DeviceTier, isTouch: boolean, saveData: boolean, prefersReduced: boolean): DeviceCapabilities {
  const base: Record<DeviceTier, Omit<DeviceCapabilities, 'tier' | 'isTouch' | 'saveData' | 'reducedMotion'>> = {
    low: {
      enable3D: false,
      enableParticles: false,
      enableCustomCursor: true,
      enableHeavyBlur: false,
      enableShadows: false,
      enableConcurrentCanvases: false,
      maxDpr: 1,
      particleCount: 0,
    },
    mid: {
      enable3D: true,
      enableParticles: true,
      enableCustomCursor: true,
      enableHeavyBlur: true,
      enableShadows: false,
      // One live canvas at a time — scenes yield to whichever is on screen.
      enableConcurrentCanvases: false,
      maxDpr: 1.5,
      particleCount: 18,
    },
    high: {
      enable3D: true,
      enableParticles: true,
      enableCustomCursor: true,
      enableHeavyBlur: true,
      enableShadows: true,
      enableConcurrentCanvases: true,
      maxDpr: 2,
      particleCount: 42,
    },
  };

  const caps = { ...base[tier], tier, isTouch, saveData, reducedMotion: prefersReduced };

  // An explicit reduced-motion preference stops heavy particle physics
  if (prefersReduced) {
    caps.enableParticles = false;
    caps.particleCount = 0;
  }

  return caps;

  return caps;
}

/** Server-safe conservative default used before the DOM is available. */
export const SSR_CAPABILITIES: DeviceCapabilities = buildCapabilities('low', false, false, false);

export function detectCapabilities(): DeviceCapabilities {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return SSR_CAPABILITIES;
  }

  const nav = navigator as NavigatorWithHints;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch =
    window.matchMedia('(pointer: coarse)').matches || (nav.maxTouchPoints ?? 0) > 0;
  const saveData = Boolean(nav.connection?.saveData);
  const effectiveType = nav.connection?.effectiveType ?? '';
  const slowNetwork = /(^|\W)(slow-2g|2g|3g)$/.test(effectiveType);

  // Hard blockers — no WebGL, or the user/network has asked us to back off.
  if (!hasWebGL() || prefersReduced || saveData) {
    return buildCapabilities('low', isTouch, saveData, prefersReduced);
  }

  const memory = nav.deviceMemory ?? (isTouch ? 4 : 8);
  const cores = nav.hardwareConcurrency ?? (isTouch ? 4 : 8);
  const shortestSide = Math.min(window.screen?.width ?? 1920, window.screen?.height ?? 1080);
  const renderer = probeGpuRenderer();
  const weakGpu = renderer ? WEAK_GPU_PATTERN.test(renderer) : false;

  // Start from a numeric score so no single weak signal condemns a device.
  let score = 0;
  if (memory >= 8) score += 3;
  else if (memory >= 6) score += 2;
  else if (memory >= 4) score += 1;

  if (cores >= 8) score += 2;
  else if (cores >= 6) score += 1;

  if (!isTouch) score += 2;
  if (shortestSide >= 768) score += 1;
  if (window.devicePixelRatio >= 3) score += 1; // premium panel implies premium SoC

  if (weakGpu) score -= 4;
  if (slowNetwork) score -= 2;
  if (isTouch && shortestSide <= 400) score -= 1; // budget HD+ phone class

  let tier: DeviceTier;
  if (score <= 2) tier = 'low';
  else if (score <= 5) tier = 'mid';
  else tier = 'high';

  // A known-weak GPU can never be 'high' regardless of RAM or core count.
  if (weakGpu && tier === 'high') tier = 'mid';

  return buildCapabilities(tier, isTouch, saveData, prefersReduced);
}

/**
 * Publish the tier on <html> so CSS can disable blurs, shadows and infinite
 * animations without any JS in the hot path.
 */
export function applyCapabilitiesToDocument(caps: DeviceCapabilities): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.dataset.tier = caps.tier;
  root.dataset.touch = String(caps.isTouch);
  root.dataset.reducedMotion = String(caps.reducedMotion);
}
