import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Skeleton } from './Skeleton';

interface LoadingStateProps {
  message?: string;
  rows?: number;
  className?: string;
  accessory?: ReactNode;
}

export function LoadingState({ message = 'Cargando información…', rows = 3, className, accessory }: LoadingStateProps) {
  return (
    <div className={cn('space-y-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800', className)}>
      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton key={idx} className="h-4 w-full" />
      ))}
      {accessory}
    </div>
  );
}

