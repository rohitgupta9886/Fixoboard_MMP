import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface ErrorStateProps {
  title?: string;
  message?: string;
  actionText?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'A temporary network or server issue prevented loading this section. Your existing records are safe.',
  actionText = 'Try Again',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl my-4">
      <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-xl mb-3 text-rose-600 dark:text-rose-400">
        <AlertTriangle className="w-8 h-8 stroke-[1.75]" />
      </div>
      <h4 className="text-base font-semibold text-rose-900 dark:text-rose-200 mb-1">
        {title}
      </h4>
      <p className="text-xs text-rose-700 dark:text-rose-400 max-w-sm mb-4">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>{actionText}</span>
        </Button>
      )}
    </div>
  );
};
