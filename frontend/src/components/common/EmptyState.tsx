import React from 'react';
import { PackageOpen, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <PackageOpen className="w-12 h-12 text-slate-400 dark:text-slate-500 stroke-[1.5]" />,
  title,
  description,
  actionText,
  onAction,
  secondaryText,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs my-4">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>
      {(actionText || secondaryText) && (
        <div className="flex items-center gap-3">
          {secondaryText && onSecondaryAction && (
            <Button variant="outline" size="sm" onClick={onSecondaryAction}>
              {secondaryText}
            </Button>
          )}
          {actionText && onAction && (
            <Button variant="primary" size="sm" onClick={onAction}>
              <span>{actionText}</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
