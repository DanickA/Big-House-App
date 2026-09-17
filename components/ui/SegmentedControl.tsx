'use client';

import React from 'react';

export interface SegmentedControlOption<T extends string | number> {
  value: T;
  label: React.ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  count?: number;
}

export interface SegmentedControlProps<T extends string | number> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
  ariaLabel?: string;
}

export default function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
  size = 'md',
  fullWidth = true,
  className = '',
  ariaLabel = 'Opciones de selección',
}: SegmentedControlProps<T>) {
  const isSm = size === 'sm';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center p-1 rounded-2xl bg-tertiary dark:bg-tertiary/70 border border-separator backdrop-blur-md select-none ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        const IconComponent = option.icon;

        return (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={`relative flex items-center justify-center text-center gap-1.5 rounded-xl font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
              fullWidth ? 'flex-1' : ''
            } ${
              isSm
                ? 'py-1.5 px-3 apple-caption-2 min-h-[36px]'
                : 'py-2 px-3.5 apple-footnote min-h-[40px]'
            } ${
              isSelected
                ? 'bg-white dark:bg-secondary text-label-primary shadow-xs font-semibold border border-white/80 dark:border-white/10'
                : 'text-label-secondary hover:text-label-primary hover:bg-black/3 dark:hover:bg-white/5 border border-transparent'
            }`}
          >
            {IconComponent && (
              <IconComponent
                size={isSm ? 13 : 15}
                strokeWidth={isSelected ? 2.2 : 1.8}
                className={`shrink-0 ${isSelected ? 'text-terracotta' : 'text-label-tertiary'}`}
              />
            )}
            <span className="truncate text-center inline-block">{option.label}</span>
            {typeof option.count === 'number' && (
              <span
                className={`ml-1 px-1.5 py-0.5 text-[10px] rounded-full font-semibold tabular-nums ${
                  isSelected
                    ? 'bg-terracotta/15 text-terracotta'
                    : 'bg-black/5 dark:bg-white/10 text-label-secondary'
                }`}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
