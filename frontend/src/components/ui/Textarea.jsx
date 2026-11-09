import React from 'react';
import { cn } from '../../lib/cn';

export const Textarea = React.forwardRef(function Textarea(
  { label, error, className, id, rows = 3, ...props },
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
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={cn(
          'w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 transition-colors placeholder:text-slate-400 resize-y',
          error && 'border-rose-500 focus:ring-rose-500',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
    </div>
  );
});

export default Textarea;
