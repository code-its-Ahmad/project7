import { useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
}

const ParticleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isTabActive = true;
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Adaptive density: 16 on mobile/Infinix Hot 10, 42 on high-end desktop
    const particleCount = isTouchDevice ? 16 : 42;
    const colors =
      theme === 'dark'
        ? ['rgba(59, 130, 246, 0.45)', 'rgba(168, 85, 247, 0.35)', 'rgba(6, 182, 212, 0.35)', 'rgba(236, 72, 153, 0.25)']
        : ['rgba(37, 99, 235, 0.25)', 'rgba(147, 51, 234, 0.2)', 'rgba(14, 165, 233, 0.2)'];

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * (isTouchDevice ? 0.3 : 0.5),
      vy: (Math.random() - 0.5) * (isTouchDevice ? 0.3 : 0.5),
      size: Math.random() * 1.8 + 0.8,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    if (!isTouchDevice) {
      window.addEventListener('mousemove', handleMouseMove, { passive: true });
    }

    const handleVisibilityChange = () => {
      isTabActive = document.visibilityState === 'visible';
      if (isTabActive) {
        cancelAnimationFrame(animationFrameId);
        render();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = () => {
      if (!isTabActive) return;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Mouse gentle repulsion (desktop only)
        if (!isTouchDevice) {
          const dx = mouseX - p.x;
          const dy = mouseY - p.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 10000 && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const force = (100 - dist) / 100;
            p.x -= (dx / dist) * force * 1.2;
            p.y -= (dy / dist) * force * 1.2;
          }
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();

        // Connect nearby particles with subtle lines (Desktop only to prevent mobile GPU battery drain)
        if (!isTouchDevice) {
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const dx = p.x - p2.x;
            const dy = p.y - p2.y;
            const distSq = dx * dx + dy * dy;
            if (distSq < 9000) {
              const distance = Math.sqrt(distSq);
              ctx.beginPath();
              ctx.moveTo(p.x, p.y);
              ctx.lineTo(p2.x, p2.y);
              const lineAlpha = (1 - distance / 95) * (theme === 'dark' ? 0.12 : 0.07);
              ctx.strokeStyle =
                theme === 'dark'
                  ? `rgba(96, 165, 250, ${lineAlpha})`
                  : `rgba(59, 130, 246, ${lineAlpha})`;
              ctx.lineWidth = 0.6;
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (!isTouchDevice) {
        window.removeEventListener('mousemove', handleMouseMove);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[1] transform-gpu"
      style={{ opacity: 0.8 }}
      aria-hidden="true"
    />
  );
};

export default ParticleCanvas;
