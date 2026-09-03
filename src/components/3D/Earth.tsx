import React, { Suspense, useRef, useEffect, useState, Component, type ReactNode } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stars } from '@react-three/drei';
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
    console.warn('3D Earth Canvas caught error:', error.message, errorInfo);
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

// ─── Planet Mesh ─────────────────────────────────────────────────────────────
function PlanetModel({ scale = 2.5 }: { scale?: number }) {
  const planetRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF('/planet/scene.gltf');

  const clonedScene = React.useMemo(() => scene.clone(true), [scene]);

  // Smooth self-rotation
  useFrame((_state, delta) => {
    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <group ref={planetRef}>
      <primitive
        object={clonedScene}
        scale={scale}
        position={[0, 0, 0]}
        rotation={[0.15, 0, 0]}
      />
    </group>
  );
}

try {
  useGLTF.preload('/planet/scene.gltf');
} catch {
  // Ignore preload error
}

// ─── Ambient Star Particles ────────────────────────────────────────────────
function SpaceEnvironment({ isMobile }: { isMobile: boolean }) {
  return (
    <>
      <Stars
        radius={70}
        depth={40}
        count={isMobile ? 800 : 2000}
        factor={3}
        saturation={0}
        fade
        speed={0.3}
      />
      <directionalLight
        position={[8, 4, 4]}
        intensity={2.2}
        color="#fff5e0"
      />
      <pointLight position={[-8, -5, -6]} intensity={0.9} color="#3b82f6" />
      <ambientLight intensity={0.3} color="#1e293b" />
    </>
  );
}

// ─── Loading Fallback ─────────────────────────────────────────────────────
function PlanetFallback() {
  const meshRef = useRef<THREE.Mesh>(null);
  useFrame((_state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1.5, 16, 16]} />
      <meshStandardMaterial
        color="#1e40af"
        wireframe
        emissive="#3b82f6"
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

// ─── Contact Section Planet Canvas ────────────────────────────────────────
interface EarthCanvasProps {
  scale?: number;
  className?: string;
}

const EarthCanvas: React.FC<EarthCanvasProps> = ({ scale, className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [planetScale, setPlanetScale] = useState(scale ?? 2.4);
  const [isVisible, setIsVisible] = useState(true);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;

  useEffect(() => {
    const updateScale = () => {
      if (scale !== undefined) return;
      const w = containerRef.current?.offsetWidth ?? window.innerWidth;
      if (w < 340) setPlanetScale(1.6);
      else if (w < 500) setPlanetScale(2.0);
      else setPlanetScale(2.4);
    };

    updateScale();
    window.addEventListener('resize', updateScale, { passive: true });

    // Stop WebGL render loop when not visible in viewport
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateScale);
      observer.disconnect();
    };
  }, [scale]);

  const renderFallback = (_error: Error, reset: () => void) => (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-950/60 to-slate-950/80 rounded-3xl border border-blue-500/20 text-center ${className}`}
      style={{ minHeight: 220 }}
    >
      <div
        className="w-20 h-20 rounded-full border-4 border-blue-500/40 border-t-blue-400 animate-spin shadow-2xl shadow-blue-500/20 mb-3"
        style={{ animation: 'spin 8s linear infinite' }}
      />
      <span className="text-xs font-semibold text-blue-300">Global Interactive Orbit</span>
      <button
        onClick={reset}
        type="button"
        className="mt-2 text-[10px] text-blue-400 underline hover:text-blue-300"
      >
        Retry 3D Earth
      </button>
    </div>
  );

  return (
    <div
      ref={containerRef}
      className={`w-full h-full transform-gpu ${className}`}
      style={{ minHeight: 220 }}
    >
      {isVisible && (
        <ThreeErrorBoundary fallback={renderFallback}>
          <Canvas
            frameloop="always"
            dpr={[1, isMobile ? 1.2 : 1.5]}
            gl={{
              preserveDrawingBuffer: false,
              antialias: false,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            camera={{
              fov: 45,
              near: 0.1,
              far: 200,
              position: [0, 0, isMobile ? 6 : 5],
            }}
            style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
          >
            <SpaceEnvironment isMobile={isMobile} />
            <Suspense fallback={<PlanetFallback />}>
              <PlanetModel scale={planetScale} />
            </Suspense>
            <OrbitControls
              autoRotate={false}
              enablePan={false}
              enableZoom={false}
              enableRotate={true}
              maxPolarAngle={Math.PI / 1.5}
              minPolarAngle={Math.PI / 3}
              enableDamping={true}
              dampingFactor={0.06}
              rotateSpeed={0.4}
            />
          </Canvas>
        </ThreeErrorBoundary>
      )}
    </div>
  );
};

export default EarthCanvas;