import React, { forwardRef } from 'react';
import clsx from 'clsx';

interface Option {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Option[];
  error?: string;
  helperText?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, placeholder, className, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 font-sans">
            {label} {props.required && <span className="text-rose-500">*</span>}
          </label>
        )}
        <div className="relative rounded-xl shadow-2xs">
          <select
            id={selectId}
            ref={ref}
            className={clsx(
              'block w-full rounded-xl bg-white dark:bg-slate-900 border text-slate-900 dark:text-slate-100 text-base sm:text-sm font-medium transition-all cursor-pointer',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 dark:focus:border-blue-500',
              'px-3.5 py-2.5 min-h-[44px]',
              error ? 'border-rose-500 focus:ring-rose-500/20' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="text-slate-400">
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 py-1.5">
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">{error}</p>}
        {!error && helperText && <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

