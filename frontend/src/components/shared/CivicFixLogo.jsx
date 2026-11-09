import React from 'react';

export function CivicFixLogo({
  className = '',
  size = 36,
  showText = true,
  textClassName = 'text-ink',
  tagline = false,
}) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* CivicFix SVG Emblem */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform hover:scale-105"
      >
        {/* Outer shield container */}
        <rect width="40" height="40" rx="12" fill="#122D27" />

        {/* Dynamic civic radar rings */}
        <circle cx="20" cy="18" r="14" stroke="#1B3B33" strokeWidth="1.5" opacity="0.6" />
        <circle cx="20" cy="18" r="9" stroke="#245445" strokeWidth="1.5" opacity="0.8" />

        {/* Central Pin & Fix Checkmark */}
        <path
          d="M20 7C14.477 7 10 11.477 10 17C10 23.5 18.2 31.8 19.3 32.9C19.7 33.3 20.3 33.3 20.7 32.9C21.8 31.8 30 23.5 30 17C30 11.477 25.523 7 20 7Z"
          fill="#1B3B33"
          stroke="#C8EC78"
          strokeWidth="1.75"
        />

        {/* Inner fix checkmark in vibrant lime */}
        <path
          d="M16 16.8L18.8 19.6L24.2 13.8"
          stroke="#C8EC78"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Live status dot */}
        <circle cx="20" cy="24" r="1.8" fill="#C8EC78" />
      </svg>

      {showText && (
        <div className="flex flex-col text-left">
          <div className="flex items-center gap-1">
            <span className={`text-xl font-black tracking-tight leading-none ${textClassName}`}>
              Civic<span className="text-lime-600 dark:text-lime">Fix</span>
            </span>
          </div>
          {tagline && (
            <span className="text-[10px] font-medium text-moss tracking-wider uppercase mt-0.5">
              Verified Action
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default CivicFixLogo;
