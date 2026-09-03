
import { useRef, useEffect, useState } from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  glowColor?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const Card3D = ({ 
  children, 
  className = '', 
  intensity = 15, 
  glowColor = 'blue',
  onMouseEnter,
  onMouseLeave
}: Card3DProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const mouseX = e.clientX - centerX;
      const mouseY = e.clientY - centerY;
      
      const rotateX = (mouseY / rect.height) * intensity;
      const rotateY = -(mouseX / rect.width) * intensity;
      
      setMousePosition({ x: mouseX, y: mouseY });
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    };

    const handleMouseEnter = () => {
      setIsHovered(true);
      card.style.transition = 'none';
      onMouseEnter?.();
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      card.style.transition = 'transform 0.5s ease-out';
      card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
      setMousePosition({ x: 0, y: 0 });
      onMouseLeave?.();
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [intensity, onMouseEnter, onMouseLeave]);

  const glowColors = {
    blue: 'shadow-blue-500/25',
    purple: 'shadow-purple-500/25',
    cyan: 'shadow-cyan-500/25',
    green: 'shadow-green-500/25',
    red: 'shadow-red-500/25',
    yellow: 'shadow-yellow-500/25'
  };

  return (
    <div className="relative" style={{ perspective: '1000px' }}>
      <div
        ref={cardRef}
        className={`relative transition-all duration-300 ${
          isHovered ? `shadow-2xl ${glowColors[glowColor as keyof typeof glowColors] || glowColors.blue}` : 'shadow-lg'
        } ${className}`}
        style={{
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
        
        {/* Dynamic light reflection */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none rounded-inherit opacity-20"
            style={{
              background: `radial-gradient(circle at ${
                ((mousePosition.x + 200) / 400) * 100
              }% ${
                ((mousePosition.y + 200) / 400) * 100
              }%, rgba(255,255,255,0.3) 0%, transparent 50%)`,
            }}
          />
        )}
        
        {/* Glow effect */}
        <div
          className={`absolute inset-0 rounded-inherit blur-xl opacity-0 transition-opacity duration-300 ${
            isHovered ? 'opacity-30' : 'opacity-0'
          }`}
          style={{
            background: `linear-gradient(45deg, ${
              glowColor === 'blue' ? '#3b82f6' :
              glowColor === 'purple' ? '#8b5cf6' :
              glowColor === 'cyan' ? '#06b6d4' :
              glowColor === 'green' ? '#10b981' :
              glowColor === 'red' ? '#ef4444' :
              glowColor === 'yellow' ? '#f59e0b' : '#3b82f6'
            }, transparent)`,
            zIndex: -1,
          }}
        />
      </div>
    </div>
  );
};

export default Card3D;
