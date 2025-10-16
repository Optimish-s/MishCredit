import type { ReactNode } from 'react';
import { Button } from './Button';
import { cn } from '../../lib/cn';
import { Alert } from './Alert';

interface ErrorStateProps {
  title?: string;
  message?: string;
  icon?: ReactNode;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Algo salió mal',
  message = 'Intenta nuevamente o contacta al soporte del sistema.',
  icon,
  retryLabel = 'Reintentar',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <Alert variant="error" title={title} description={message}>
        {icon && <div className="text-2xl">{icon}</div>}
      </Alert>
      {onRetry && (
        <Button variant="danger" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

