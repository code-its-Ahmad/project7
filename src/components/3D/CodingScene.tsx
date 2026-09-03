import { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface CodingSceneProps {
  theme?: string;
}

const CodingScene = ({ theme }: CodingSceneProps) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect touch / mobile devices
    const isMobile = window.innerWidth < 768;
    const isDark = theme !== 'light';

    // 1. Scene & Camera Setup
    const scene = new THREE.Scene();
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    const aspect = width / height;

    const camera = new THREE.PerspectiveCamera(
      aspect < 1 ? 68 : 55,
      aspect,
      0.1,
      100
    );

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: !isMobile,
      powerPreference: 'high-performance',
      precision: isMobile ? 'mediump' : 'highp',
    });

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.2 : 1.5));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = !isMobile;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.touchAction = 'pan-y';

    container.appendChild(renderer.domElement);

    // List of disposable Three.js resources
    const disposables: { dispose: () => void }[] = [];
    const register = <T extends { dispose: () => void }>(res: T): T => {
      disposables.push(res);
      return res;
    };

    // 2. Lighting Setup
    const ambientLight = register(new THREE.AmbientLight(isDark ? 0x1e293b : 0xf1f5f9, isDark ? 0.9 : 1.2));
    scene.add(ambientLight);

    const mainLight = register(new THREE.DirectionalLight(0xffffff, 1.4));
    mainLight.position.set(4, 7, 5);
    scene.add(mainLight);

    // Cyber Accent Point Lights
    const cyanLight = register(new THREE.PointLight(0x00f0ff, 2.5, 9));
    cyanLight.position.set(-2.8, 1.6, 1.8);
    scene.add(cyanLight);

    const purpleLight = register(new THREE.PointLight(0xa855f7, 2.5, 9));
    purpleLight.position.set(2.8, 1.6, 1.8);
    scene.add(purpleLight);

    const screenLight = register(new THREE.PointLight(0x38bdf8, 1.2, 4));
    screenLight.position.set(0, 0.2, 0.4);
    scene.add(screenLight);

    // 3. Workstation Root Group
    const workstation = new THREE.Group();
    scene.add(workstation);

    // Cyber Desk
    const deskWidth = isMobile ? 3.4 : 4.4;
    const deskGeo = register(new THREE.BoxGeometry(deskWidth, 0.1, 2.2));
    const deskMat = register(
      new THREE.MeshStandardMaterial({
        color: isDark ? 0x0f172a : 0x1e293b,
        roughness: 0.25,
        metalness: 0.8,
      })
    );
    const desk = new THREE.Mesh(deskGeo, deskMat);
    desk.position.y = -0.9;
    workstation.add(desk);

    // Glowing Edge Runners on Desk
    const edgeGeo = register(new THREE.BoxGeometry(deskWidth + 0.05, 0.03, 0.04));
    const cyanEdgeMat = register(
      new THREE.MeshBasicMaterial({ color: 0x00f0ff })
    );
    const deskEdgeFront = new THREE.Mesh(edgeGeo, cyanEdgeMat);
    deskEdgeFront.position.set(0, -0.85, 1.1);
    workstation.add(deskEdgeFront);

    // Ground Cyber Grid
    const gridHelper = register(new THREE.GridHelper(16, 20, 0x3b82f6, 0x1e293b));
    gridHelper.position.y = -2.2;
    scene.add(gridHelper);

    // 4. Curved Ultrawide Monitor
    const monitorGroup = new THREE.Group();

    // Stand & Base
    const standBaseGeo = register(new THREE.CylinderGeometry(0.35, 0.4, 0.04, 24));
    const standBaseMat = register(new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 }));
    const standBase = new THREE.Mesh(standBaseGeo, standBaseMat);
    standBase.position.set(0, -0.84, -0.6);
    monitorGroup.add(standBase);

    const standPoleGeo = register(new THREE.BoxGeometry(0.1, 0.8, 0.08));
    const standPole = new THREE.Mesh(standPoleGeo, standBaseMat);
    standPole.position.set(0, -0.45, -0.62);
    monitorGroup.add(standPole);

    // Monitor Bezel Frame
    const monitorFrameGeo = register(new THREE.BoxGeometry(2.4, 1.25, 0.06));
    const monitorFrameMat = register(new THREE.MeshStandardMaterial({ color: 0x020617, metalness: 0.95, roughness: 0.15 }));
    const monitorFrame = new THREE.Mesh(monitorFrameGeo, monitorFrameMat);
    monitorFrame.position.set(0, 0.1, -0.58);
    monitorGroup.add(monitorFrame);

    // Dynamic Scrolling Code Canvas Texture
    const codeCanvas = document.createElement('canvas');
    codeCanvas.width = 512;
    codeCanvas.height = 256;
    const codeCtx = codeCanvas.getContext('2d')!;

    const codeLines = [
      'import { AI, QuantumEngine } from "future-tech";',
      'const portfolio = new Developer({ name: "Ahmad" });',
      'async function buildWorldClassEcosystem() {',
      '  await AI.optimizeNeuralPipelines({ level: 99 });',
      '  const apps = await Cloud.deployGlobalServices();',
      '  return apps.filter(app => app.status === "ACTIVE");',
      '}',
      '// Real-Time 3D Engine: 60 FPS Locked',
      'export default connect(portfolio.getMetrics());',
    ];

    let codeScrollOffset = 0;
    const drawCodeScreen = () => {
      codeCtx.fillStyle = '#050c1e';
      codeCtx.fillRect(0, 0, 512, 256);

      // IDE Title bar
      codeCtx.fillStyle = '#0f172a';
      codeCtx.fillRect(0, 0, 512, 28);

      // macOS Window Dots
      codeCtx.fillStyle = '#ef4444';
      codeCtx.beginPath();
      codeCtx.arc(16, 14, 4.5, 0, Math.PI * 2);
      codeCtx.fill();

      codeCtx.fillStyle = '#f59e0b';
      codeCtx.beginPath();
      codeCtx.arc(32, 14, 4.5, 0, Math.PI * 2);
      codeCtx.fill();

      codeCtx.fillStyle = '#10b981';
      codeCtx.beginPath();
      codeCtx.arc(48, 14, 4.5, 0, Math.PI * 2);
      codeCtx.fill();

      // Tab Title
      codeCtx.fillStyle = '#94a3b8';
      codeCtx.font = 'bold 11px monospace';
      codeCtx.fillText('NexusCore.tsx — [AI/FullStack Engine]', 68, 18);

      // Code Lines with syntax highlighting
      codeCtx.font = '13px "Courier New", monospace';
      const lineHeight = 21;
      const startY = 52 - (codeScrollOffset % lineHeight);

      codeLines.forEach((line, idx) => {
        const y = startY + idx * lineHeight;
        if (y > 32 && y < 225) {
          // Line number
          codeCtx.fillStyle = '#475569';
          codeCtx.fillText(`${idx + 1}`.padStart(2, ' '), 12, y);

          // Code syntax highlighting
          if (line.includes('import') || line.includes('const') || line.includes('function') || line.includes('export')) {
            codeCtx.fillStyle = '#38bdf8'; // Cyan keywords
          } else if (line.includes('"') || line.includes("'")) {
            codeCtx.fillStyle = '#34d399'; // Emerald strings
          } else if (line.includes('//')) {
            codeCtx.fillStyle = '#64748b'; // Slate comments
          } else {
            codeCtx.fillStyle = '#e2e8f0'; // Light text
          }
          codeCtx.fillText(line, 44, y);
        }
      });

      // Terminal Bottom Status Bar
      codeCtx.fillStyle = '#090d16';
      codeCtx.fillRect(0, 226, 512, 30);
      codeCtx.fillStyle = '#38bdf8';
      codeCtx.font = 'bold 10px monospace';
      codeCtx.fillText('❯ Terminal: Ready (100% WebGL Active)  •  CPU: 1.2%  •  RAM: 140MB', 12, 245);
    };

    drawCodeScreen();
    const screenTexture = register(new THREE.CanvasTexture(codeCanvas));
    screenTexture.minFilter = THREE.LinearFilter;

    const screenGeo = register(new THREE.PlaneGeometry(2.28, 1.14));
    const screenMat = register(
      new THREE.MeshBasicMaterial({
        map: screenTexture,
        transparent: true,
      })
    );
    const monitorScreen = new THREE.Mesh(screenGeo, screenMat);
    monitorScreen.position.set(0, 0.1, -0.54);
    monitorGroup.add(monitorScreen);

    workstation.add(monitorGroup);

    // 5. Animated RGB Mechanical Keyboard
    const keyboardGroup = new THREE.Group();
    const kbBaseGeo = register(new THREE.BoxGeometry(1.2, 0.03, 0.45));
    const kbBaseMat = register(new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.3, metalness: 0.7 }));
    const kbBase = new THREE.Mesh(kbBaseGeo, kbBaseMat);
    kbBase.position.set(0, -0.83, 0.25);
    keyboardGroup.add(kbBase);

    // Matrix of glowing keycaps
    const keyGeo = register(new THREE.BoxGeometry(0.065, 0.02, 0.055));
    const keyMeshes: THREE.Mesh[] = [];
    const rows = 4;
    const cols = 12;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const keyMat = register(
          new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            emissive: 0x3b82f6,
            emissiveIntensity: 0.4,
            roughness: 0.2,
          })
        );
        const keyMesh = new THREE.Mesh(keyGeo, keyMat);
        keyMesh.position.set(
          (c - (cols - 1) / 2) * 0.08,
          -0.81,
          0.12 + r * 0.08
        );
        keyboardGroup.add(keyMesh);
        keyMeshes.push(keyMesh);
      }
    }
    workstation.add(keyboardGroup);

    // 6. Ergonomic Cyber Mouse
    const mouseGroup = new THREE.Group();
    const mouseGeo = register(new THREE.BoxGeometry(0.14, 0.05, 0.22));
    const mouseMat = register(new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2, metalness: 0.8 }));
    const mouseMesh = new THREE.Mesh(mouseGeo, mouseMat);
    mouseMesh.position.set(0.85, -0.82, 0.25);
    mouseGroup.add(mouseMesh);

    const wheelGeo = register(new THREE.BoxGeometry(0.02, 0.02, 0.05));
    const wheelMat = register(new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    const mouseWheel = new THREE.Mesh(wheelGeo, wheelMat);
    mouseWheel.position.set(0.85, -0.79, 0.21);
    mouseGroup.add(mouseWheel);
    workstation.add(mouseGroup);

    // 7. Developer Coffee Mug with Steam Particles
    const mugGroup = new THREE.Group();
    const mugGeo = register(new THREE.CylinderGeometry(0.09, 0.08, 0.2, 16));
    const mugMat = register(new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.3 }));
    const mugMesh = new THREE.Mesh(mugGeo, mugMat);
    mugMesh.position.set(-0.9, -0.75, 0.1);
    mugGroup.add(mugMesh);

    // Floating Steam Particles
    const steamGroup = new THREE.Group();
    const steamCount = 8;
    const steamGeo = register(new THREE.SphereGeometry(0.025, 8, 8));
    const steamMat = register(new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.35 }));
    const steamParticles: { mesh: THREE.Mesh; speed: number; phase: number }[] = [];

    for (let s = 0; s < steamCount; s++) {
      const sMesh = new THREE.Mesh(steamGeo, steamMat);
      sMesh.position.set(-0.9 + (Math.random() - 0.5) * 0.05, -0.62 + s * 0.06, 0.1 + (Math.random() - 0.5) * 0.05);
      steamGroup.add(sMesh);
      steamParticles.push({
        mesh: sMesh,
        speed: 0.006 + Math.random() * 0.005,
        phase: Math.random() * Math.PI * 2,
      });
    }
    mugGroup.add(steamGroup);
    workstation.add(mugGroup);

    // 8. Cybernetic Typing Hands
    const handMat = register(
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.2,
      })
    );
    const handGeo = register(new THREE.SphereGeometry(0.09, 16, 16));
    const leftHand = new THREE.Mesh(handGeo, handMat);
    leftHand.position.set(-0.25, -0.76, 0.3);
    const rightHand = new THREE.Mesh(handGeo, handMat);
    rightHand.position.set(0.25, -0.76, 0.3);
    workstation.add(leftHand);
    workstation.add(rightHand);

    // 9. Holographic Orbiting 3D Tech Tokens
    const holoGroup = new THREE.Group();

    // A. React Atom Ring System
    const reactGroup = new THREE.Group();
    reactGroup.position.set(-1.8, 0.6, 0.2);
    const nucleusGeo = register(new THREE.SphereGeometry(0.12, 16, 16));
    const nucleusMat = register(new THREE.MeshBasicMaterial({ color: 0x00f0ff }));
    const nucleus = new THREE.Mesh(nucleusGeo, nucleusMat);
    reactGroup.add(nucleus);

    const ringGeo = register(new THREE.TorusGeometry(0.32, 0.02, 8, 32));
    const ringMat = register(new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true }));
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    const ring2 = new THREE.Mesh(ringGeo, ringMat);
    const ring3 = new THREE.Mesh(ringGeo, ringMat);
    ring2.rotation.x = Math.PI / 3;
    ring3.rotation.x = -Math.PI / 3;
    reactGroup.add(ring1, ring2, ring3);
    holoGroup.add(reactGroup);

    // B. AI Neural Core
    const aiCoreGroup = new THREE.Group();
    aiCoreGroup.position.set(1.8, 0.7, 0.1);
    const aiCoreGeo = register(new THREE.IcosahedronGeometry(0.22, 1));
    const aiCoreMat = register(new THREE.MeshStandardMaterial({ color: 0xa855f7, wireframe: true, emissive: 0x9333ea, emissiveIntensity: 0.6 }));
    const aiCore = new THREE.Mesh(aiCoreGeo, aiCoreMat);
    aiCoreGroup.add(aiCore);
    holoGroup.add(aiCoreGroup);

    // C. TypeScript Floating Gem
    const tsGroup = new THREE.Group();
    tsGroup.position.set(0, 1.35, -0.4);
    const tsGeo = register(new THREE.OctahedronGeometry(0.18, 0));
    const tsMat = register(new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.1, metalness: 0.9, emissive: 0x2563eb, emissiveIntensity: 0.5 }));
    const tsGem = new THREE.Mesh(tsGeo, tsMat);
    tsGroup.add(tsGem);
    holoGroup.add(tsGroup);

    scene.add(holoGroup);

    // 10. Ambient Floating Code Particle Sprites
    const particleGroup = new THREE.Group();
    const particleCount = isMobile ? 18 : 34;
    const tokens = ['<AI/>', '{TS}', '=>', '01', '</>', '&&', 'React', '⚡', '99%'];
    const sprites: { sprite: THREE.Sprite; floatSpeed: number; basePos: THREE.Vector3 }[] = [];

    tokens.slice(0, 6).forEach((token, idx) => {
      const cvs = document.createElement('canvas');
      cvs.width = 64;
      cvs.height = 64;
      const c = cvs.getContext('2d')!;
      c.fillStyle = idx % 2 === 0 ? '#38bdf8' : '#c084fc';
      c.font = 'bold 28px monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(token, 32, 32);

      const tex = register(new THREE.CanvasTexture(cvs));
      const mat = register(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.7 }));

      const countPerType = Math.ceil(particleCount / 6);
      for (let i = 0; i < countPerType; i++) {
        const sprite = new THREE.Sprite(mat);
        const base = new THREE.Vector3(
          (Math.random() - 0.5) * (isMobile ? 5 : 8.5),
          Math.random() * 2.8 - 0.2,
          (Math.random() - 0.5) * 4.5
        );
        sprite.position.copy(base);
        sprite.scale.set(0.38, 0.38, 0.38);
        particleGroup.add(sprite);
        sprites.push({ sprite, floatSpeed: 0.5 + Math.random() * 0.8, basePos: base });
      }
    });
    scene.add(particleGroup);

    // 11. Initial Camera Position (Device-Responsive)
    if (aspect < 1) {
      camera.position.set(0, 1.1, 5.0);
      workstation.scale.set(0.85, 0.85, 0.85);
      holoGroup.scale.set(0.78, 0.78, 0.78);
    } else {
      camera.position.set(0, 1.3, 4.2);
      workstation.scale.set(1, 1, 1);
      holoGroup.scale.set(1, 1, 1);
    }
    camera.lookAt(0, -0.2, 0);

    // 12. Interaction & Animation Variables
    let isVisible = true;
    let animId: number;
    let time = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    // Viewport Intersection Observer
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          cancelAnimationFrame(animId);
          render();
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth) * 2 - 1;
      targetMouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    if (!isMobile) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      const newAspect = w / h;

      camera.aspect = newAspect;
      camera.fov = newAspect < 1 ? 68 : 55;
      camera.updateProjectionMatrix();

      if (newAspect < 1) {
        camera.position.set(0, 1.1, 5.0);
        workstation.scale.set(0.85, 0.85, 0.85);
        holoGroup.scale.set(0.78, 0.78, 0.78);
      } else {
        camera.position.set(0, 1.3, 4.2);
        workstation.scale.set(1, 1, 1);
        holoGroup.scale.set(1, 1, 1);
      }

      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // 13. Main 60FPS Render Loop
    let lastCodeUpdate = 0;

    const render = () => {
      if (!isVisible) return;
      time += 0.02;

      // Realtime Dynamic Code Scroll
      codeScrollOffset += 0.25;
      if (time - lastCodeUpdate > 0.05) {
        drawCodeScreen();
        screenTexture.needsUpdate = true;
        lastCodeUpdate = time;
      }

      // Typing Hands Animation
      leftHand.position.y = -0.76 + Math.sin(time * 8) * 0.035;
      rightHand.position.y = -0.76 + Math.sin(time * 8 + 2.2) * 0.035;

      // Keyboard RGB Wave Animation
      keyMeshes.forEach((mesh, idx) => {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const hue = (idx * 0.04 + time * 0.3) % 1;
        mat.emissive.setHSL(hue, 0.9, 0.5);
      });

      // Coffee Steam Particle Animation
      steamParticles.forEach((sp) => {
        sp.mesh.position.y += sp.speed;
        sp.mesh.position.x += Math.sin(time * 3 + sp.phase) * 0.001;
        if (sp.mesh.position.y > -0.2) {
          sp.mesh.position.y = -0.62;
        }
      });

      // Holographic Tech Orbitals Rotation & Levitation
      reactGroup.rotation.y = time * 0.8;
      reactGroup.rotation.z = time * 0.5;
      reactGroup.position.y = 0.6 + Math.sin(time * 1.5) * 0.08;

      aiCore.rotation.x = time * 0.6;
      aiCore.rotation.y = time * 0.9;
      aiCoreGroup.position.y = 0.7 + Math.sin(time * 1.5 + 1.2) * 0.08;

      tsGem.rotation.y = time * 1.2;
      tsGem.rotation.x = time * 0.7;
      tsGroup.position.y = 1.35 + Math.sin(time * 2) * 0.06;

      // Floating Code Particle Sprites
      sprites.forEach((item, idx) => {
        item.sprite.position.y = item.basePos.y + Math.sin(time * item.floatSpeed + idx) * 0.12;
      });

      // Camera Parallax / Motion
      if (!isMobile) {
        currentMouseX += (targetMouseX * 0.5 - currentMouseX) * 0.05;
        currentMouseY += (targetMouseY * 0.3 - currentMouseY) * 0.05;
        camera.position.x = currentMouseX;
        camera.position.y = 1.3 + currentMouseY;
        camera.lookAt(0, -0.2, 0);
      } else {
        // Gentle organic orbit on mobile
        camera.position.x = Math.sin(time * 0.4) * 0.3;
        camera.position.y = 1.1 + Math.cos(time * 0.3) * 0.1;
        camera.lookAt(0, -0.2, 0);
      }

      renderer.render(scene, camera);
      animId = requestAnimationFrame(render);
    };

    render();

    // 14. Comprehensive Memory & Resource Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      if (!isMobile) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      cancelAnimationFrame(animId);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      disposables.forEach((res) => {
        try {
          res.dispose();
        } catch {
          // ignore
        }
      });
      renderer.dispose();
    };
  }, [theme]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none transform-gpu overflow-hidden"
      aria-hidden="true"
    />
  );
};

export default CodingScene;
