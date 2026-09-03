// avator3d.tsx
import { useRef, useEffect } from 'react';
import * as THREE from 'three';

const Avatar3D = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    avatar: THREE.Group;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0);
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Blue accent light
    const blueLight = new THREE.PointLight(0x0066ff, 1, 10);
    blueLight.position.set(-2, 2, 2);
    scene.add(blueLight);

    // Purple accent light
    const purpleLight = new THREE.PointLight(0x6600ff, 1, 10);
    purpleLight.position.set(2, 2, 2);
    scene.add(purpleLight);

    // Create avatar group
    const avatarGroup = new THREE.Group();

    // Head
    const headGeometry = new THREE.SphereGeometry(0.4, 16, 16);
    const headMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 });
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.y = 1.2;
    avatarGroup.add(head);

    // Body
    const bodyGeometry = new THREE.CylinderGeometry(0.3, 0.4, 1, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.3;
    avatarGroup.add(body);

    // Arms
    const armGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8);
    const armMaterial = new THREE.MeshLambertMaterial({ color: 0xFFDBB3 });
    
    const leftArm = new THREE.Mesh(armGeometry, armMaterial);
    leftArm.position.set(-0.5, 0.3, 0);
    leftArm.rotation.z = 0.3;
    avatarGroup.add(leftArm);

    const rightArm = new THREE.Mesh(armGeometry, armMaterial);
    rightArm.position.set(0.5, 0.3, 0);
    rightArm.rotation.z = -0.3;
    avatarGroup.add(rightArm);

    // Eyes
    const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
    const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
    
    const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    leftEye.position.set(-0.1, 1.3, 0.3);
    avatarGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
    rightEye.position.set(0.1, 1.3, 0.3);
    avatarGroup.add(rightEye);

    scene.add(avatarGroup);

    // Position camera
    camera.position.set(0, 1, 3);
    camera.lookAt(0, 0.8, 0);

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      avatar: avatarGroup
    };

    // Animation variables
    let time = 0;
    let mouseX = 0;
    let mouseY = 0;

    // Mouse interaction
    const handleMouseMove = (event: MouseEvent) => {
      const rect = mountRef.current?.getBoundingClientRect();
      if (rect) {
        mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      time += 0.01;

      if (sceneRef.current) {
        // Slow rotation
        sceneRef.current.avatar.rotation.y += 0.005;

        // Mouse-based tilting
        sceneRef.current.avatar.rotation.x = mouseY * 0.2;
        sceneRef.current.avatar.rotation.y += mouseX * 0.1;

        // Subtle breathing animation
        sceneRef.current.avatar.scale.y = 1 + Math.sin(time * 2) * 0.02;
      }

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (mountRef.current && sceneRef.current) {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        sceneRef.current.camera.aspect = width / height;
        sceneRef.current.camera.updateProjectionMatrix();
        sceneRef.current.renderer.setSize(width, height);
      }
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default Avatar3D;

