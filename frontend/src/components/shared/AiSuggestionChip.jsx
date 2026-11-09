import React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '../../lib/cn';

export function AiSuggestionChip({ label, confidence, categoryName, source = 'groq', className }) {
  const isAi = source === 'groq' || source === 'ai';
  const displayLabel =
    label ||
    categoryName ||
    (confidence ? `${Math.round(confidence * 100)}% match` : 'AI Suggestion');

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
        isAi
          ? 'bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-xs'
          : 'bg-slate-100 text-slate-800 border border-slate-300',
        className,
      )}
    >
      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
      {isAi ? 'AI Suggestion: ' : 'Suggested: '}
      <span className="font-bold">{displayLabel}</span>
    </span>
  );
}

export default AiSuggestionChip;
