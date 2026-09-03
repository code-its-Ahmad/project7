import { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number; // in ms
  delay?: number; // in ms
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const useCountUp = ({
  end,
  start = 0,
  duration = 2000,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
}: UseCountUpOptions) => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const [count, setCount] = useState(start);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;

    let startTime: number | null = null;
    let animationFrameId: number;

    const timeoutId = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        // Ease-out cubic easing
        const easeOutProgress = 1 - Math.pow(1 - progress, 3);
        const currentCount = start + (end - start) * easeOutProgress;

        setCount(currentCount);

        if (progress < 1) {
          animationFrameId = requestAnimationFrame(step);
        } else {
          setCount(end);
        }
      };

      animationFrameId = requestAnimationFrame(step);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isInView, start, end, duration, delay]);

  const displayValue = `${prefix}${count.toFixed(decimals)}${suffix}`;

  return { ref, count, displayValue };
};
