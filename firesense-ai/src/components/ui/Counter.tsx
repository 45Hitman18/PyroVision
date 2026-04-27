"use client";

import { useEffect, useState, useRef } from "react";

interface CounterProps {
  value: number;
  decimals?: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

export default function Counter({ value, decimals = 2, duration = 300, suffix = "", className }: CounterProps) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setHasStarted(true);
    });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    
    // Cancel any existing animation
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    if (count === 0) {
      const startTime = performance.now();
      const startValue = 0;

      const update = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const nextValue = startValue + easeOut * (value - startValue);
        setCount(nextValue);
        
        if (progress < 1) {
          rafRef.current = requestAnimationFrame(update);
        }
      };
      rafRef.current = requestAnimationFrame(update);
    } else {
      // If we already animated, just snap to the new value (for the live sync)
      setCount(value);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [hasStarted, value, duration]);

  return <span ref={ref} className={className}>{count.toFixed(decimals)}{suffix}</span>;
}
