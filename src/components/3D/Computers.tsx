import React, { useEffect, useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

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

// Lightweight Fallback
const Fallback3D = () => (
  <mesh position={[0, 0, 0]}>
    <sphereGeometry args={[1, 16, 16]} />
    <meshStandardMaterial color="#3b82f6" wireframe />
  </mesh>
);

const ComputersCanvas = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [hasError, setHasError] = useState(false);

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

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-950/40 to-slate-900/60 rounded-2xl">
        <div className="text-3xl animate-bounce">💻</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full transform-gpu">
      {isVisible && (
        <Canvas
          frameloop="always"
          dpr={[1, isMobile ? 1.2 : 1.5]}
          camera={{ position: [18, 3, 5], fov: 28 }}
          gl={{
            preserveDrawingBuffer: false,
            powerPreference: 'high-performance',
            antialias: false,
          }}
          onError={() => setHasError(true)}
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
      )}
    </div>
  );
};

export default ComputersCanvas;