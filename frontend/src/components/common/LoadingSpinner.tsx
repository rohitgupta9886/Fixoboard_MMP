import React from 'react';
import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

interface LoadingSpinnerProps {
  text?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  text = 'Loading...',
  className,
  size = 'md',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={clsx('flex flex-col items-center justify-center p-8 text-slate-400 gap-3', className)}>
      <Loader2 className={clsx('animate-spin text-blue-500', sizes[size])} />
      {text && <p className="text-xs font-medium tracking-wide uppercase">{text}</p>}
    </div>
  );
};
