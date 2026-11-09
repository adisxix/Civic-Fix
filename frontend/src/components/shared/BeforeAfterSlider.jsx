import React, { useState } from 'react';
import { cn } from '../../lib/cn';

export function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeImage,
  afterImage,
  beforeLabel,
  afterLabel,
  className,
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const before = beforeUrl || beforeImage;
  const after = afterUrl || afterImage;

  if (!before && !after) return null;
  if (!after) {
    return (
      <div className={cn('relative rounded-xl overflow-hidden border border-slate-200', className)}>
        <img src={before} alt="Report evidence" className="w-full h-64 object-cover" />
        <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2.5 py-1 rounded-md">
          {beforeLabel || 'Initial Report Photo'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden border border-slate-200 select-none h-72 md:h-80',
        className,
      )}
    >
      {/* After Image (Background) */}
      <img
        src={after}
        alt="Fix completed"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <span className="absolute top-3 right-3 z-10 bg-emerald-800/90 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-md shadow">
        {afterLabel || 'After Fix (Repair Proof)'}
      </span>

      {/* Before Image (Clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${sliderPos}%` }}>
        <img
          src={before || after}
          alt="Initial problem"
          className="absolute inset-0 w-full h-full object-cover max-w-none"
          style={{ width: '100%', height: '100%' }}
        />
        <span className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-md">
          {beforeLabel || 'Before Fix'}
        </span>
      </div>

      {/* Draggable Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow cursor-ew-resize flex items-center justify-center"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="w-6 h-6 rounded-full bg-white shadow-md border border-slate-300 flex items-center justify-center text-[10px] text-slate-700 font-bold">
          ↔
        </div>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        value={sliderPos}
        onChange={(e) => setSliderPos(Number(e.target.value))}
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
      />
    </div>
  );
}

export default BeforeAfterSlider;
