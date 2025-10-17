import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '../../lib/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({ title, description, icon, actionLabel, onAction, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300',
        className,
      )}
    >
      {icon && <div className="text-3xl">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">{title}</h3>
      {description && <p className="max-w-md text-sm opacity-80">{description}</p>}
      {actionLabel && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

