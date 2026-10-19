'use client';

import { Repeat, Calendar, CalendarRange } from 'lucide-react';
import { OpcionRecurrenciaEdicion } from '@/actions/calendario';

export interface RecurrenciaScopeSelectorProps {
  value: OpcionRecurrenciaEdicion;
  onChange: (opcion: OpcionRecurrenciaEdicion) => void;
  className?: string;
}

export function RecurrenciaScopeSelector({
  value,
  onChange,
  className = '',
}: RecurrenciaScopeSelectorProps) {
  return (
    <div
      className={`p-4 rounded-2xl bg-tertiary border border-terracotta/30 dark:border-terracotta/35 space-y-3 shadow-2xs animate-fade-in-up ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-terracotta text-white flex items-center justify-center shrink-0 shadow-3xs">
          <Repeat size={16} strokeWidth={2.4} />
        </div>
        <div>
          <h4 className="apple-footnote font-bold text-label-primary leading-tight">
            Alcance en serie recurrente
          </h4>
          <p className="apple-caption-2 text-label-secondary">
            Esta actividad se repite periódicamente en el calendario
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-0.5">
        <button
          type="button"
          onClick={() => onChange('SOLO_ESTE')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
            value === 'SOLO_ESTE'
              ? 'bg-tertiary border-terracotta text-label-primary shadow-xs ring-2 ring-terracotta/25'
              : 'bg-tertiary border-separator/70 text-label-secondary hover:text-label-primary hover:bg-tertiary'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              value === 'SOLO_ESTE'
                ? 'bg-terracotta text-white'
                : 'bg-tertiary/60 text-label-tertiary'
            }`}
          >
            <Calendar size={13} strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold leading-tight text-label-primary">
              Solo esta fecha
            </span>
            <span className="block text-[10.5px] text-label-secondary leading-tight mt-0.5 font-normal">
              Modifica solo este día sin afectar futuras repeticiones
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange('ESTE_Y_FUTUROS')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
            value === 'ESTE_Y_FUTUROS'
              ? 'bg-tertiary border-terracotta text-label-primary shadow-xs ring-2 ring-terracotta/25'
              : 'bg-tertiary border-separator/70 text-label-secondary hover:text-label-primary hover:bg-tertiary'
          }`}
        >
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
              value === 'ESTE_Y_FUTUROS'
                ? 'bg-terracotta text-white'
                : 'bg-tertiary/60 text-label-tertiary'
            }`}
          >
            <CalendarRange size={13} strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <span className="block text-xs font-bold leading-tight text-label-primary">
              Toda la serie
            </span>
            <span className="block text-[10.5px] text-label-secondary leading-tight mt-0.5 font-normal">
              Aplica los cambios a esta y todas las fechas futuras
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}

export default RecurrenciaScopeSelector;
