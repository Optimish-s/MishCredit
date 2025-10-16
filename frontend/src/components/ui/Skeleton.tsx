import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  rounded?: 'sm' | 'md' | 'lg' | 'full';
}

const rounding: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm: 'rounded',
  md: 'rounded-lg',
  lg: 'rounded-xl',
  full: 'rounded-full',
};

export function Skeleton({ className, rounded = 'md', ...rest }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-700',
        rounding[rounded],
        className,
      )}
      {...rest}
    />
  );
}

