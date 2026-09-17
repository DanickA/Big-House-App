'use client';

import React, { useState, useEffect, useId } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export interface DateShortcut {
  label: string;
  daysOffset?: number;
  getDate?: () => string;
}

export interface GlassDatePickerProps {
  value: string; // Formato 'YYYY-MM-DD'
  onChange: (value: string) => void;
  name?: string;
  id?: string;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  shortcuts?: DateShortcut[];
  placeholder?: string;
  helperText?: string;
  className?: string;
}

const MESES_LABELS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DIAS_MINI = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export function toYMD(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const dia = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

export function parseYMD(str: string): Date {
  if (!str) return new Date();
  const parts = str.split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return new Date();
  }
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

export default function GlassDatePicker({
  value,
  onChange,
  name,
  id,
  label,
  required = false,
  disabled = false,
  shortcuts,
  placeholder = 'Seleccionar fecha',
  helperText,
  className = '',
}: GlassDatePickerProps) {
  const autoId = useId();
  const inputId = id || autoId;

  const [isOpen, setIsOpen] = useState(false);

  // Fecha parseada
  const fechaObj = value ? parseYMD(value) : null;
  const diaNumero = fechaObj ? fechaObj.getDate() : '--';

  const fechaFormateada = fechaObj
    ? new Intl.DateTimeFormat('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(fechaObj)
    : '';

  // Mes y Año del Mini Calendario
  const [calMes, setCalMes] = useState<number>(() => {
    const d = value ? parseYMD(value) : new Date();
    return d.getMonth();
  });
  const [calAnio, setCalAnio] = useState<number>(() => {
    const d = value ? parseYMD(value) : new Date();
    return d.getFullYear();
  });

  // Sincronizar mes/año cuando cambia value externamente
  useEffect(() => {
    if (value) {
      const d = parseYMD(value);
      setCalMes(d.getMonth());
      setCalAnio(d.getFullYear());
    }
  }, [value]);

  function handlePrevMes() {
    if (calMes === 0) {
      setCalMes(11);
      setCalAnio((prev) => prev - 1);
    } else {
      setCalMes((prev) => prev - 1);
    }
  }

  function handleNextMes() {
    if (calMes === 11) {
      setCalMes(0);
      setCalAnio((prev) => prev + 1);
    } else {
      setCalMes((prev) => prev + 1);
    }
  }

  function getShortcutYMD(sc: DateShortcut): string {
    if (sc.getDate) return sc.getDate();
    const d = new Date();
    if (sc.daysOffset !== undefined) {
      d.setDate(d.getDate() + sc.daysOffset);
    }
    return toYMD(d);
  }

  // Generación de celdas de la cuadrícula mensual
  const primerDia = new Date(calAnio, calMes, 1);
  const offsetPrimerDia = (primerDia.getDay() + 6) % 7; // Lunes = 0
  const diasEnMes = new Date(calAnio, calMes + 1, 0).getDate();
  const diasMesAnterior = new Date(calAnio, calMes, 0).getDate();
  const hoyYMD = toYMD(new Date());

  interface CeldaDia {
    num: number;
    ymd: string;
    esMesActual: boolean;
    esSeleccionado: boolean;
    esHoy: boolean;
  }

  const celdas: CeldaDia[] = [];

  // Días del mes anterior
  for (let i = offsetPrimerDia - 1; i >= 0; i--) {
    const num = diasMesAnterior - i;
    const mesAnt = calMes === 0 ? 11 : calMes - 1;
    const anioAnt = calMes === 0 ? calAnio - 1 : calAnio;
    const strAnt = `${anioAnt}-${(mesAnt + 1).toString().padStart(2, '0')}-${num.toString().padStart(2, '0')}`;
    celdas.push({
      num,
      ymd: strAnt,
      esMesActual: false,
      esSeleccionado: strAnt === value,
      esHoy: strAnt === hoyYMD,
    });
  }

  // Días del mes en curso
  for (let d = 1; d <= diasEnMes; d++) {
    const strCur = `${calAnio}-${(calMes + 1).toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    celdas.push({
      num: d,
      ymd: strCur,
      esMesActual: true,
      esSeleccionado: strCur === value,
      esHoy: strCur === hoyYMD,
    });
  }

  // Días del mes siguiente para completar múltiplos de 7
  const totalCeldas = celdas.length <= 35 ? 35 : 42;
  let diaSig = 1;
  while (celdas.length < totalCeldas) {
    const mesSig = calMes === 11 ? 0 : calMes + 1;
    const anioSig = calMes === 11 ? calAnio + 1 : calAnio;
    const strSig = `${anioSig}-${(mesSig + 1).toString().padStart(2, '0')}-${diaSig.toString().padStart(2, '0')}`;
    celdas.push({
      num: diaSig,
      ymd: strSig,
      esMesActual: false,
      esSeleccionado: strSig === value,
      esHoy: strSig === hoyYMD,
    });
    diaSig++;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label opcional */}
      {label && (
        <label
          htmlFor={inputId}
          className="block apple-subhead font-medium text-label-primary mb-1.5"
        >
          {label} {required && '*'}
        </label>
      )}

      {/* Input oculto para compatibilidad con FormData */}
      {name && <input type="hidden" name={name} id={inputId} value={value} />}

      {/* Cápsula de activación Glassmorphic */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between p-3 bg-white/85 dark:bg-secondary/85 hover:bg-white dark:hover:bg-secondary border rounded-2xl transition shadow-2xs cursor-pointer group ${
          isOpen
            ? 'border-terracotta ring-2 ring-terracotta/15'
            : 'border-separator'
        } ${disabled ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#ce9b8c]/25 dark:bg-terracotta/20 text-terracotta flex items-center justify-center shrink-0 font-bold text-xs tabular-nums border border-[#aa4b50]/30 group-hover:scale-105 transition">
            {diaNumero}
          </div>
          <div className="min-w-0 text-left">
            <p className="apple-footnote font-semibold text-label-primary capitalize truncate">
              {fechaFormateada || placeholder}
            </p>
            <p className="apple-caption-2 text-label-secondary font-medium">
              {isOpen ? 'Toca para cerrar calendario' : 'Toca para cambiar de fecha'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-terracotta group-hover:text-terracotta-hover transition shrink-0">
          <CalendarIcon size={16} strokeWidth={2.2} />
          {isOpen ? (
            <ChevronUp size={14} strokeWidth={2.5} />
          ) : (
            <ChevronDown size={14} strokeWidth={2.5} />
          )}
        </div>
      </div>

      {/* Píldoras Rápidas de Atajo (si están configuradas) */}
      {shortcuts && shortcuts.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {shortcuts.map((sc) => {
            const scYmd = getShortcutYMD(sc);
            const esActivo = value === scYmd;
            return (
              <button
                key={sc.label}
                type="button"
                onClick={() => {
                  onChange(scYmd);
                  setIsOpen(false);
                }}
                className={`flex-1 min-w-[70px] py-1.5 px-2 rounded-xl apple-footnote font-semibold transition border cursor-pointer active:scale-95 text-center truncate ${
                  esActivo
                    ? 'bg-terracotta text-white border-terracotta shadow-2xs'
                    : 'bg-white dark:bg-tertiary hover:bg-[#ce9b8c]/20 text-label-secondary hover:text-label-primary border-separator'
                }`}
              >
                {sc.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Mini Calendario Glassmorphic Integrado (Desplegable suave) */}
      {isOpen && (
        <div className="p-3 bg-white/95 dark:bg-secondary/95 backdrop-blur-md rounded-2xl border border-separator shadow-md space-y-2 animate-fade-in-up">
          {/* Navegación del Mes */}
          <div className="flex items-center justify-between px-1">
            <span className="apple-subhead font-semibold text-label-primary capitalize">
              {MESES_LABELS[calMes]} {calAnio}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMes}
                title="Mes anterior"
                className="w-7 h-7 rounded-lg bg-tertiary hover:bg-secondary text-label-primary active:scale-90 flex items-center justify-center cursor-pointer transition border border-separator"
              >
                <ChevronLeft size={14} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                onClick={handleNextMes}
                title="Mes siguiente"
                className="w-7 h-7 rounded-lg bg-tertiary hover:bg-secondary text-label-primary active:scale-90 flex items-center justify-center cursor-pointer transition border border-separator"
              >
                <ChevronRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 gap-1 text-center apple-caption-2 font-semibold text-label-secondary">
            {DIAS_MINI.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Cuadrícula de 7 columnas */}
          <div className="grid grid-cols-7 gap-1">
            {celdas.map((celda, idx) => (
              <button
                key={`${celda.ymd}-${idx}`}
                type="button"
                onClick={() => {
                  onChange(celda.ymd);
                  setIsOpen(false);
                }}
                className={`h-7 rounded-lg text-xs font-semibold tabular-nums transition flex items-center justify-center cursor-pointer active:scale-90 ${
                  celda.esSeleccionado
                    ? 'bg-terracotta text-white shadow-2xs scale-105'
                    : celda.esHoy
                    ? 'bg-[#ce9b8c]/20 text-terracotta border border-[#aa4b50]/30'
                    : celda.esMesActual
                    ? 'bg-white dark:bg-tertiary hover:bg-[#ce9b8c]/20 text-label-primary'
                    : 'text-label-quaternary hover:bg-tertiary/50'
                }`}
              >
                {celda.num}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Texto de ayuda opcional */}
      {helperText && <p className="text-[11px] text-label-secondary mt-1">{helperText}</p>}
    </div>
  );
}
