import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, hint, id, ...rest }, ref) => {
    const inputId = id ?? rest.name ?? `input-${Math.random().toString(36).slice(2)}`;
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-1 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:focus:ring-offset-slate-900',
            error
              ? 'border-red-500 focus:border-red-500 focus:ring-red-500 dark:border-red-400 dark:focus:ring-red-400'
              : '',
            className,
          )}
          {...rest}
        />
        {hint && !error && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
        {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = 'Input';

