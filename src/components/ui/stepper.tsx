// src/components/ui/stepper.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepperProps {
  children: React.ReactNode;
  className?: string;
}

export const Stepper = ({ children, className }: StepperProps) => {
  return (
    <div className={cn("flex items-start", className)}>
      {children}
    </div>
  );
};

interface StepProps {
  step: number;
  children: React.ReactNode;
  className?: string;
  isLast?: boolean;
}

export const Step = ({ step, children, className, isLast = false }: StepProps) => {
    return (
      <div className={cn("flex-grow flex items-start", className)}>
        <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {step}
            </div>
            <div className="text-center mt-2">{children}</div>
        </div>
        {!isLast && <div className="flex-grow border-t-2 border-primary/50 border-dashed mt-4 mx-4"></div>}
      </div>
    );
};
