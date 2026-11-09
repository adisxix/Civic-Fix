import React from 'react';
import { HardHat, Lightbulb, Trash2, Waves, Droplets, Tag } from 'lucide-react';
import { cn } from '../../lib/cn';

const ICON_MAP = {
  pothole: HardHat,
  construction: HardHat,
  roads: HardHat,
  streetlight: Lightbulb,
  lighting: Lightbulb,
  lamp: Lightbulb,
  garbage: Trash2,
  sanitation: Trash2,
  'trash-2': Trash2,
  drainage: Waves,
  waves: Waves,
  water_leakage: Droplets,
  water: Droplets,
  droplets: Droplets,
};

export function CategoryBadge({ category, categoryName, categoryCode, className }) {
  const code = (
    categoryCode || (typeof category === 'string' ? category : category?.code || '')
  ).toLowerCase();
  const name = categoryName || (typeof category === 'string' ? category : category?.name || code);

  let Icon = Tag;
  for (const [key, iconComponent] of Object.entries(ICON_MAP)) {
    if (code.includes(key)) {
      Icon = iconComponent;
      break;
    }
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-200',
        className,
      )}
    >
      <Icon className="w-3.5 h-3.5 text-slate-600" />
      {name || 'Civic'}
    </span>
  );
}

export default CategoryBadge;
