import React, { Suspense, useRef, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stars } from '@react-three/drei';
import * as THREE from 'three';

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
  const [hasError, setHasError] = useState(false);
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

  if (hasError) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-950/60 to-slate-950/80 rounded-3xl ${className}`}
      >
        <div
          className="w-24 h-24 rounded-full border-4 border-blue-500/40 border-t-blue-400 animate-spin shadow-2xl shadow-blue-500/20"
          style={{ animation: 'spin 8s linear infinite' }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full h-full transform-gpu ${className}`}
      style={{ minHeight: 220 }}
    >
      {isVisible && (
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
          onError={() => setHasError(true)}
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
      )}
    </div>
  );
};

export default EarthCanvas;