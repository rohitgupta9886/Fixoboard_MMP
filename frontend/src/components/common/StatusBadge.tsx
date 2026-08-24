import React from 'react';
import clsx from 'clsx';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  PlayCircle,
  PauseCircle,
  Truck,
  Package,
  Layers,
  XCircle,
  Zap,
} from 'lucide-react';

export interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  className,
}) => {
  const normalizedStatus = (status || '').toUpperCase().replace(/\s+/g, '_');

  const getStatusConfig = () => {
    switch (normalizedStatus) {
      case 'RUNNING':
      case 'IN_PROGRESS':
      case 'IN_PRODUCTION':
      case 'ACTIVE':
        return {
          label: normalizedStatus === 'IN_PRODUCTION' ? 'In Production' : 'Running',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
          icon: PlayCircle,
          dotColor: 'bg-emerald-500 animate-pulse',
        };
      case 'APPROVED':
      case 'COMPLETED':
      case 'VERIFIED':
      case 'DELIVERED':
      case 'GATE_OUT':
      case 'DISPATCHED':
        return {
          label: normalizedStatus === 'DISPATCHED' ? 'Dispatched' : normalizedStatus === 'COMPLETED' ? 'Completed' : 'Approved',
          classes: 'bg-indigo-50 text-brand-900 border-indigo-200/80 dark:bg-indigo-950/50 dark:text-indigo-200 dark:border-indigo-800',
          icon: CheckCircle2,
          dotColor: 'bg-brand-600',
        };
      case 'READY_FOR_DISPATCH':
      case 'READY':
        return {
          label: 'Ready for Dispatch',
          classes: 'bg-sky-50 text-sky-800 border-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800',
          icon: Truck,
          dotColor: 'bg-sky-500',
        };
      case 'PACKING':
      case 'PACKED':
      case 'READY_TO_PACK':
        return {
          label: 'Packing',
          classes: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
          icon: Package,
          dotColor: 'bg-amber-500',
        };
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
      case 'MACHINE_ASSIGNED':
      case 'RELEASED':
        return {
          label: normalizedStatus === 'MACHINE_ASSIGNED' ? 'Line Assigned' : normalizedStatus === 'RELEASED' ? 'Released to Floor' : 'Submitted',
          classes: 'bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
          icon: Clock,
          dotColor: 'bg-blue-500',
        };
      case 'AUTOMATION':
      case 'AUTO':
        return {
          label: 'Auto Workflow',
          classes: 'bg-purple-50 text-purple-800 border-purple-200/80 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
          icon: Zap,
          dotColor: 'bg-purple-500',
        };
      case 'IDLE':
      case 'STANDBY':
      case 'DRAFT':
      case 'PLANNED':
        return {
          label: normalizedStatus === 'IDLE' ? 'Idle / Ready' : normalizedStatus === 'DRAFT' ? 'Draft' : 'Planned',
          classes: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: Layers,
          dotColor: 'bg-slate-400',
        };
      case 'PAUSED':
      case 'MAINTENANCE':
      case 'WARNING':
        return {
          label: normalizedStatus === 'MAINTENANCE' ? 'Maintenance' : 'Paused',
          classes: 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
          icon: AlertTriangle,
          dotColor: 'bg-amber-500',
        };
      case 'REJECTED':
      case 'CANCELLED':
      case 'CRITICAL':
      case 'DOWN':
        return {
          label: normalizedStatus === 'REJECTED' ? 'Rejected' : normalizedStatus === 'DOWN' ? 'Line Down' : 'Cancelled',
          classes: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
          icon: XCircle,
          dotColor: 'bg-rose-500',
        };
      default:
        return {
          label: status || 'Pending',
          classes: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
          icon: Clock,
          dotColor: 'bg-slate-400',
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full border shadow-2xs select-none transition-colors font-sans',
        config.classes,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', config.dotColor)} />
      )}
      <span className="truncate font-semibold tracking-tight">{config.label}</span>
    </span>
  );
};
