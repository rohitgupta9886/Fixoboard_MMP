import React from 'react';
import clsx from 'clsx';
import {
  FilePlus2,
  FileCheck2,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  Package,
  Truck,
  Send,
  ChevronRight,
} from 'lucide-react';

export interface PipelineStage {
  id: string;
  label: string;
  count: number;
  description: string;
  icon: React.ElementType;
  color: 'blue' | 'amber' | 'green' | 'orange' | 'purple' | 'cyan' | 'sky' | 'emerald';
  active?: boolean;
}

export interface OrderPipelineProps {
  stages?: PipelineStage[];
  activeStage?: string;
  onStageSelect?: (stageId: string) => void;
  className?: string;
}

export const OrderPipeline: React.FC<OrderPipelineProps> = ({
  stages,
  activeStage,
  onStageSelect,
  className,
}) => {
  const defaultStages: PipelineStage[] = [
    {
      id: 'NEW',
      label: 'New Orders',
      count: 14,
      description: 'Pending commercial review',
      icon: FilePlus2,
      color: 'blue',
    },
    {
      id: 'REVIEW',
      label: 'Draft & Review',
      count: 8,
      description: 'Specification check',
      icon: FileCheck2,
      color: 'amber',
    },
    {
      id: 'APPROVED',
      label: 'Approved',
      count: 22,
      description: 'Ready for floor scheduling',
      icon: CheckCircle2,
      color: 'green',
    },
    {
      id: 'PRODUCTION',
      label: 'Production',
      count: 48,
      description: 'Extrusion in progress',
      icon: Cpu,
      color: 'orange',
    },
    {
      id: 'QUALITY_CHECK',
      label: 'Quality Check',
      count: 12,
      description: 'Gauge & density QA',
      icon: ShieldCheck,
      color: 'purple',
    },
    {
      id: 'PACKING',
      label: 'Packing',
      count: 19,
      description: 'Bundling & strapping',
      icon: Package,
      color: 'cyan',
    },
    {
      id: 'READY_DISPATCH',
      label: 'Ready for Dispatch',
      count: 15,
      description: 'Staged in loading bay',
      icon: Truck,
      color: 'sky',
    },
    {
      id: 'DISPATCHED',
      label: 'Dispatched',
      count: 64,
      description: 'Gate pass verified',
      icon: Send,
      color: 'emerald',
    },
  ];

  const actualStages = stages || defaultStages;

  const colorStyles: Record<string, { bg: string; text: string; border: string; activeBorder: string; badge: string }> = {
    blue: {
      bg: 'bg-blue-50/70 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-900/60',
      activeBorder: 'border-blue-500 ring-2 ring-blue-500/20 dark:border-blue-400',
      badge: 'bg-blue-600 text-white',
    },
    amber: {
      bg: 'bg-amber-50/70 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-900/60',
      activeBorder: 'border-amber-500 ring-2 ring-amber-500/20 dark:border-amber-400',
      badge: 'bg-amber-600 text-white',
    },
    green: {
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-900/60',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400',
      badge: 'bg-emerald-600 text-white',
    },
    orange: {
      bg: 'bg-orange-50/70 dark:bg-orange-950/40',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-200 dark:border-orange-900/60',
      activeBorder: 'border-orange-500 ring-2 ring-orange-500/20 dark:border-orange-400',
      badge: 'bg-orange-600 text-white',
    },
    purple: {
      bg: 'bg-purple-50/70 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-900/60',
      activeBorder: 'border-purple-500 ring-2 ring-purple-500/20 dark:border-purple-400',
      badge: 'bg-purple-600 text-white',
    },
    cyan: {
      bg: 'bg-cyan-50/70 dark:bg-cyan-950/40',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-200 dark:border-cyan-900/60',
      activeBorder: 'border-cyan-500 ring-2 ring-cyan-500/20 dark:border-cyan-400',
      badge: 'bg-cyan-600 text-white',
    },
    sky: {
      bg: 'bg-sky-50/70 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-900/60',
      activeBorder: 'border-sky-500 ring-2 ring-sky-500/20 dark:border-sky-400',
      badge: 'bg-sky-600 text-white',
    },
    emerald: {
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-900/60',
      activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/20 dark:border-emerald-400',
      badge: 'bg-emerald-600 text-white',
    },
  };

  return (
    <div className={clsx('w-full overflow-x-auto pb-2 scrollbar-none', className)}>
      <div className="flex items-center gap-2 min-w-max">
        {actualStages.map((stage, idx) => {
          const Icon = stage.icon;
          const style = colorStyles[stage.color] || colorStyles.blue;
          const isSelected = activeStage === stage.id;

          return (
            <React.Fragment key={stage.id}>
              <div
                onClick={() => onStageSelect && onStageSelect(stage.id)}
                className={clsx(
                  'group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl border bg-white dark:bg-slate-900 shadow-2xs transition-all duration-200',
                  onStageSelect && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
                  isSelected
                    ? style.activeBorder
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                )}
              >
                <div
                  className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-transform group-hover:scale-105',
                    style.bg,
                    style.text,
                    style.border
                  )}
                >
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight whitespace-nowrap">
                      {stage.label}
                    </span>
                    <span
                      className={clsx(
                        'px-1.5 py-0.5 rounded-full font-num font-bold text-[11px] shrink-0',
                        style.badge
                      )}
                    >
                      {stage.count}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-[130px] font-medium">
                    {stage.description}
                  </p>
                </div>
              </div>

              {idx < actualStages.length - 1 && (
                <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
