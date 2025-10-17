import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

interface CardProps {
  className?: string;
  children: ReactNode;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ className, children, padding = 'md' }: CardProps) {
  const paddings = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800', paddings[padding], className)}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function CardHeader({ title, description, actions, className }: CardHeaderProps) {
  return (
    <div className={cn('mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between', className)}>
      <div>
        <h2 className="text-lg font-semibold leading-tight text-slate-800 dark:text-slate-100">{title}</h2>
        {description && <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>}
      </div>
      {actions}
    </div>
  );
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn('space-y-3', className)}>{children}</div>;
}

