import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'brand'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'warning'
  | 'success'
  | 'gradient'
  | 'automation';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'touch';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  icon,
  className,
  disabled,
  type = 'button',
  ...props
}) => {
  const actualLeftIcon = leftIcon || icon;

  const baseClasses =
    'inline-flex items-center justify-center font-bold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 select-none disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98] cursor-pointer text-center touch-manipulation';

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md hover:shadow-glow-brand/40 focus:ring-blue-500 border border-blue-500/30',
    brand:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-md hover:shadow-glow-brand/40 focus:ring-blue-500 border border-blue-500/30',
    secondary:
      'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-750 shadow-2xs focus:ring-slate-400',
    outline:
      'bg-transparent border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400 dark:hover:border-slate-600 focus:ring-blue-400',
    ghost:
      'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white focus:ring-blue-400',
    danger:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md hover:shadow-glow-rose/40 focus:ring-rose-500 border border-rose-500/30',
    warning:
      'bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-md hover:shadow-glow-amber/40 focus:ring-amber-500 border border-amber-500/30',
    success:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md hover:shadow-glow-emerald/40 focus:ring-emerald-500 border border-emerald-500/30',
    gradient:
      'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-md hover:shadow-glow-brand/40 focus:ring-purple-500 border border-purple-400/40',
    automation:
      'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-md hover:shadow-glow-brand/30 focus:ring-indigo-400 border border-indigo-500/30',
  };

  const sizeClasses = {
    xs: 'h-7 px-2.5 text-xs gap-1 rounded-lg',
    sm: 'h-9 px-3.5 text-xs gap-1.5',
    md: 'h-10 px-4.5 text-sm gap-2',
    lg: 'h-12 px-6 text-base gap-2.5',
    touch: 'h-14 px-8 text-base gap-3 rounded-2xl',
  };

  return (
    <button
      type={type}
      className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        actualLeftIcon && <span className="shrink-0">{actualLeftIcon}</span>
      )}
      {children && <span className="truncate">{children}</span>}
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

