import React from 'react';
import { Check } from 'lucide-react';

export interface StepItem {
  id: string | number;
  label: string;
  sublabel?: string;
  status: 'complete' | 'current' | 'upcoming';
}

interface StepperProps {
  steps: StepItem[];
  onStepClick?: (stepId: string | number) => void;
  orientation?: 'horizontal' | 'vertical';
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  onStepClick,
  orientation = 'horizontal',
}) => {
  if (orientation === 'vertical') {
    return (
      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isComplete = step.status === 'complete';
          const isCurrent = step.status === 'current';

          return (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => onStepClick && onStepClick(step.id)}
                  disabled={!onStepClick}
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-num text-xs font-bold transition-all ${
                    isComplete
                      ? 'bg-emerald-600 text-white shadow-glow-emerald/30'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/80 shadow-glow-brand/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isComplete ? <Check className="w-4.5 h-4.5 stroke-[2.5]" /> : idx + 1}
                </button>
                {idx !== steps.length - 1 && (
                  <div
                    className={`w-0.5 h-10 my-1 transition-colors ${
                      isComplete ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                )}
              </div>
              <div className="pt-1">
                <p
                  className={`text-sm font-bold ${
                    isCurrent
                      ? 'text-slate-900 dark:text-white'
                      : isComplete
                      ? 'text-slate-800 dark:text-slate-200'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
                {step.sublabel && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                    {step.sublabel}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isComplete = step.status === 'complete';
          const isCurrent = step.status === 'current';

          return (
            <React.Fragment key={step.id}>
              <div
                className="flex flex-col items-center relative z-10 cursor-pointer group"
                onClick={() => onStepClick && onStepClick(step.id)}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-num text-xs font-bold transition-all ${
                    isComplete
                      ? 'bg-emerald-600 text-white shadow-glow-emerald/30'
                      : isCurrent
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-950/80 shadow-glow-brand/40'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 group-hover:border-slate-400'
                  }`}
                >
                  {isComplete ? <Check className="w-4.5 h-4.5 stroke-[2.5]" /> : idx + 1}
                </div>
                <span
                  className={`text-xs mt-2 font-bold text-center whitespace-nowrap ${
                    isCurrent
                      ? 'text-slate-900 dark:text-white'
                      : isComplete
                      ? 'text-slate-800 dark:text-slate-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx !== steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 -mt-5 transition-colors ${
                    isComplete
                      ? 'bg-emerald-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

