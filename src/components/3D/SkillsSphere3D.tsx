import React, { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  RotateCw,
  RefreshCw,
  Eye,
  Sparkles,
  Zap,
  Flame,
  Radio,
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Compass,
  Target,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Skill } from '../../api/services';

interface SkillsSphere3DProps {
  skills: Skill[];
  onSelectSkill: (skill: Skill) => void;
  selectedSkillId?: number | null;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  speedMultiplier?: number;
  quality?: 'eco' | 'ultra';
}

// ─── Domain Planet Visual Presets ─────────────────────────────────────────────
interface PlanetTheme {
  primaryColor: string;
  emissiveColor: string;
  glowColor: string;
  ringColor?: string;
  hasRings?: boolean;
  atmosphereColor: string;
  planetRadius: number;
  orbitRadius: number;
  baseSpeed: number;
  alias: string;
}

const getDomainTheme = (category: string, index: number): PlanetTheme => {
  const normCat = (category || '').toLowerCase();
  
  // Custom solar distribution with balanced spacing for mobile & desktop
  const orbitBase = 4.4;
  const orbitSpacing = 2.5;
  const orbitRadius = orbitBase + index * orbitSpacing;
  const baseSpeed = 0.45 / Math.sqrt(index + 1); // Keplerian decay

  if (normCat.includes('front')) {
    return {
      primaryColor: '#00d2ff',
      emissiveColor: '#0066cc',
      glowColor: '#38bdf8',
      ringColor: '#38bdf8',
      hasRings: true,
      atmosphereColor: 'rgba(56, 189, 248, 0.4)',
      planetRadius: 0.95,
      orbitRadius,
      baseSpeed: baseSpeed * 1.15,
      alias: 'Cybele-Prime (Frontend)',
    };
  }
  if (normCat.includes('back')) {
    return {
      primaryColor: '#10b981',
      emissiveColor: '#047857',
      glowColor: '#34d399',
      hasRings: false,
      atmosphereColor: 'rgba(52, 211, 153, 0.4)',
      planetRadius: 0.88,
      orbitRadius,
      baseSpeed: baseSpeed * 0.95,
      alias: 'Terracore-VII (Backend)',
    };
  }
  if (normCat.includes('ai') || normCat.includes('ml') || normCat.includes('data science')) {
    return {
      primaryColor: '#a855f7',
      emissiveColor: '#7e22ce',
      glowColor: '#c084fc',
      ringColor: '#c084fc',
      hasRings: true,
      atmosphereColor: 'rgba(192, 132, 252, 0.45)',
      planetRadius: 1.05,
      orbitRadius,
      baseSpeed: baseSpeed * 0.85,
      alias: 'Singularity-X (AI / ML)',
    };
  }
  if (normCat.includes('mobile')) {
    return {
      primaryColor: '#0ea5e9',
      emissiveColor: '#0284c7',
      glowColor: '#67e8f9',
      hasRings: false,
      atmosphereColor: 'rgba(103, 232, 249, 0.35)',
      planetRadius: 0.8,
      orbitRadius,
      baseSpeed: baseSpeed * 1.25,
      alias: 'Aetheria-IV (Mobile)',
    };
  }
  if (normCat.includes('database') || normCat.includes('data')) {
    return {
      primaryColor: '#f59e0b',
      emissiveColor: '#b45309',
      glowColor: '#fbbf24',
      ringColor: '#fde68a',
      hasRings: true,
      atmosphereColor: 'rgba(251, 191, 36, 0.4)',
      planetRadius: 1.15,
      orbitRadius,
      baseSpeed: baseSpeed * 0.78,
      alias: 'Chronos-Titan (Databases)',
    };
  }
  if (normCat.includes('devops') || normCat.includes('cloud')) {
    return {
      primaryColor: '#f43f5e',
      emissiveColor: '#be123c',
      glowColor: '#fb7185',
      hasRings: false,
      atmosphereColor: 'rgba(251, 113, 133, 0.4)',
      planetRadius: 0.85,
      orbitRadius,
      baseSpeed: baseSpeed * 1.05,
      alias: 'Vulkan-Forge (DevOps & Cloud)',
    };
  }
  return {
    primaryColor: '#6366f1',
    emissiveColor: '#4338ca',
    glowColor: '#818cf8',
    hasRings: false,
    atmosphereColor: 'rgba(129, 140, 248, 0.35)',
    planetRadius: 0.75,
    orbitRadius,
    baseSpeed: baseSpeed * 1.0,
    alias: `${category} Sphere`,
  };
};

// ─── 3D Central Knowledge Sun (Solar Flare Core) ──────────────────────────────
const CentralKnowledgeSun = ({ onFocusSun }: { onFocusSun: () => void }) => {
  const sunMeshRef = useRef<THREE.Mesh>(null);
  const coronaRef = useRef<THREE.Mesh>(null);
  const flareRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    const cappedDelta = Math.min(delta, 0.05);
    const t = state.clock.getElapsedTime();
    if (sunMeshRef.current) {
      sunMeshRef.current.rotation.y += cappedDelta * 0.25;
      const pulse = 1 + Math.sin(t * 2.2) * 0.04;
      sunMeshRef.current.scale.set(pulse, pulse, pulse);
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z -= cappedDelta * 0.15;
      coronaRef.current.rotation.x += cappedDelta * 0.1;
      const s = 1.35 + Math.sin(t * 1.6) * 0.06;
      coronaRef.current.scale.set(s, s, s);
    }
    if (flareRef.current) {
      flareRef.current.rotation.y -= cappedDelta * 0.3;
      flareRef.current.rotation.z += cappedDelta * 0.2;
    }
  });

  return (
    <group
      position={[0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onFocusSun();
      }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Central Solar Point Lights */}
      <pointLight color="#ffedd5" intensity={2.8} distance={38} decay={1.5} />
      <pointLight color="#f59e0b" intensity={1.8} distance={20} decay={2} />

      {/* Sun Inner Plasma Core (Optimized 20 segments) */}
      <mesh ref={sunMeshRef}>
        <sphereGeometry args={[1.5, 20, 20]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={1.9}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Corona Outer Plasma Shield */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[1.78, 16, 16]} />
        <meshBasicMaterial
          color="#ea580c"
          transparent
          opacity={0.32}
          wireframe
        />
      </mesh>

      {/* Radiating Energy Flare Cage */}
      <mesh ref={flareRef}>
        <icosahedronGeometry args={[2.05, 1]} />
        <meshBasicMaterial
          color="#f43f5e"
          transparent
          opacity={hovered ? 0.4 : 0.18}
          wireframe
        />
      </mesh>

      {/* Interactive 3D Sun Billboard Button */}
      <Html
        center
        distanceFactor={13}
        zIndexRange={[10, 0]}
        style={{ pointerEvents: 'auto', userSelect: 'none' }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onFocusSun();
          }}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black backdrop-blur-md border transition-all duration-300 shadow-xl ${
            hovered
              ? 'bg-amber-500 text-black border-yellow-300 scale-110 shadow-amber-500/50'
              : 'bg-black/85 text-amber-300 border-amber-500/40 hover:border-amber-400'
          }`}
        >
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span className="tracking-wider uppercase text-[10px]">Matrix Sun</span>
        </button>
      </Html>
    </group>
  );
};

// ─── Orbital Path Ring Geometry ───────────────────────────────────────────────
const OrbitRing = ({ radius, color = '#ffffff' }: { radius: number; color?: string }) => {
  const points = useMemo(() => {
    const pts = [];
    const segments = 48; // Optimized for mobile 60fps
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, 0, Math.sin(theta) * radius));
    }
    return pts;
  }, [radius]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <primitive
      object={
        new THREE.LineLoop(
          lineGeometry,
          new THREE.LineBasicMaterial({
            color: new THREE.Color(color),
            transparent: true,
            opacity: 0.24,
            linewidth: 1,
          })
        )
      }
    />
  );
};

// ─── Saturn-like Planetary Rings ──────────────────────────────────────────────
const PlanetaryRing = ({ radius, color = '#38bdf8' }: { radius: number; color?: string }) => {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += Math.min(delta, 0.05) * 0.12;
    }
  });

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2.7, 0.2, 0]}>
      <ringGeometry args={[radius * 1.35, radius * 2.1, 24]} />
      <meshBasicMaterial
        color={color}
        side={THREE.DoubleSide}
        transparent
        opacity={0.4}
      />
    </mesh>
  );
};

// ─── Orbiting Skill Satellite (Moon) ─────────────────────────────────────────
interface SkillSatelliteProps {
  skill: Skill;
  orbitRadius: number;
  orbitSpeed: number;
  initialAngle: number;
  planetPos: [number, number, number];
  isFocusedPlanet: boolean;
  isSelected: boolean;
  onSelect: (skill: Skill) => void;
  speedMultiplier: number;
}

const SkillSatellite: React.FC<SkillSatelliteProps> = ({
  skill,
  orbitRadius,
  orbitSpeed,
  initialAngle,
  planetPos,
  isFocusedPlanet,
  isSelected,
  onSelect,
  speedMultiplier,
}) => {
  const satelliteRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const angleRef = useRef(initialAngle);

  // Expand orbit distance when planet is selected/focused for high readability
  const dynamicRadius = isFocusedPlanet ? orbitRadius * 1.65 + 0.9 : orbitRadius;

  useFrame((_, delta) => {
    const cappedDelta = Math.min(delta, 0.05);
    angleRef.current += cappedDelta * orbitSpeed * speedMultiplier;
    if (satelliteRef.current) {
      const x = planetPos[0] + Math.cos(angleRef.current) * dynamicRadius;
      const z = planetPos[2] + Math.sin(angleRef.current) * dynamicRadius;
      const y = planetPos[1] + Math.sin(angleRef.current * 1.8) * 0.35; // gentle vertical oscillation
      satelliteRef.current.position.set(x, y, z);
    }
  });

  const isHighMastery = skill.percentage >= 90;

  return (
    <group ref={satelliteRef}>
      {/* 3D Moon Sphere Core (Lightweight 10 segments) */}
      <mesh>
        <sphereGeometry args={[isFocusedPlanet ? 0.16 : 0.11, 10, 10]} />
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : hovered ? '#ec4899' : '#e0e7ff'}
          emissive={isSelected ? '#0284c7' : hovered ? '#db2777' : '#4338ca'}
          emissiveIntensity={isSelected || hovered ? 1.2 : 0.5}
        />
      </mesh>

      {/* Orbiting HTML Tag for Skill */}
      <Html
        center
        distanceFactor={isFocusedPlanet ? 9 : 13}
        zIndexRange={[15, 0]}
        style={{
          transform: `scale(${hovered ? 1.15 : isSelected ? 1.1 : 1})`,
          pointerEvents: 'auto',
          userSelect: 'none',
          willChange: 'transform',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(skill);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold backdrop-blur-md border transition-all duration-200 shadow-lg whitespace-nowrap ${
            isSelected
              ? 'bg-cyan-600 text-white border-cyan-300 ring-2 ring-cyan-400 shadow-cyan-500/50 scale-105'
              : hovered
              ? 'bg-purple-900/90 text-white border-purple-400 shadow-purple-500/40'
              : isFocusedPlanet
              ? 'bg-gray-900/90 text-gray-100 border-white/25 hover:border-cyan-400'
              : 'bg-black/75 text-gray-300 border-white/10 hover:border-white/30'
          }`}
        >
          <span className="text-xs">{skill.icon || '⚡'}</span>
          <span className="font-semibold">{skill.name}</span>
          <span
            className={`px-1 py-0.2 rounded-full text-[8px] font-black ${
              isHighMastery
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                : 'bg-white/15 text-white'
            }`}
          >
            {skill.percentage}%
          </span>
        </button>
      </Html>
    </group>
  );
};

// ─── Domain Planet Component ───────────────────────────────────────────────────
interface DomainPlanetProps {
  category: string;
  skills: Skill[];
  theme: PlanetTheme;
  orbitAngleRef: React.MutableRefObject<number>;
  isFocused: boolean;
  selectedSkillId?: number | null;
  onFocusPlanet: (category: string, pos: [number, number, number]) => void;
  onSelectSkill: (skill: Skill) => void;
  speedMultiplier: number;
}

const DomainPlanet: React.FC<DomainPlanetProps> = ({
  category,
  skills,
  theme,
  orbitAngleRef,
  isFocused,
  selectedSkillId,
  onFocusPlanet,
  onSelectSkill,
  speedMultiplier,
}) => {
  const planetMeshRef = useRef<THREE.Mesh>(null);
  const planetGroupRef = useRef<THREE.Group>(null);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>([theme.orbitRadius, 0, 0]);
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    const cappedDelta = Math.min(delta, 0.05);
    orbitAngleRef.current += cappedDelta * theme.baseSpeed * 0.25 * speedMultiplier;
    const x = Math.cos(orbitAngleRef.current) * theme.orbitRadius;
    const z = Math.sin(orbitAngleRef.current) * theme.orbitRadius;
    const pos: [number, number, number] = [x, 0, z];

    if (planetGroupRef.current) {
      planetGroupRef.current.position.set(x, 0, z);
    }
    if (planetMeshRef.current) {
      planetMeshRef.current.rotation.y += cappedDelta * 0.6;
    }
    setCurrentPos(pos);
  });

  // Calculate satellite distribution
  const satelliteConfigs = useMemo(() => {
    const count = Math.max(skills.length, 1);
    return skills.map((skill, i) => {
      const orbitRadius = theme.planetRadius + 0.85 + (i % 3) * 0.45;
      const orbitSpeed = 0.65 + (i % 4) * 0.15;
      const initialAngle = (i / count) * Math.PI * 2;
      return {
        skill,
        orbitRadius,
        orbitSpeed,
        initialAngle,
      };
    });
  }, [skills, theme.planetRadius]);

  return (
    <>
      {/* Planetary Orbit Ring */}
      <OrbitRing radius={theme.orbitRadius} color={theme.glowColor} />

      {/* Orbiting Planet Body */}
      <group ref={planetGroupRef}>
        {/* Planet 3D Sphere (Optimized 18 segments) */}
        <mesh
          ref={planetMeshRef}
          onClick={(e) => {
            e.stopPropagation();
            onFocusPlanet(category, currentPos);
          }}
          onPointerOver={() => setHovered(true)}
          onPointerOut={() => setHovered(false)}
        >
          <sphereGeometry args={[theme.planetRadius, 18, 18]} />
          <meshStandardMaterial
            color={theme.primaryColor}
            emissive={theme.emissiveColor}
            emissiveIntensity={hovered || isFocused ? 0.95 : 0.45}
            roughness={0.35}
            metalness={0.65}
          />
        </mesh>

        {/* Atmosphere Glow Bubble */}
        <mesh scale={[1.2, 1.2, 1.2]}>
          <sphereGeometry args={[theme.planetRadius, 14, 14]} />
          <meshBasicMaterial
            color={theme.glowColor}
            transparent
            opacity={hovered || isFocused ? 0.35 : 0.15}
            wireframe
          />
        </mesh>

        {/* Optional Saturn Ring */}
        {theme.hasRings && (
          <PlanetaryRing radius={theme.planetRadius} color={theme.ringColor} />
        )}

        {/* 3D Floating Name Badge for Planet */}
        <Html
          center
          position={[0, theme.planetRadius + 0.7, 0]}
          distanceFactor={10}
          zIndexRange={[12, 0]}
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFocusPlanet(category, currentPos);
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black backdrop-blur-xl border transition-all duration-300 shadow-xl ${
              isFocused
                ? 'bg-cyan-500 text-black border-cyan-300 ring-2 ring-cyan-400 scale-110 shadow-cyan-500/50'
                : hovered
                ? 'bg-white text-black border-white scale-105 shadow-white/30'
                : 'bg-black/85 text-gray-200 border-white/20 hover:border-white/50'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: theme.glowColor }}
            />
            <span className="whitespace-nowrap tracking-wide">{category}</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-white/20 text-white">
              {skills.length}
            </span>
          </button>
        </Html>
      </group>

      {/* Orbiting Satellite Skills */}
      {satelliteConfigs.map((cfg) => (
        <SkillSatellite
          key={cfg.skill.id || cfg.skill.name}
          skill={cfg.skill}
          orbitRadius={cfg.orbitRadius}
          orbitSpeed={cfg.orbitSpeed}
          initialAngle={cfg.initialAngle}
          planetPos={currentPos}
          isFocusedPlanet={isFocused}
          isSelected={selectedSkillId === cfg.skill.id}
          onSelect={onSelectSkill}
          speedMultiplier={speedMultiplier}
        />
      ))}
    </>
  );
};

// ─── Ambient Cosmic Starfield ─────────────────────────────────────────────────
const CosmicStarfield = ({ count = 75 }: { count?: number }) => {
  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const colorPalette = ['#60a5fa', '#c084fc', '#34d399', '#fde047', '#f43f5e', '#ffffff'];

    for (let i = 0; i < count; i++) {
      const radius = 18 + Math.random() * 25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      pos[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6; // flat cosmic disk
      pos[i * 3 + 2] = radius * Math.cos(phi);

      const picked = new THREE.Color(colorPalette[Math.floor(Math.random() * colorPalette.length)]);
      col[i * 3] = picked.r;
      col[i * 3 + 1] = picked.g;
      col[i * 3 + 2] = picked.b;
    }
    return [pos, col];
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += Math.min(delta, 0.05) * 0.015;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
};

// ─── Camera Controller for Smooth Orbit Fly-in, Focus & Interactive Zoom ─────
const CameraFocusRig = ({
  targetPos,
  isFocused,
  zoomLevel,
}: {
  targetPos: [number, number, number] | null;
  isFocused: boolean;
  zoomLevel: number;
}) => {
  const { camera } = useThree();
  const currentTarget = useRef(new THREE.Vector3(0, 0, 0));
  const defaultDistance = useRef(24);

  useFrame((_, delta) => {
    const cappedDelta = Math.min(delta, 0.05);

    if (isFocused && targetPos) {
      // Smoothly track target planet position
      const dest = new THREE.Vector3(targetPos[0], targetPos[1], targetPos[2]);
      currentTarget.current.lerp(dest, cappedDelta * 2.8);
      camera.lookAt(currentTarget.current);
    } else {
      // Smoothly return camera target to Central Sun
      const center = new THREE.Vector3(0, 0, 0);
      currentTarget.current.lerp(center, cappedDelta * 2.8);
      camera.lookAt(currentTarget.current);
    }

    // Apply interactive zoom lerp
    if (zoomLevel) {
      const currentLength = camera.position.length();
      const targetLength = (defaultDistance.current / zoomLevel);
      if (Math.abs(currentLength - targetLength) > 0.1) {
        camera.position.setLength(
          THREE.MathUtils.lerp(currentLength, targetLength, cappedDelta * 3)
        );
      }
    }
  });

  return null;
};

// ─── Main Solar System Canvas Scene ───────────────────────────────────────────
const SolarSystemScene: React.FC<{
  skills: Skill[];
  selectedSkillId?: number | null;
  focusedCategory: string | null;
  onFocusPlanet: (category: string, pos: [number, number, number]) => void;
  onFocusSun: () => void;
  onSelectSkill: (skill: Skill) => void;
  speedMultiplier: number;
  quality: 'eco' | 'ultra';
  zoomLevel: number;
}> = ({
  skills,
  selectedSkillId,
  focusedCategory,
  onFocusPlanet,
  onFocusSun,
  onSelectSkill,
  speedMultiplier,
  quality,
  zoomLevel,
}) => {
  // Group skills by category
  const categories = useMemo(() => {
    const map = new Map<string, Skill[]>();
    skills.forEach((s) => {
      const cat = s.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    });
    return Array.from(map.entries());
  }, [skills]);

  // Persistent angle references for planets
  const angleRefs = useRef<React.MutableRefObject<number>[]>([]);
  if (angleRefs.current.length !== categories.length) {
    angleRefs.current = categories.map((_, i) => ({
      current: (i / Math.max(categories.length, 1)) * Math.PI * 2,
    }));
  }

  const [focusTargetPos, setFocusTargetPos] = useState<[number, number, number] | null>(null);

  const handleInternalFocusPlanet = (category: string, pos: [number, number, number]) => {
    setFocusTargetPos(pos);
    onFocusPlanet(category, pos);
  };

  const handleInternalFocusSun = () => {
    setFocusTargetPos(null);
    onFocusSun();
  };

  return (
    <>
      <ambientLight intensity={0.45} />
      <directionalLight position={[10, 15, 10]} intensity={0.7} color="#ffffff" />

      {/* Central Star */}
      <CentralKnowledgeSun onFocusSun={handleInternalFocusSun} />

      {/* Cosmic Dust */}
      <CosmicStarfield count={quality === 'ultra' ? 120 : 60} />

      {/* Domain Planets & Orbiting Satellites */}
      {categories.map(([category, catSkills], index) => {
        const theme = getDomainTheme(category, index);
        const isFocused = focusedCategory?.toLowerCase() === category.toLowerCase();

        return (
          <DomainPlanet
            key={category}
            category={category}
            skills={catSkills}
            theme={theme}
            orbitAngleRef={angleRefs.current[index]}
            isFocused={isFocused}
            selectedSkillId={selectedSkillId}
            onFocusPlanet={handleInternalFocusPlanet}
            onSelectSkill={onSelectSkill}
            speedMultiplier={speedMultiplier}
          />
        );
      })}

      <CameraFocusRig
        targetPos={focusTargetPos}
        isFocused={focusedCategory !== null}
        zoomLevel={zoomLevel}
      />
    </>
  );
};

// ─── Main SkillsSphere3D Export Component ─────────────────────────────────────
export const SkillsSphere3D: React.FC<SkillsSphere3DProps> = ({
  skills,
  onSelectSkill,
  selectedSkillId,
  selectedCategory = 'All',
  onSelectCategory,
  speedMultiplier: propSpeed = 1,
  quality: propQuality = 'eco',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const [isVisible, setIsVisible] = useState(true);

  // Planetary focus state
  const [focusedCategory, setFocusedCategory] = useState<string | null>(
    selectedCategory !== 'All' ? selectedCategory : null
  );

  // Zoom management state
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // 0.6x (macro) to 2.2x (close-up)
  const [speedMultiplier, setSpeedMultiplier] = useState(propSpeed);
  const [quality, setQuality] = useState<'eco' | 'ultra'>(propQuality);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMobile(window.innerWidth < 768);
    }
  }, []);

  // Sync when parent category filter changes
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All') {
      setFocusedCategory(selectedCategory);
      setZoomLevel(1.5); // auto zoom into planet
    } else {
      setFocusedCategory(null);
    }
  }, [selectedCategory]);

  // Viewport intersection observer to conserve mobile battery & 0% GPU when not in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.35, 2.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.35, 0.55));
  };

  const handleResetCamera = () => {
    setFocusedCategory(null);
    setZoomLevel(1.0);
    if (onSelectCategory) onSelectCategory('All');
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  const handleFocusPlanet = (cat: string) => {
    setFocusedCategory(cat);
    setZoomLevel(1.6);
    if (onSelectCategory) onSelectCategory(cat);
  };

  const handleFocusSun = () => {
    setFocusedCategory(null);
    setZoomLevel(1.0);
    if (onSelectCategory) onSelectCategory('All');
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] sm:h-[600px] lg:h-[680px] rounded-3xl overflow-hidden bg-gradient-to-b from-gray-950 via-[#050614] to-black border border-cyan-500/20 shadow-[0_0_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl group transform-gpu"
    >
      {/* ─── HUD Header Telemetry ────────────────────────────────────────────── */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-black/75 border border-white/15 text-xs text-gray-200 backdrop-blur-xl shadow-lg pointer-events-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-extrabold bg-gradient-to-r from-cyan-300 via-blue-200 to-indigo-300 bg-clip-text text-transparent">
            Solar Cosmos 3D
          </span>
          <span className="text-[10px] text-gray-400 font-mono">
            [{skills.length} Satellites]
          </span>
        </div>

        {focusedCategory && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 text-xs font-bold backdrop-blur-xl shadow-lg pointer-events-auto">
            <Radio className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>Target: {focusedCategory}</span>
            <button
              onClick={handleFocusSun}
              className="ml-1 text-gray-400 hover:text-white text-[10px] underline"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* ─── Top-Right Telemetry & Speed / Quality Controls ─────────────────── */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 sm:gap-2">
        {/* Speed Multiplier Pill */}
        <div className="flex items-center p-1 rounded-2xl bg-black/75 border border-white/15 backdrop-blur-xl shadow-lg">
          {[
            { label: '0x', val: 0, title: 'Freeze Orbits' },
            { label: '0.5x', val: 0.5, title: 'Half Speed' },
            { label: '1x', val: 1.0, title: 'Realtime' },
            { label: '2x', val: 2.0, title: 'Warp Speed' },
          ].map((spd) => (
            <button
              key={spd.label}
              onClick={() => setSpeedMultiplier(spd.val)}
              className={`px-2 py-0.5 rounded-xl text-[10px] font-mono font-bold transition-all ${
                speedMultiplier === spd.val
                  ? 'bg-cyan-500 text-black font-extrabold shadow-md'
                  : 'text-gray-400 hover:text-white'
              }`}
              title={spd.title}
            >
              {spd.label}
            </button>
          ))}
        </div>

        {/* Quality Mode Toggle (Eco 60FPS for Infinix / Ultra) */}
        <button
          onClick={() => setQuality(quality === 'eco' ? 'ultra' : 'eco')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-2xl text-[10px] font-bold border backdrop-blur-xl transition-all shadow-lg ${
            quality === 'ultra'
              ? 'bg-purple-600/80 text-white border-purple-400/50 shadow-purple-500/30'
              : 'bg-black/75 text-emerald-300 border-emerald-500/30 hover:border-emerald-400'
          }`}
          title="Toggle Graphics Performance Mode (Infinix Hot 10 Optimized)"
        >
          <Zap className="w-3 h-3 text-emerald-400" />
          <span className="hidden sm:inline">
            {quality === 'ultra' ? 'Ultra VFX' : '60FPS Eco'}
          </span>
        </button>

        {/* Camera Reset Button */}
        <button
          onClick={handleResetCamera}
          className="p-2 rounded-2xl bg-black/75 hover:bg-gray-800 border border-white/15 text-gray-300 hover:text-white transition-colors shadow-lg backdrop-blur-xl"
          title="Reset Solar Perspective"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ─── Dedicated Zoom In / Out On-Screen Floating Control Rig ──────────── */}
      <div className="absolute right-4 top-20 z-20 flex flex-col gap-1.5 bg-black/80 p-1.5 rounded-2xl border border-white/15 backdrop-blur-xl shadow-2xl">
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-black text-white transition-all shadow-md active:scale-95"
          title="Zoom In (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="text-[9px] font-mono text-center text-cyan-400 font-bold py-0.5">
          {Math.round(zoomLevel * 100)}%
        </div>

        <button
          onClick={handleZoomOut}
          className="p-2 rounded-xl bg-white/10 hover:bg-cyan-500 hover:text-black text-white transition-all shadow-md active:scale-95"
          title="Zoom Out (-)"
        >
          <Minus className="w-4 h-4" />
        </button>

        <button
          onClick={handleResetCamera}
          className="p-2 rounded-xl bg-white/10 hover:bg-purple-500 text-white transition-all shadow-md active:scale-95"
          title="Reset Zoom to 100%"
        >
          <Target className="w-4 h-4" />
        </button>
      </div>

      {/* ─── Bottom Navigation Quick-Jump Dock ───────────────────────────────── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[94%] sm:w-auto max-w-2xl">
        <div className="flex items-center justify-between sm:justify-center gap-1.5 p-1.5 rounded-2xl bg-black/85 border border-cyan-500/20 backdrop-blur-2xl shadow-2xl overflow-x-auto custom-scrollbar">
          <button
            onClick={handleFocusSun}
            className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-black whitespace-nowrap transition-all ${
              focusedCategory === null
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md scale-105'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-300" />
            <span>Core Sun</span>
          </button>

          {Array.from(new Set(skills.map((s) => s.category))).map((cat) => {
            const isCatFocused = focusedCategory?.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                onClick={() => handleFocusPlanet(cat)}
                className={`flex items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all ${
                  isCatFocused
                    ? 'bg-cyan-500 text-black font-black shadow-lg shadow-cyan-500/40 scale-105'
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <span>{cat}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 3D WebGL Canvas Layer with Adaptive DPR & Performance Caps ─────── */}
      {isVisible && (
        <Canvas
          frameloop="always"
          dpr={[1, isMobile ? 1.15 : 1.4]}
          camera={{
            position: [0, 16, 22],
            fov: isMobile ? 54 : 45,
            near: 0.1,
            far: 150,
          }}
          gl={{
            alpha: true,
            antialias: !isMobile,
            powerPreference: 'high-performance',
          }}
          style={{ width: '100%', height: '100%', touchAction: 'pan-y' }}
        >
          <SolarSystemScene
            skills={skills}
            selectedSkillId={selectedSkillId}
            focusedCategory={focusedCategory}
            onFocusPlanet={handleFocusPlanet}
            onFocusSun={handleFocusSun}
            onSelectSkill={onSelectSkill}
            speedMultiplier={speedMultiplier}
            quality={quality}
            zoomLevel={zoomLevel}
          />

          <OrbitControls
            ref={controlsRef}
            enableZoom={true}
            minDistance={5}
            maxDistance={50}
            enablePan={false}
            rotateSpeed={isMobile ? 0.65 : 0.45}
            dampingFactor={0.07}
            maxPolarAngle={Math.PI / 2.05} // don't dip below solar equatorial plane
          />
        </Canvas>
      )}
    </div>
  );
};

export default SkillsSphere3D;
