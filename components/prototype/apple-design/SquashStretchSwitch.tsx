'use client';

import React, { useState } from 'react';

export interface SquashStretchSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * Conmutador Apple HIG con física squash & stretch (Emil Kowalski Craft).
 * - Cero mutaciones de layout (width y height siempre 27px, sin reflow de layout).
 * - Deformación en GPU: `scaleX(1.222) scaleY(0.92)` durante la pulsación.
 * - Soporte accesible de teclado (Espacio y Enter) y estados ARIA completos.
 */
export default function SquashStretchSwitch({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: SquashStretchSwitchProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  // Desplazamiento horizontal según estado: 2px inicial, 22px activo
  const translateX = checked ? 22 : 2;
  const scaleX = isPressed ? 1.222 : 1;
  const scaleY = isPressed ? 0.92 : 1;

  return (
    <div className={`flex items-center justify-between gap-3 select-none ${className}`}>
      {(label || description) && (
        <div className="flex-1 min-w-0 pr-2">
          {label && (
            <label
              onClick={handleToggle}
              className="text-xs font-bold text-label-primary cursor-pointer block leading-tight"
            >
              {label}
            </label>
          )}
          {description && (
            <p className="text-[11px] text-label-tertiary leading-snug mt-0.5">
              {description}
            </p>
          )}
        </div>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || 'Interruptor'}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        onPointerDown={() => !disabled && setIsPressed(true)}
        onPointerUp={() => setIsPressed(false)}
        onPointerLeave={() => setIsPressed(false)}
        className={`touch-target relative inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-terracotta focus-visible:ring-offset-2 ${
          checked ? 'bg-mint' : 'bg-tertiary'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <span
          className="switch-thumb-shadow pointer-events-none inline-block rounded-full bg-white shadow-md transition-transform duration-200 ease-out"
          style={{
            width: '27px',
            height: '27px',
            transform: `translateX(${translateX}px) scaleX(${scaleX}) scaleY(${scaleY})`,
            transformOrigin: checked ? 'right center' : 'left center',
          }}
        />
      </button>
    </div>
  );
}
