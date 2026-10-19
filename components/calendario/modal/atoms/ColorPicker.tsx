'use client';

import { Check } from 'lucide-react';
import { PALETA_COLORES } from '../types';

interface ColorPickerProps {
  colorSeleccionado: string;
  onSelectColor: (color: string) => void;
}

export default function ColorPicker({
  colorSeleccionado,
  onSelectColor,
}: ColorPickerProps) {
  return (
    <div className="space-y-1.5">
      <label className="apple-footnote text-label-secondary font-medium">
        Color identificador
      </label>
      <div className="flex items-center gap-2.5 p-2 bg-tertiary rounded-2xl border border-separator/60 dark:border-separator">
        {PALETA_COLORES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onSelectColor(c)}
            className="w-7 h-7 rounded-full transition-transform flex items-center justify-center cursor-pointer shadow-2xs hover:scale-110 active:scale-95"
            style={{ backgroundColor: c }}
            aria-label={`Seleccionar color ${c}`}
          >
            {colorSeleccionado === c && (
              <Check size={14} className="text-white drop-shadow-xs" strokeWidth={3} />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
