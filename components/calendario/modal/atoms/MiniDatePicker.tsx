'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { DIAS_MINI, MESES_LABELS } from '../types';

interface MiniDatePickerProps {
  fechaActividad: string; // YYYY-MM-DD
  onChangeFecha: (fechaStr: string) => void;
}

export default function MiniDatePicker({
  fechaActividad,
  onChangeFecha,
}: MiniDatePickerProps) {
  const [mostrarMiniCal, setMostrarMiniCal] = useState(false);
  const [miniCalMes, setMiniCalMes] = useState(new Date().getMonth());
  const [miniCalAnio, setMiniCalAnio] = useState(new Date().getFullYear());

  useEffect(() => {
    if (fechaActividad) {
      const [y, m] = fechaActividad.split('-').map(Number);
      if (y && m) {
        setMiniCalAnio(y);
        setMiniCalMes(m - 1);
      }
    }
  }, [fechaActividad]);

  function aFechaString(d: Date) {
    const anio = d.getFullYear();
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  // Generar cuadrícula del mes del mini-calendario
  const primerDiaMini = new Date(miniCalAnio, miniCalMes, 1);
  let diaOffset = primerDiaMini.getDay() - 1;
  if (diaOffset === -1) diaOffset = 6;
  const totalDiasMini = new Date(miniCalAnio, miniCalMes + 1, 0).getDate();
  const diasMesAnt = new Date(miniCalAnio, miniCalMes, 0).getDate();

  const celdasMiniPicker: { dia: number; esMesActual: boolean; fechaStr: string }[] = [];

  for (let i = diaOffset - 1; i >= 0; i--) {
    const diaNum = diasMesAnt - i;
    const f = new Date(miniCalAnio, miniCalMes - 1, diaNum);
    celdasMiniPicker.push({ dia: diaNum, esMesActual: false, fechaStr: aFechaString(f) });
  }

  for (let i = 1; i <= totalDiasMini; i++) {
    const f = new Date(miniCalAnio, miniCalMes, i);
    celdasMiniPicker.push({ dia: i, esMesActual: true, fechaStr: aFechaString(f) });
  }

  const faltantes = 7 - (celdasMiniPicker.length % 7);
  if (faltantes < 7) {
    for (let i = 1; i <= faltantes; i++) {
      const f = new Date(miniCalAnio, miniCalMes + 1, i);
      celdasMiniPicker.push({ dia: i, esMesActual: false, fechaStr: aFechaString(f) });
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="apple-footnote text-label-secondary font-medium flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <CalendarIcon size={13} className="text-terracotta" />
          <span>Fecha de la actividad</span>
        </span>
        <button
          type="button"
          onClick={() => setMostrarMiniCal(!mostrarMiniCal)}
          className="text-xs text-terracotta hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
        >
          <span>{mostrarMiniCal ? 'Ocultar selector' : 'Cambiar fecha'}</span>
          {mostrarMiniCal ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </label>

      {/* Mini Calendario Desplegable */}
      {mostrarMiniCal && (
        <div className="p-3 bg-tertiary rounded-2xl border border-separator shadow-md space-y-2 animate-fade-in-up">
          <div className="flex items-center justify-between px-1">
            <span className="apple-subhead font-bold text-label-primary">
              {MESES_LABELS[miniCalMes]} {miniCalAnio}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (miniCalMes === 0) {
                    setMiniCalMes(11);
                    setMiniCalAnio((prev) => prev - 1);
                  } else {
                    setMiniCalMes((prev) => prev - 1);
                  }
                }}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-label-primary hover:bg-tertiary transition cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (miniCalMes === 11) {
                    setMiniCalMes(0);
                    setMiniCalAnio((prev) => prev + 1);
                  } else {
                    setMiniCalMes((prev) => prev + 1);
                  }
                }}
                className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center text-label-primary hover:bg-tertiary transition cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {DIAS_MINI.map((d) => (
              <span key={d} className="text-[10px] font-semibold text-label-secondary py-1">
                {d}
              </span>
            ))}
            {celdasMiniPicker.map((c, i) => {
              const esSeleccionado = c.fechaStr === fechaActividad;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    onChangeFecha(c.fechaStr);
                    setMostrarMiniCal(false);
                  }}
                  className={`h-7 text-xs rounded-lg font-medium flex items-center justify-center transition-all cursor-pointer ${
                    esSeleccionado
                      ? 'bg-terracotta text-white font-bold shadow-2xs'
                      : c.esMesActual
                      ? 'text-label-primary hover:bg-secondary'
                      : 'text-label-secondary/50 hover:bg-tertiary'
                  }`}
                >
                  {c.dia}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
