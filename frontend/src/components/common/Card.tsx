import React from 'react';
import clsx from 'clsx';

export type CardVariant =
  | 'default'
  | 'primary'
  | 'dark'
  | 'black'
  | 'muted'
  | 'elevated'
  | 'glass'
  | 'interactive'
  | 'accent'
  | 'alert'
  | 'status'
  | 'colored';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  variant?: CardVariant;
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan' | 'orange' | 'gray';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  noPadding?: boolean;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  headerAction?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  color = 'blue',
  padding = 'md',
  noPadding = false,
  title,
  subtitle,
  action,
  headerAction,
  icon,
  className,
  ...props
}) => {
  const variantClasses: Record<CardVariant, string> = {
    default:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft',
    primary:
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft hover:shadow-soft-hover',
    dark:
      'bg-slate-900 dark:bg-slate-950 border border-slate-800 text-slate-100 shadow-md',
    black:
      'bg-black border border-slate-800 text-slate-100 shadow-lg',
    muted:
      'bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-slate-700 dark:text-slate-300',
    elevated:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700/80 shadow-soft-hover hover:border-blue-300 dark:hover:border-blue-700',
    glass:
      'glass-surface border border-white/60 dark:border-slate-800/80 shadow-soft',
    interactive:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft hover:shadow-soft-hover hover:-translate-y-0.5 hover:border-blue-500/50 dark:hover:border-blue-500/50 cursor-pointer active:scale-[0.995]',
    accent:
      'bg-white dark:bg-slate-900/95 border border-indigo-500/30 dark:border-indigo-500/40 shadow-glow-brand/20 hover:border-indigo-500/60',
    alert:
      'bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-900 dark:text-rose-200',
    status:
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft',
    colored: {
      blue: 'bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40',
      green: 'bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40',
      amber: 'bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40',
      red: 'bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40',
      purple: 'bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40',
      cyan: 'bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40',
      orange: 'bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40',
      gray: 'bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800',
    }[color || 'blue'],
  };

  const actualPadding = noPadding ? 'none' : padding;
  const actualAction = action || headerAction;

  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-5 sm:p-6',
    lg: 'p-6 sm:p-8',
  };

  return (
    <div
      className={clsx(
        'rounded-card transition-all duration-200 overflow-hidden',
        variantClasses[variant],
        paddingClasses[actualPadding],
        className
      )}
      {...props}
    >
      {(title || subtitle || actualAction || icon) && (
        <CardHeader
          title={title}
          subtitle={subtitle}
          action={actualAction}
          icon={icon}
        />
      )}
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, className }) => (
  <div className={clsx('flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/70 mb-5', className)}>
    <div className="flex items-center gap-3 min-w-0">
      {icon && (
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/40 shadow-2xs">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        {title && (
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
            {title}
          </h3>
        )}
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
  </div>
);

