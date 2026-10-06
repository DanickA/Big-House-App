'use client';

import { useRef } from 'react';
import { Clock } from 'lucide-react';
import AppleSwitch from '@/components/ui/AppleSwitch';

interface TimePicker12hProps {
  todoElDia: boolean;
  onToggleTodoElDia: (val: boolean) => void;
  hora12: string;
  onChangeHora: (val: string) => void;
  minutos: string;
  onChangeMinutos: (val: string) => void;
  periodo: 'AM' | 'PM';
  onChangePeriodo: (p: 'AM' | 'PM') => void;
  deshabilitarTodoElDia?: boolean;
  badgeDeshabilitado?: string;
}

export default function TimePicker12h({
  todoElDia,
  onToggleTodoElDia,
  hora12,
  onChangeHora,
  minutos,
  onChangeMinutos,
  periodo,
  onChangePeriodo,
  deshabilitarTodoElDia = false,
  badgeDeshabilitado,
}: TimePicker12hProps) {
  const minInputRef = useRef<HTMLInputElement>(null);

  function handleHorasChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val === '') {
      onChangeHora('');
      return;
    }
    const num = parseInt(val, 10);
    if (num <= 12) {
      onChangeHora(val);
      if (todoElDia) onToggleTodoElDia(false);
    }
  }

  function handleHorasBlur() {
    let num = parseInt(hora12, 10);
    if (isNaN(num) || num < 1 || num > 12) {
      num = 12;
    }
    onChangeHora(num.toString().padStart(2, '0'));
  }

  function handleMinutosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val === '') {
      onChangeMinutos('');
      return;
    }
    const num = parseInt(val, 10);
    if (num <= 59) {
      onChangeMinutos(val);
      if (todoElDia) onToggleTodoElDia(false);
    }
  }

  function handleMinutosBlur() {
    let num = parseInt(minutos, 10);
    if (isNaN(num) || num < 0 || num > 59) {
      num = 0;
    }
    onChangeMinutos(num.toString().padStart(2, '0'));
  }

  function handleSetMinutosExactos(nuevosMin: number) {
    onChangeMinutos(nuevosMin.toString().padStart(2, '0'));
    if (todoElDia) onToggleTodoElDia(false);
  }

  const esTodoElDiaEfectivo = deshabilitarTodoElDia ? false : todoElDia;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
          <Clock size={13} className="text-terracotta" />
          <span>Horario de inicio</span>
        </label>
        <div className="flex items-center gap-2">
          {deshabilitarTodoElDia && (
            <span className="text-[10px] font-semibold text-terracotta dark:text-olive bg-terracotta/10 dark:bg-olive/15 px-2 py-0.5 rounded-full border border-terracotta/20 dark:border-olive/30 shadow-3xs">
              {badgeDeshabilitado || 'Hora fija requerida'}
            </span>
          )}
          <span className="apple-caption-1 text-label-tertiary">Todo el día</span>
          <AppleSwitch
            checked={esTodoElDiaEfectivo}
            disabled={deshabilitarTodoElDia}
            onChange={(checked) => !deshabilitarTodoElDia && onToggleTodoElDia(checked)}
          />
        </div>
      </div>

      {!esTodoElDiaEfectivo && (
        <div className="p-3 bg-white/60 dark:bg-tertiary/40 rounded-2xl border border-separator/80 dark:border-separator space-y-2.5 shadow-2xs animate-fade-in-up">
          <div className="flex items-center justify-between gap-2">
            {/* Input de Hora y Minutos 12H */}
            <div className="flex items-center bg-white dark:bg-secondary rounded-xl border border-separator/80 dark:border-separator px-2.5 py-1.5 shadow-3xs">
              <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={hora12}
                onChange={handleHorasChange}
                onBlur={handleHorasBlur}
                className="w-8 text-center text-base font-bold bg-transparent text-label-primary focus:outline-none tabular-nums"
                aria-label="Hora"
              />
              <span className="font-bold text-label-secondary px-0.5">:</span>
              <input
                ref={minInputRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                value={minutos}
                onChange={handleMinutosChange}
                onBlur={handleMinutosBlur}
                className="w-8 text-center text-base font-bold bg-transparent text-label-primary focus:outline-none tabular-nums"
                aria-label="Minutos"
              />
            </div>

            {/* Selector Segmentado AM / PM */}
            <div className="flex bg-system/60 dark:bg-tertiary/60 p-1 rounded-xl border border-separator/60 dark:border-separator">
              <button
                type="button"
                onClick={() => {
                  onChangePeriodo('AM');
                  if (todoElDia) onToggleTodoElDia(false);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  periodo === 'AM'
                    ? 'bg-white dark:bg-secondary text-label-primary shadow-2xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => {
                  onChangePeriodo('PM');
                  if (todoElDia) onToggleTodoElDia(false);
                }}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  periodo === 'PM'
                    ? 'bg-white dark:bg-secondary text-label-primary shadow-2xs'
                    : 'text-label-secondary hover:text-label-primary'
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Accesos rápidos de minutos (:00, :15, :30, :45) */}
          <div className="flex items-center gap-1.5 pt-1 border-t border-separator/40">
            <span className="text-[10.5px] font-medium text-label-secondary shrink-0">Minutos:</span>
            {[0, 15, 30, 45].map((m) => {
              const isSelected = parseInt(minutos, 10) === m;
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSetMinutosExactos(m)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer tabular-nums ${
                    isSelected
                      ? 'bg-terracotta text-white shadow-3xs'
                      : 'bg-white/50 dark:bg-secondary/50 text-label-secondary hover:text-label-primary border border-separator/40'
                  }`}
                >
                  :{m.toString().padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
