import React from 'react';
import { cn } from '../../lib/cn';

export function IllustrativeDataBadge({ className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-900 border border-amber-200',
        className,
      )}
    >
      Illustrative demo data
    </span>
  );
}

export default IllustrativeDataBadge;
