import React from 'react';
import clsx from 'clsx';
import {
  Cpu,
  Gauge,
  Clock,
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
  goodOutput,
  target,
  speed = '1.85 m/min',
  targetTime = '16:40',
  onViewDetails,
  onExecute,
  className,
}) => {
  const isRunning = status.toUpperCase() === 'RUNNING' || status.toUpperCase() === 'IN_PROGRESS';
  const isWarning = status.toUpperCase() === 'MAINTENANCE' || status.toUpperCase() === 'PAUSED';
  const isDown = status.toUpperCase() === 'DOWN' || status.toUpperCase() === 'OFFLINE';

  const percentage = target > 0 ? Math.min(Math.round((goodOutput / target) * 100), 100) : 0;

  return (
    <div
      className={clsx(
        'group relative border rounded-xl p-2.5 sm:p-3 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-xs',
        isRunning
          ? 'bg-gradient-to-br from-emerald-50/80 via-white to-white dark:from-emerald-950/30 dark:via-slate-900/90 dark:to-slate-900 border-emerald-200/80 dark:border-emerald-800/60 hover:border-emerald-400'
          : isWarning
          ? 'bg-gradient-to-br from-amber-50/80 via-white to-white dark:from-amber-950/30 dark:via-slate-900/90 dark:to-slate-900 border-amber-200/80 dark:border-amber-800/60 hover:border-amber-400'
          : isDown
          ? 'bg-gradient-to-br from-rose-50/80 via-white to-white dark:from-rose-950/30 dark:via-slate-900/90 dark:to-slate-900 border-rose-200/80 dark:border-rose-800/60 hover:border-rose-400'
          : 'bg-gradient-to-br from-slate-50/80 via-white to-white dark:from-slate-850/40 dark:via-slate-900/90 dark:to-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400',
        className
      )}
    >
      <div className="relative z-10">
        {/* Header: Line Name & Status */}
        <div className="flex items-center justify-between gap-1.5 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className={clsx(
                'w-7 h-7 rounded-lg flex items-center justify-center border shadow-xs shrink-0',
                isRunning
                  ? 'bg-emerald-500 text-white border-emerald-400/40'
                  : isWarning
                  ? 'bg-amber-500 text-white border-amber-400/40'
                  : isDown
                  ? 'bg-rose-500 text-white border-rose-400/40'
                  : 'bg-slate-600 text-white border-slate-500/40'
              )}
            >
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-mono font-black uppercase text-blue-600 dark:text-blue-400">
                  {lineId}
                </span>
                <span className="text-[10px] text-slate-300 dark:text-slate-600">•</span>
                <span className="text-[10px] text-slate-400 truncate max-w-[90px]">
                  {type}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                {name}
              </h3>
            </div>
          </div>

          <StatusBadge status={status} size="sm" />
        </div>

        {/* Compact Job Details */}
        <div className="p-2 rounded-lg bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800/60 space-y-1 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-[10px] font-medium">Job / Party:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-[10px] truncate max-w-[120px]">
              {orderNo !== '—' ? orderNo : partyName}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-slate-200/40 dark:border-slate-800/40 pt-1">
            <span className="text-slate-400 text-[10px] font-medium">Product:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400 text-[10px] truncate max-w-[130px]">
              {product}
            </span>
          </div>
        </div>

        {/* Progress & Output */}
        <div className="mt-2 space-y-1">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-slate-500 font-medium">
              Output: <strong className="text-slate-800 dark:text-slate-200 font-bold">{goodOutput.toLocaleString()}</strong>/{target > 0 ? target.toLocaleString() : '—'}
            </span>
            <span
              className={clsx(
                'font-bold text-[10px] px-1 py-0.2 rounded',
                isRunning
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              )}
            >
              {percentage}%
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200/40 dark:border-slate-700/40">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-300',
                isRunning ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-blue-600'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="grid grid-cols-2 gap-1.5 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60 text-[10px]">
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <Gauge className="w-3 h-3 text-blue-500 shrink-0" />
            <span className="truncate">{speed}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 justify-end">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <span className="truncate">ETA: {targetTime}</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      {(onViewDetails || onExecute) && (
        <div className="flex items-center gap-1.5 mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-800/60">
          {onViewDetails && (
            <button
              onClick={onViewDetails}
              className="flex-1 h-6.5 px-2 text-[10px] font-semibold rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Details</span>
              <ArrowUpRight className="w-2.5 h-2.5" />
            </button>
          )}
          {onExecute && isRunning && (
            <button
              onClick={onExecute}
              className="flex-1 h-6.5 px-2 text-[10px] font-semibold rounded-md bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Terminal</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

