import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  title?: ReactNode;
  description?: ReactNode;
  variant?: AlertVariant;
  className?: string;
  children?: ReactNode;
}

const variantStyles: Record<AlertVariant, { container: string; badge: string }> = {
  info: {
    container: 'bg-sky-50 border-sky-200 text-sky-900 dark:bg-sky-500/10 dark:border-sky-500/30 dark:text-sky-100',
    badge: 'bg-sky-500/20 text-sky-700 dark:bg-sky-400/20 dark:text-sky-100',
  },
  success: {
    container:
      'bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-500/10 dark:border-emerald-500/30 dark:text-emerald-100',
    badge: 'bg-emerald-500/20 text-emerald-700 dark:bg-emerald-400/20 dark:text-emerald-100',
  },
  warning: {
    container:
      'bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-500/10 dark:border-amber-500/30 dark:text-amber-100',
    badge: 'bg-amber-500/20 text-amber-700 dark:bg-amber-400/20 dark:text-amber-100',
  },
  error: {
    container:
      'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-500/10 dark:border-rose-500/30 dark:text-rose-100',
    badge: 'bg-rose-500/20 text-rose-700 dark:bg-rose-400/20 dark:text-rose-100',
  },
};

export function Alert({ title, description, children, variant = 'info', className }: AlertProps) {
  const styles = variantStyles[variant];
  return (
    <div className={cn('rounded-xl border px-4 py-3 text-sm', styles.container, className)}>
      {title && <p className="font-semibold">{title}</p>}
      {description && <p className="mt-1 text-sm opacity-90">{description}</p>}
      {children && <div className="mt-2 space-y-1">{children}</div>}
    </div>
  );
}

export function AlertBadge({ variant = 'info', children }: { variant?: AlertVariant; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold', variantStyles[variant].badge)}>
      {children}
    </span>
  );
}

