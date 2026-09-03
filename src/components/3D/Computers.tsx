import React, { useEffect, useState, useRef, Suspense, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// ─── Error Boundary ───────────────────────────────────────────────────────────
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ThreeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn('3D Computers Canvas caught error:', error.message, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return this.props.fallback(this.state.error, this.resetError);
    }
    return this.props.children;
  }
}

// ─── 3D Model Component ───────────────────────────────────────────────────────
const Computers: React.FC<{ isMobile: boolean; isTablet: boolean }> = ({ isMobile, isTablet }) => {
  const { scene, animations } = useGLTF('/man_working/scene.gltf');
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  useEffect(() => {
    if (animations && animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene);
      animations.forEach((clip) => {
        const action = mixerRef.current!.clipAction(clip);
        action.setLoop(THREE.LoopRepeat, Infinity);
        action.play();
      });
    }

    return () => {
      if (mixerRef.current) {
        mixerRef.current.stopAllAction();
        mixerRef.current.uncacheRoot(scene);
        mixerRef.current = null;
      }
    };
  }, [scene, animations]);

  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });

  const scale = isMobile ? 0.48 : isTablet ? 0.6 : 0.72;
  const position: [number, number, number] = isMobile
    ? [0, -2.4, -1.2]
    : isTablet
    ? [0, -2.8, -1.4]
    : [0, -3.2, -1.5];

  return (
    <mesh>
      <hemisphereLight intensity={0.9} groundColor="#1e293b" />
      <directionalLight position={[5, 10, 5]} intensity={1.5} color="#ffffff" />
      <pointLight intensity={1.2} position={[0, 4, 4]} color="#60a5fa" />
      <primitive
        object={scene}
        scale={scale}
        position={position}
        rotation={[-0.01, -0.2, -0.05]}
      />
    </mesh>
  );
};

// Preload the model asset
try {
  useGLTF.preload('/man_working/scene.gltf');
} catch {
  // Ignore preloading errors in non-browser or test environments
}

// ─── Lightweight Suspense Fallback ───────────────────────────────────────────
const Fallback3D = () => (
  <mesh position={[0, 0, 0]}>
    <sphereGeometry args={[1, 16, 16]} />
    <meshStandardMaterial color="#3b82f6" wireframe />
  </mesh>
);

// ─── Graceful UI Fallback (if 3D asset fails to fetch) ─────────────────────────
const FallbackCard: React.FC<{ reset: () => void }> = ({ reset }) => (
  <div className="w-full h-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-950/30 via-slate-900/40 to-indigo-950/30 rounded-2xl border border-blue-500/20 text-center select-none">
    <div className="relative mb-2">
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/10">
        <span className="text-2xl animate-pulse">💻</span>
      </div>
      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-400 animate-ping" />
    </div>
    <span className="text-xs font-bold text-gray-200 tracking-wide">Developer Workspace</span>
    <span className="text-[10px] text-gray-400 mt-0.5">Full Stack & AI Engineering</span>
    <button
      onClick={reset}
      type="button"
      className="mt-2.5 px-3 py-1 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-[10px] font-medium transition-all hover:scale-105 active:scale-95"
    >
      Retry 3D View
    </button>
  </div>
);

// ─── Main Computers Canvas ───────────────────────────────────────────────────
const ComputersCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
    };

    checkViewport();
    window.addEventListener('resize', checkViewport, { passive: true });

    // Intersection Observer to stop WebGL rendering when outside viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkViewport);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full transform-gpu">
      {isVisible && (
        <ThreeErrorBoundary fallback={(_error, reset) => <FallbackCard reset={reset} />}>
          <Canvas
            frameloop="always"
            dpr={[1, isMobile ? 1.2 : 1.5]}
            camera={{ position: [18, 3, 5], fov: 28 }}
            gl={{
              preserveDrawingBuffer: false,
              powerPreference: 'high-performance',
              antialias: false,
            }}
            style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
          >
            <OrbitControls
              enablePan={false}
              enableZoom={false}
              maxPolarAngle={Math.PI / 2}
              minPolarAngle={Math.PI / 2}
              rotateSpeed={0.5}
            />
            <Suspense fallback={<Fallback3D />}>
              <Computers isMobile={isMobile} isTablet={isTablet} />
            </Suspense>
          </Canvas>
        </ThreeErrorBoundary>
      )}
    </div>
  );
};

export default ComputersCanvas;