import React from 'react';
import clsx from 'clsx';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

export type StatCardColor =
  | 'blue'
  | 'green'
  | 'emerald'
  | 'amber'
  | 'yellow'
  | 'red'
  | 'rose'
  | 'purple'
  | 'violet'
  | 'cyan'
  | 'orange'
  | 'gray'
  | 'indigo'
  | 'sky';

export interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    isNeutral?: boolean;
    period?: string;
  };
  icon: React.ReactNode;
  variant?: StatCardColor;
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  isLoading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  unit,
  trend,
  icon,
  variant = 'blue',
  subtitle,
  onClick,
  className,
  isLoading = false,
}) => {
  const variantStyles: Record<
    string,
    {
      cardBg: string;
      titleColor: string;
      valueColor: string;
      iconBg: string;
      glowColor: string;
      divider: string;
      indicatorDot: string;
      textHighlight: string;
    }
  > = {
    blue: {
      cardBg: 'bg-gradient-to-br from-blue-50/90 via-blue-50/40 to-white dark:from-blue-950/40 dark:via-blue-900/20 dark:to-slate-900/95 border-blue-200/90 dark:border-blue-800/70 hover:border-blue-400 dark:hover:border-blue-500 shadow-sm shadow-blue-500/5 hover:shadow-md hover:shadow-blue-500/10',
      titleColor: 'text-blue-700 dark:text-blue-300',
      valueColor: 'text-blue-950 dark:text-blue-50',
      iconBg: 'bg-blue-500 text-white shadow-md shadow-blue-500/30 border-blue-400/30',
      glowColor: 'bg-blue-400',
      divider: 'border-blue-100/80 dark:border-blue-900/40',
      indicatorDot: 'bg-blue-500',
      textHighlight: 'text-blue-600 dark:text-blue-400',
    },
    green: {
      cardBg: 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-slate-900/95 border-emerald-200/90 dark:border-emerald-800/70 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-sm shadow-emerald-500/5 hover:shadow-md hover:shadow-emerald-500/10',
      titleColor: 'text-emerald-700 dark:text-emerald-300',
      valueColor: 'text-emerald-950 dark:text-emerald-50',
      iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 border-emerald-400/30',
      glowColor: 'bg-emerald-400',
      divider: 'border-emerald-100/80 dark:border-emerald-900/40',
      indicatorDot: 'bg-emerald-500',
      textHighlight: 'text-emerald-600 dark:text-emerald-400',
    },
    emerald: {
      cardBg: 'bg-gradient-to-br from-emerald-50/90 via-emerald-50/40 to-white dark:from-emerald-950/40 dark:via-emerald-900/20 dark:to-slate-900/95 border-emerald-200/90 dark:border-emerald-800/70 hover:border-emerald-400 dark:hover:border-emerald-500 shadow-sm shadow-emerald-500/5 hover:shadow-md hover:shadow-emerald-500/10',
      titleColor: 'text-emerald-700 dark:text-emerald-300',
      valueColor: 'text-emerald-950 dark:text-emerald-50',
      iconBg: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30 border-emerald-400/30',
      glowColor: 'bg-emerald-400',
      divider: 'border-emerald-100/80 dark:border-emerald-900/40',
      indicatorDot: 'bg-emerald-500',
      textHighlight: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      cardBg: 'bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-white dark:from-amber-950/40 dark:via-amber-900/20 dark:to-slate-900/95 border-amber-200/90 dark:border-amber-800/70 hover:border-amber-400 dark:hover:border-amber-500 shadow-sm shadow-amber-500/5 hover:shadow-md hover:shadow-amber-500/10',
      titleColor: 'text-amber-750 dark:text-amber-300',
      valueColor: 'text-amber-950 dark:text-amber-50',
      iconBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/30 border-amber-400/30',
      glowColor: 'bg-amber-400',
      divider: 'border-amber-100/80 dark:border-amber-900/40',
      indicatorDot: 'bg-amber-500',
      textHighlight: 'text-amber-600 dark:text-amber-400',
    },
    yellow: {
      cardBg: 'bg-gradient-to-br from-yellow-50/90 via-amber-50/40 to-white dark:from-amber-950/40 dark:via-amber-900/20 dark:to-slate-900/95 border-amber-200/90 dark:border-amber-800/70 hover:border-amber-400 dark:hover:border-amber-500 shadow-sm shadow-amber-500/5 hover:shadow-md hover:shadow-amber-500/10',
      titleColor: 'text-amber-700 dark:text-amber-300',
      valueColor: 'text-amber-950 dark:text-amber-50',
      iconBg: 'bg-amber-500 text-white shadow-md shadow-amber-500/30 border-amber-400/30',
      glowColor: 'bg-amber-400',
      divider: 'border-amber-100/80 dark:border-amber-900/40',
      indicatorDot: 'bg-amber-500',
      textHighlight: 'text-amber-600 dark:text-amber-400',
    },
    orange: {
      cardBg: 'bg-gradient-to-br from-orange-50/90 via-orange-50/40 to-white dark:from-orange-950/40 dark:via-orange-900/20 dark:to-slate-900/95 border-orange-200/90 dark:border-orange-800/70 hover:border-orange-400 dark:hover:border-orange-500 shadow-sm shadow-orange-500/5 hover:shadow-md hover:shadow-orange-500/10',
      titleColor: 'text-orange-700 dark:text-orange-300',
      valueColor: 'text-orange-950 dark:text-orange-50',
      iconBg: 'bg-orange-500 text-white shadow-md shadow-orange-500/30 border-orange-400/30',
      glowColor: 'bg-orange-400',
      divider: 'border-orange-100/80 dark:border-orange-900/40',
      indicatorDot: 'bg-orange-500',
      textHighlight: 'text-orange-600 dark:text-orange-400',
    },
    red: {
      cardBg: 'bg-gradient-to-br from-rose-50/90 via-rose-50/40 to-white dark:from-rose-950/40 dark:via-rose-900/20 dark:to-slate-900/95 border-rose-200/90 dark:border-rose-800/70 hover:border-rose-400 dark:hover:border-rose-500 shadow-sm shadow-rose-500/5 hover:shadow-md hover:shadow-rose-500/10',
      titleColor: 'text-rose-700 dark:text-rose-300',
      valueColor: 'text-rose-950 dark:text-rose-50',
      iconBg: 'bg-rose-500 text-white shadow-md shadow-rose-500/30 border-rose-400/30',
      glowColor: 'bg-rose-400',
      divider: 'border-rose-100/80 dark:border-rose-900/40',
      indicatorDot: 'bg-rose-500',
      textHighlight: 'text-rose-600 dark:text-rose-400',
    },
    rose: {
      cardBg: 'bg-gradient-to-br from-rose-50/90 via-rose-50/40 to-white dark:from-rose-950/40 dark:via-rose-900/20 dark:to-slate-900/95 border-rose-200/90 dark:border-rose-800/70 hover:border-rose-400 dark:hover:border-rose-500 shadow-sm shadow-rose-500/5 hover:shadow-md hover:shadow-rose-500/10',
      titleColor: 'text-rose-700 dark:text-rose-300',
      valueColor: 'text-rose-950 dark:text-rose-50',
      iconBg: 'bg-rose-500 text-white shadow-md shadow-rose-500/30 border-rose-400/30',
      glowColor: 'bg-rose-400',
      divider: 'border-rose-100/80 dark:border-rose-900/40',
      indicatorDot: 'bg-rose-500',
      textHighlight: 'text-rose-600 dark:text-rose-400',
    },
    purple: {
      cardBg: 'bg-gradient-to-br from-purple-50/90 via-purple-50/40 to-white dark:from-purple-950/40 dark:via-purple-900/20 dark:to-slate-900/95 border-purple-200/90 dark:border-purple-800/70 hover:border-purple-400 dark:hover:border-purple-500 shadow-sm shadow-purple-500/5 hover:shadow-md hover:shadow-purple-500/10',
      titleColor: 'text-purple-700 dark:text-purple-300',
      valueColor: 'text-purple-950 dark:text-purple-50',
      iconBg: 'bg-purple-500 text-white shadow-md shadow-purple-500/30 border-purple-400/30',
      glowColor: 'bg-purple-400',
      divider: 'border-purple-100/80 dark:border-purple-900/40',
      indicatorDot: 'bg-purple-500',
      textHighlight: 'text-purple-600 dark:text-purple-400',
    },
    violet: {
      cardBg: 'bg-gradient-to-br from-violet-50/90 via-violet-50/40 to-white dark:from-violet-950/40 dark:via-violet-900/20 dark:to-slate-900/95 border-violet-200/90 dark:border-violet-800/70 hover:border-violet-400 dark:hover:border-violet-500 shadow-sm shadow-violet-500/5 hover:shadow-md hover:shadow-violet-500/10',
      titleColor: 'text-violet-700 dark:text-violet-300',
      valueColor: 'text-violet-950 dark:text-violet-50',
      iconBg: 'bg-violet-500 text-white shadow-md shadow-violet-500/30 border-violet-400/30',
      glowColor: 'bg-violet-400',
      divider: 'border-violet-100/80 dark:border-violet-900/40',
      indicatorDot: 'bg-violet-500',
      textHighlight: 'text-violet-600 dark:text-violet-400',
    },
    cyan: {
      cardBg: 'bg-gradient-to-br from-cyan-50/90 via-cyan-50/40 to-white dark:from-cyan-950/40 dark:via-cyan-900/20 dark:to-slate-900/95 border-cyan-200/90 dark:border-cyan-800/70 hover:border-cyan-400 dark:hover:border-cyan-500 shadow-sm shadow-cyan-500/5 hover:shadow-md hover:shadow-cyan-500/10',
      titleColor: 'text-cyan-700 dark:text-cyan-300',
      valueColor: 'text-cyan-950 dark:text-cyan-50',
      iconBg: 'bg-cyan-500 text-white shadow-md shadow-cyan-500/30 border-cyan-400/30',
      glowColor: 'bg-cyan-400',
      divider: 'border-cyan-100/80 dark:border-cyan-900/40',
      indicatorDot: 'bg-cyan-500',
      textHighlight: 'text-cyan-600 dark:text-cyan-400',
    },
    sky: {
      cardBg: 'bg-gradient-to-br from-sky-50/90 via-sky-50/40 to-white dark:from-sky-950/40 dark:via-sky-900/20 dark:to-slate-900/95 border-sky-200/90 dark:border-sky-800/70 hover:border-sky-400 dark:hover:border-sky-500 shadow-sm shadow-sky-500/5 hover:shadow-md hover:shadow-sky-500/10',
      titleColor: 'text-sky-700 dark:text-sky-300',
      valueColor: 'text-sky-950 dark:text-sky-50',
      iconBg: 'bg-sky-500 text-white shadow-md shadow-sky-500/30 border-sky-400/30',
      glowColor: 'bg-sky-400',
      divider: 'border-sky-100/80 dark:border-sky-900/40',
      indicatorDot: 'bg-sky-500',
      textHighlight: 'text-sky-600 dark:text-sky-400',
    },
    indigo: {
      cardBg: 'bg-gradient-to-br from-indigo-50/90 via-indigo-50/40 to-white dark:from-indigo-950/40 dark:via-indigo-900/20 dark:to-slate-900/95 border-indigo-200/90 dark:border-indigo-800/70 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-sm shadow-indigo-500/5 hover:shadow-md hover:shadow-indigo-500/10',
      titleColor: 'text-indigo-700 dark:text-indigo-300',
      valueColor: 'text-indigo-950 dark:text-indigo-50',
      iconBg: 'bg-indigo-500 text-white shadow-md shadow-indigo-500/30 border-indigo-400/30',
      glowColor: 'bg-indigo-400',
      divider: 'border-indigo-100/80 dark:border-indigo-900/40',
      indicatorDot: 'bg-indigo-500',
      textHighlight: 'text-indigo-600 dark:text-indigo-400',
    },
    gray: {
      cardBg: 'bg-gradient-to-br from-slate-100/90 via-slate-50/40 to-white dark:from-slate-800/50 dark:via-slate-850/20 dark:to-slate-900/95 border-slate-200/90 dark:border-slate-750 hover:border-slate-400 dark:hover:border-slate-600 shadow-sm shadow-slate-500/5',
      titleColor: 'text-slate-700 dark:text-slate-300',
      valueColor: 'text-slate-900 dark:text-slate-50',
      iconBg: 'bg-slate-700 dark:bg-slate-600 text-white shadow-md shadow-slate-500/20 border-slate-600/30',
      glowColor: 'bg-slate-400',
      divider: 'border-slate-200/80 dark:border-slate-800/60',
      indicatorDot: 'bg-slate-500',
      textHighlight: 'text-slate-700 dark:text-slate-300',
    },
  };

  const style = variantStyles[variant] || variantStyles.blue;

  return (
    <div
      onClick={onClick}
      className={clsx(
        'group relative border rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between overflow-hidden',
        style.cardBg,
        onClick && 'cursor-pointer hover:-translate-y-1 active:scale-[0.99]',
        className
      )}
    >
      {/* Ambient background glow orb */}
      <div
        className={clsx(
          'absolute -top-10 -right-10 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-25 dark:opacity-15 transition-opacity duration-300 group-hover:opacity-60',
          style.glowColor
        )}
      />

      {/* Header: Title & Icon */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-2.5">
        <span className={clsx('text-[11px] font-extrabold uppercase tracking-wider', style.titleColor)}>
          {title}
        </span>
        <div
          className={clsx(
            'w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform duration-300 group-hover:scale-110',
            style.iconBg
          )}
        >
          {icon}
        </div>
      </div>

      {/* Main Metric Value */}
      <div className="relative z-10 flex items-baseline gap-1.5 mb-2.5">
        {isLoading ? (
          <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md" />
        ) : (
          <span className={clsx('text-2xl sm:text-3xl font-black font-num tracking-tight', style.valueColor)}>
            {value}
          </span>
        )}
        {unit && !isLoading && (
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider font-sans">
            {unit}
          </span>
        )}
      </div>

      {/* Subtitle / Context */}
      <div
        className={clsx(
          'relative z-10 flex items-center justify-between gap-2 pt-2.5 border-t text-xs font-medium',
          style.divider
        )}
      >
        {trend ? (
          <div className="flex items-center gap-1.5">
            <span
              className={clsx(
                'inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-bold text-[10px] shadow-2xs',
                trend.isNeutral
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  : trend.isPositive
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300'
              )}
            >
              {trend.isNeutral ? (
                <Minus className="w-2.5 h-2.5" />
              ) : trend.isPositive ? (
                <ArrowUpRight className="w-2.5 h-2.5" />
              ) : (
                <ArrowDownRight className="w-2.5 h-2.5" />
              )}
              {trend.value}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
              {trend.period || 'vs last week'}
            </span>
          </div>
        ) : (
          <span className="text-[11px] text-slate-600 dark:text-slate-300 font-semibold truncate">
            {subtitle || 'Database synced'}
          </span>
        )}

        {/* Live dot */}
        <span className="flex h-2 w-2 relative shrink-0">
          <span
            className={clsx(
              'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
              style.indicatorDot
            )}
          />
          <span className={clsx('relative inline-flex rounded-full h-2 w-2', style.indicatorDot)} />
        </span>
      </div>
    </div>
  );
};

