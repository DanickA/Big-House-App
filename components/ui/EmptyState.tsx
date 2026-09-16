'use client';

import React from 'react';

export interface EmptyStateProps {
  icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  };
  compact?: boolean;
  className?: string;
}

export default function EmptyState({
  icon: IconComponent,
  title,
  description,
  action,
  compact = false,
  className = '',
}: EmptyStateProps) {
  const ActionIcon = action?.icon;

  return (
    <div
      className={`text-center space-y-3.5 select-none ${
        compact
          ? 'py-6 px-4 bg-white/40 dark:bg-tertiary/30 rounded-2xl border border-[#E8E0D2] dark:border-separator'
          : 'py-10 px-6 glass-card rounded-[2.5rem] border border-white/80 dark:border-white/10 shadow-xs'
      } ${className}`}
    >
      {/* 1. Squircle Badge con Icono Temático */}
      <div
        className={`${
          compact ? 'w-12 h-12 rounded-2xl' : 'w-16 h-16 rounded-3xl'
        } bg-[#EEF2EA] dark:bg-secondary border border-[#DCE7D3] dark:border-separator text-olive flex items-center justify-center mx-auto shadow-2xs`}
        aria-hidden="true"
      >
        <IconComponent
          size={compact ? 22 : 30}
          strokeWidth={2}
          className="text-olive"
        />
      </div>

      {/* 2. Título y 3. Descripción */}
      <div className="space-y-1">
        <h3
          className={`${
            compact ? 'text-sm' : 'text-base'
          } font-black text-label-primary tracking-tight`}
        >
          {title}
        </h3>
        <p className="text-xs text-label-secondary font-medium max-w-sm mx-auto leading-relaxed">
          {description}
        </p>
      </div>

      {/* 4. Llamada a la acción (CTA) directa */}
      {action && (
        <div className="pt-1">
          <button
            type="button"
            onClick={action.onClick}
            className="touch-target px-5 py-2.5 bg-[#5F6F52] dark:bg-olive hover:bg-[#4E5D42] dark:hover:opacity-95 text-white rounded-2xl text-xs font-black transition-all duration-150 shadow-md shadow-[#5F6F52]/20 inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {ActionIcon && <ActionIcon size={15} strokeWidth={2.5} />}
            <span>{action.label}</span>
          </button>
        </div>
      )}
    </div>
  );
}
