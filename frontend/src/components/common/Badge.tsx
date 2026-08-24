import React from 'react';
import clsx from 'clsx';

interface BadgeProps {
  status?: string | any;
  children?: React.ReactNode;
  variant?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Badge: React.FC<BadgeProps> = ({ status, children, variant, className, size = 'md' }) => {
  const getRawString = (st: any): string => {
    if (children && typeof children === 'string') return children;
    if (!st) return '';
    if (typeof st === 'string') return st;
    if (typeof st === 'object') {
      return st.name || st.code || st.display_name || st.label || String(st);
    }
    return String(st);
  };

  const statusStr = getRawString(status || variant);

  const getVariant = (st: string) => {
    const s = st?.toUpperCase();
    switch (s) {
      case 'APPROVED':
      case 'AVAILABLE':
      case 'COMPLETED':
      case 'DISPATCHED':
      case 'ACTIVE':
      case 'ADMIN':
      case 'MAIN_HEAD':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
      case 'IN_PROGRESS':
      case 'RUNNING':
      case 'LOADING':
      case 'PARTIALLY_PRODUCTION':
      case 'PARTIALLY_DISPATCHED':
      case 'PRODUCTION':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
      case 'SUBMITTED':
      case 'PLANNED':
      case 'MACHINE_ASSIGNED':
      case 'RELEASED':
      case 'READY':
      case 'NORMAL':
      case 'SALES':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800';
      case 'DRAFT':
      case 'IDLE':
      case 'PENDING':
      case 'LOW':
      case 'OPERATOR':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      case 'PAUSED':
      case 'UNDER_REVIEW':
      case 'MAINTENANCE':
      case 'HIGH':
      case 'PACKING':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
      case 'REJECTED':
      case 'CANCELLED':
      case 'OFFLINE':
      case 'URGENT':
      case 'INACTIVE':
      case 'DISPATCH':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
      case 'AUTOMATION':
      case 'SCHEDULED':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getDotColor = (st: string) => {
    const s = st?.toUpperCase();
    switch (s) {
      case 'APPROVED':
      case 'AVAILABLE':
      case 'COMPLETED':
      case 'DISPATCHED':
      case 'ACTIVE':
      case 'ADMIN':
      case 'MAIN_HEAD':
        return 'bg-emerald-500';
      case 'IN_PROGRESS':
      case 'RUNNING':
      case 'PRODUCTION':
        return 'bg-blue-500 animate-pulse';
      case 'LOADING':
      case 'PARTIALLY_PRODUCTION':
      case 'PARTIALLY_DISPATCHED':
      case 'SUBMITTED':
      case 'PLANNED':
      case 'MACHINE_ASSIGNED':
      case 'RELEASED':
      case 'READY':
      case 'SALES':
        return 'bg-sky-500';
      case 'PAUSED':
      case 'UNDER_REVIEW':
      case 'MAINTENANCE':
      case 'HIGH':
      case 'PACKING':
        return 'bg-amber-500';
      case 'REJECTED':
      case 'CANCELLED':
      case 'OFFLINE':
      case 'URGENT':
      case 'INACTIVE':
      case 'DISPATCH':
        return 'bg-rose-500';
      case 'AUTOMATION':
      case 'SCHEDULED':
        return 'bg-purple-500';
      default:
        return 'bg-slate-400';
    }
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-semibold rounded-full border shadow-2xs select-none tracking-wide font-sans',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-1 text-xs',
        getVariant(statusStr),
        className
      )}
    >
      <span className={clsx('w-1.5 h-1.5 rounded-full mr-1.5 shrink-0', getDotColor(statusStr))} />
      <span className="truncate">{children || (statusStr ? statusStr.replace(/_/g, ' ') : 'N/A')}</span>
    </span>
  );
};

