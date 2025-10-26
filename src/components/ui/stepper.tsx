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
    <div className={cn("flex flex-col md:flex-row items-start", className)}>
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
      <div className={cn("flex-grow flex md:flex-col items-center", className)}>
        <div className="flex flex-col items-center shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {step}
            </div>
        </div>
        {!isLast && <div className="flex-grow w-full h-12 md:h-auto md:w-auto border-l-2 md:border-l-0 md:border-t-2 border-primary/50 border-dashed ml-4 md:ml-0 md:mt-4 md:mx-4"></div>}
        <div className="md:text-center mt-0 md:mt-2 ml-4 md:ml-0 flex-grow">{children}</div>
      </div>
    );
};
