import React from 'react';
import { cn } from '../../lib/cn';

export function Card({ children, className, ...props }) {
  return (
    <div
      className={cn(
        'bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
