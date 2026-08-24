import React from 'react';
import clsx from 'clsx';
import {
  Cpu,
  Activity,
  Gauge,
  Clock,
  User,
  AlertTriangle,
  Play,
  Pause,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge';

export interface FactoryMachineCardProps {
  lineId: number | string;
  name: string;
  type?: string;
  status: 'RUNNING' | 'STANDBY' | 'MAINTENANCE' | 'OFFLINE' | 'DOWN' | string;
  orderNo?: string;
  partyName?: string;
  product?: string;
  specification?: string;
  goodOutput: number;
  target: number;
  efficiency?: number;
  speed?: string | number;
  operator?: string;
  targetTime?: string;
  onViewDetails?: () => void;
  onExecute?: () => void;
  className?: string;
}

export const FactoryMachineCard: React.FC<FactoryMachineCardProps> = ({
  lineId,
  name,
  type = 'Extrusion Line',
  status,
  orderNo = '—',
  partyName = '—',
  product = 'Ready for Assignment',
  specification,
  goodOutput,
  target,
  efficiency,
  speed = '1.85 m/min',
  operator = 'Shift A Operator',
  targetTime = 'Today 16:40',
  onViewDetails,
  onExecute,
  className,
}) => {
  const isRunning = status.toUpperCase() === 'RUNNING' || status.toUpperCase() === 'IN_PROGRESS';
  const isStandby = status.toUpperCase() === 'STANDBY' || status.toUpperCase() === 'IDLE';
  const isWarning = status.toUpperCase() === 'MAINTENANCE' || status.toUpperCase() === 'PAUSED';
  const isDown = status.toUpperCase() === 'DOWN' || status.toUpperCase() === 'OFFLINE';

  const percentage = target > 0 ? Math.min(Math.round((goodOutput / target) * 100), 100) : 0;
  const computedEfficiency = efficiency !== undefined ? efficiency : percentage;

  return (
    <div
      className={clsx(
        'group relative border rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden',
        isRunning
          ? 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white dark:from-emerald-950/40 dark:via-emerald-900/15 dark:to-slate-900/95 border-emerald-200/90 dark:border-emerald-800/70 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-sm shadow-emerald-500/5 hover:shadow-md hover:shadow-emerald-500/10'
          : isWarning
          ? 'bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white dark:from-amber-950/40 dark:via-amber-900/15 dark:to-slate-900/95 border-amber-200/90 dark:border-amber-800/70 hover:border-amber-400 dark:hover:border-amber-500 shadow-sm shadow-amber-500/5 hover:shadow-md hover:shadow-amber-500/10'
          : isDown
          ? 'bg-gradient-to-br from-rose-50/90 via-rose-50/40 to-white dark:from-rose-950/40 dark:via-rose-900/15 dark:to-slate-900/95 border-rose-200/90 dark:border-rose-800/70 hover:border-rose-400 dark:hover:border-rose-500 shadow-sm shadow-rose-500/5 hover:shadow-md hover:shadow-rose-500/10'
          : 'bg-gradient-to-br from-blue-50/80 via-blue-50/30 to-white dark:from-blue-950/30 dark:via-slate-900/60 dark:to-slate-900/95 border-blue-200/80 dark:border-blue-900/60 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm shadow-blue-500/5',
        className
      )}
    >
      {/* Ambient background glow orb */}
      <div
        className={clsx(
          'absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-30 dark:opacity-15 transition-opacity duration-300 group-hover:opacity-70',
          isRunning
            ? 'bg-emerald-400'
            : isWarning
            ? 'bg-amber-400'
            : isDown
            ? 'bg-rose-400'
            : 'bg-blue-400'
        )}
      />

      {/* Header: Line Title & Live Status */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={clsx(
                'w-9 h-9 rounded-xl flex items-center justify-center border shadow-md shrink-0 transition-transform duration-300 group-hover:scale-105',
                isRunning
                  ? 'bg-emerald-500 text-white border-emerald-400/40 shadow-emerald-500/30'
                  : isWarning
                  ? 'bg-amber-500 text-white border-amber-400/40 shadow-amber-500/30'
                  : isDown
                  ? 'bg-rose-500 text-white border-rose-400/40 shadow-rose-500/30'
                  : 'bg-blue-500 text-white border-blue-400/40 shadow-blue-500/30'
              )}
            >
              <Cpu className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono font-black uppercase tracking-wider text-blue-700 dark:text-blue-400">
                  {lineId}
                </span>
                <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold truncate">
                  {type}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-50 tracking-tight leading-snug truncate">
                {name}
              </h3>
            </div>
          </div>

          <StatusBadge status={status} size="sm" />
        </div>

        {/* Active Production Details */}
        <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Active Job:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
              {orderNo}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Customer:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px] text-xs">
              {partyName}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
            <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Product:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400 truncate max-w-[160px] text-xs">
              {product}
            </span>
          </div>
        </div>

        {/* Progress & Units Output */}
        <div className="mt-3.5 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="font-medium text-slate-500 dark:text-slate-400 text-[11px]">Output:</span>
              <span className="font-num font-bold text-slate-900 dark:text-slate-50 text-xs">
                {goodOutput.toLocaleString()} / {target > 0 ? target.toLocaleString() : '—'} Shts
              </span>
            </div>
            <span
              className={clsx(
                'font-num font-bold text-[11px] px-1.5 py-0.2 rounded',
                isRunning
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              {percentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/50 dark:border-slate-700/50">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500',
                isRunning
                  ? 'bg-emerald-500'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-blue-600'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Telemetry Metrics Strip */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate">Speed: <strong className="text-slate-700 dark:text-slate-300">{speed}</strong></span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 justify-end">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">ETA: <strong className="text-slate-700 dark:text-slate-300">{targetTime}</strong></span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {(onViewDetails || onExecute) && (
        <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/70">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 h-8 px-2.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Details</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
          {onExecute && isRunning && (
            <button
              onClick={onExecute}
              className="flex-1 h-8 px-2.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Terminal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
