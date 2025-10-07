// src/components/ui/animated-progress.tsx
'use client';

import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Progress } from './progress'; // Assuming your existing progress bar is here
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  className?: string;
}

export function AnimatedProgress({ value, className }: AnimatedProgressProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const variants = {
    hidden: { width: '0%' },
    visible: { width: `${value}%` },
  };

  return (
    <div ref={ref} className={cn("relative h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
        <motion.div
            className="absolute h-full bg-primary"
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
            variants={variants}
            transition={{ duration: 0.8, ease: 'easeOut' }}
        />
    </div>
  );
}