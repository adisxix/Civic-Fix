import React from 'react';
import { cn } from '../../lib/cn';

export const Input = React.forwardRef(function Input(
  { label, error, icon, className, id, ...props },
  ref,
) {
  const inputId = id || props.name;
  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'w-full py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors placeholder:text-slate-400',
            icon ? 'pl-9 pr-3.5' : 'px-3.5',
            error && 'border-rose-500 focus:ring-rose-500',
            className,
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
});

export default Input;
