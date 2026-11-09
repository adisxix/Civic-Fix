import React from 'react';
import { Card } from '../ui/Card';
import { cn } from '../../lib/cn';

export function StatCard({ title, value, subtitle, icon: Icon, delta, className }) {
  return (
    <Card className={cn('p-5 flex flex-col justify-between', className)}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase font-bold tracking-wider text-moss">{title}</span>
        {Icon && (
          <div className="p-2 rounded-xl bg-mist text-forest-800">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <div className="text-3xl font-extrabold text-ink tracking-tight mb-1">{value}</div>
        {(subtitle || delta !== undefined) && (
          <p className="text-xs text-moss flex items-center gap-1.5">
            {delta !== undefined && (
              <span className={cn('font-bold', delta >= 0 ? 'text-forest-700' : 'text-danger')}>
                {delta >= 0 ? `+${delta}` : delta}
              </span>
            )}
            {subtitle}
          </p>
        )}
      </div>
    </Card>
  );
}

export default StatCard;
