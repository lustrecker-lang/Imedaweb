
// src/components/ui/animated-counter.tsx
'use client';

import { motion, useInView, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface AnimatedCounterProps {
  to: number;
}

export function AnimatedCounter({ to }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '0px' });
  const motionValue = useSpring(0, {
    damping: 50,
    stiffness: 200,
  });

  useEffect(() => {
    if (isInView) {
      motionValue.set(to);
    }
  }, [motionValue, isInView, to]);

  useEffect(() => {
    const unsubscribe = motionValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest).toString();
      }
    });
    return unsubscribe;
  }, [motionValue]);

  return <span ref={ref}>0</span>;
}
