import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BentoProps {
  children?: React.ReactNode;
  className?: string;
}

/** A container for dashboard-style layouts with consistent spacing. */
export function Bento({ children, className, ...props }: BentoProps) {
  return (
    <div className={cn('flex flex-wrap gap-8 w-full p-4', className)} {...props}>
      {children}
    </div>
  );
}
