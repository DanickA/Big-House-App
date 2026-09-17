'use client';

import React from 'react';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, format, isSameMonth, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { EventoData } from '@/actions/calendario';

// Importamos el tipo real generado por prisma pero lo extendemos/adaptamos.
// Asumimos un EventoUI básico para renderizar
export type EventoUI = {
  id: string;
  titulo: string;
  color: string;
  fecha_inicio: Date;
  fecha_fin: Date;
  estado: string; // 'ACTIVO' | 'CANCELADO'
};

interface VistaMensualProps {
  mesActual: Date;
  eventos: EventoUI[];
  onDiaSeleccionado: (fecha: Date) => void;
}

export function VistaMensual({ mesActual, eventos, onDiaSeleccionado }: VistaMensualProps) {
  const inicioMes = startOfMonth(mesActual);
  const finMes = endOfMonth(mesActual);
  const inicioSemana = startOfWeek(inicioMes, { weekStartsOn: 1 });
  const finSemana = endOfWeek(finMes, { weekStartsOn: 1 });

  const dias = eachDayOfInterval({ start: inicioSemana, end: finSemana });

  const semanaNombres = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="flex flex-col w-full h-full bg-white rounded-xl shadow border overflow-hidden">
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {semanaNombres.map((nombre) => (
          <div key={nombre} className="text-center py-2 apple-caption-2 font-semibold text-label-secondary border-r last:border-r-0">
            {nombre}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(100px,1fr)]">
        {dias.map((dia, index) => {
          const esMesActual = isSameMonth(dia, mesActual);
          const esHoy = isSameDay(dia, new Date());
          
          // Filtrar eventos del día
          const eventosDia = eventos.filter(e => {
            const inicio = new Date(e.fecha_inicio);
            const fin = new Date(e.fecha_fin);
            // Ignorar horas para la vista mensual
            inicio.setHours(0,0,0,0);
            fin.setHours(23,59,59,999);
            return dia >= inicio && dia <= fin;
          });

          return (
            <div
              key={dia.toISOString()}
              onClick={() => onDiaSeleccionado(dia)}
              className={`
                min-h-[100px] border-r border-b p-1 cursor-pointer transition-colors hover:bg-mint/10
                ${!esMesActual ? 'bg-gray-50 text-gray-400' : 'text-gray-900'}
                ${index % 7 === 6 ? 'border-r-0' : ''}
              `}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`apple-footnote font-semibold tabular-nums w-6 h-6 flex items-center justify-center rounded-full ${esHoy ? 'bg-terracotta text-white' : ''}`}>
                  {format(dia, 'd')}
                </span>
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto max-h-20 hide-scrollbar">
                {eventosDia.map(evento => (
                  <div
                    key={evento.id}
                    className={`apple-caption-2 font-medium px-1.5 py-0.5 rounded truncate text-white ${evento.estado === 'CANCELADO' ? 'line-through opacity-50' : ''}`}
                    style={{ backgroundColor: evento.color }}
                    title={evento.titulo}
                  >
                    {evento.titulo}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
