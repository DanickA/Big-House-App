'use client';

import React from 'react';

export interface AppleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  label?: React.ReactNode;
  description?: React.ReactNode;
  accentColor?: 'olive' | 'purple' | 'amber' | 'blue' | 'terracotta';
  size?: 'md' | 'sm';
  ariaLabel?: string;
  className?: string;
}

const ACCENT_BG = {
  olive: 'bg-[#5F6F52] dark:bg-olive',
  purple: 'bg-[#7C3AED] dark:bg-purple-600',
  amber: 'bg-[#D97706] dark:bg-amber-600',
  blue: 'bg-[#2563EB] dark:bg-blue-600',
  terracotta: 'bg-terracotta dark:bg-terracotta',
};

export default function AppleSwitch({
  checked,
  onChange,
  id,
  name,
  disabled = false,
  label,
  description,
  accentColor = 'olive',
  size = 'md',
  ariaLabel,
  className = '',
}: AppleSwitchProps) {
  const isSm = size === 'sm';

  // Dimensiones canónicas de Apple HIG
  // Track: md = 51x31px, sm = 42x26px
  // Knob:  md = 27x27px, sm = 22x22px
  const trackWidth = isSm ? 'w-[42px]' : 'w-[51px]';
  const trackHeight = isSm ? 'h-[26px]' : 'h-[31px]';
  const knobSize = isSm ? 'w-[22px] h-[22px]' : 'w-[27px] h-[27px]';
  const knobOffset = isSm ? 'translate-x-[16px]' : 'translate-x-[20px]';

  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  const switchElement = (
    <div
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || (typeof label === 'string' ? label : undefined)}
      tabIndex={disabled ? -1 : 0}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`touch-target relative inline-flex items-center justify-center cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-olive/50 rounded-full transition-opacity ${
        disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : 'active:scale-95'
      }`}
    >
      {/* Hidden input for form submits if name is supplied */}
      {name && (
        <input
          type="checkbox"
          id={id}
          name={name}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
      )}

      {/* Píldora del track */}
      <div
        className={`${trackWidth} ${trackHeight} rounded-full transition-colors duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] p-[2px] flex items-center ${
          checked
            ? ACCENT_BG[accentColor]
            : 'bg-[#D9CEBC] dark:bg-[#383C34]'
        }`}
      >
        {/* Perilla deslizante con sombra Apple HIG */}
        <div
          className={`${knobSize} rounded-full bg-white switch-thumb-shadow transition-transform duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] transform ${
            checked ? knobOffset : 'translate-x-[2px]'
          }`}
        />
      </div>
    </div>
  );

  if (!label && !description) {
    return <div className={`inline-flex items-center ${className}`}>{switchElement}</div>;
  }

  return (
    <div
      className={`flex items-center justify-between gap-3 ${
        disabled ? 'opacity-50 pointer-events-none' : 'cursor-pointer'
      } ${className}`}
      onClick={handleToggle}
    >
      <div className="flex-1 min-w-0 select-none">
        {label && (
          <span className="block text-xs font-black uppercase tracking-wider text-label-primary">
            {label}
          </span>
        )}
        {description && (
          <p className="text-[11px] text-label-secondary font-medium mt-0.5">
            {description}
          </p>
        )}
      </div>
      <div onClick={(e) => e.stopPropagation()}>
        {switchElement}
      </div>
    </div>
  );
}
