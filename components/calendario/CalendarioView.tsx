'use client';

import { useState } from 'react';
import { EventoUnificado } from '@/actions/eventos';
import dynamic from 'next/dynamic';

const EventoContextModal = dynamic(() => import('./EventoContextModal'), {
  ssr: false,
});
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  Sprout,
  Receipt,
  CheckCircle2,
} from 'lucide-react';

interface CalendarioViewProps {
  initialEventos: EventoUnificado[];
  miembros: { id: string; nombre: string; email?: string }[];
  usuarioActualId?: string;
  onRefresh: (mes: number, anio: number) => Promise<EventoUnificado[]>;
}

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export default function CalendarioView({
  initialEventos,
  miembros,
  usuarioActualId,
  onRefresh,
}: CalendarioViewProps) {
  const hoy = new Date();
  const [mesActual, setMesActual] = useState(hoy.getMonth()); // 0-11
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [eventos, setEventos] = useState<EventoUnificado[]>(initialEventos);
  const [cargando, setCargando] = useState(false);
  const [notificacion, setNotificacion] = useState<string | null>(null);

  // Estados del modal contextual
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Navegar meses
  async function cambiarMes(delta: number) {
    let nuevoMes = mesActual + delta;
    let nuevoAnio = anioActual;

    if (nuevoMes < 0) {
      nuevoMes = 11;
      nuevoAnio--;
    } else if (nuevoMes > 11) {
      nuevoMes = 0;
      nuevoAnio++;
    }

    setMesActual(nuevoMes);
    setAnioActual(nuevoAnio);
    setCargando(true);
    const nuevosEventos = await onRefresh(nuevoMes + 1, nuevoAnio);
    setEventos(nuevosEventos);
    setCargando(false);
  }

  async function irAHoy() {
    const d = new Date();
    setMesActual(d.getMonth());
    setAnioActual(d.getFullYear());
    setCargando(true);
    const nuevosEventos = await onRefresh(d.getMonth() + 1, d.getFullYear());
    setEventos(nuevosEventos);
    setCargando(false);
  }

  function mostrarAviso(mensaje: string) {
    setNotificacion(mensaje);
    setTimeout(() => setNotificacion(null), 3500);
  }

  // Manejar toque en celda de día (Lienzo interactivo)
  function handleDayClick(fecha: Date) {
    setSelectedDate(fecha);
    setIsModalOpen(true);
  }

  // Generar la matriz de días para el mes
  const primerDiaMes = new Date(anioActual, mesActual, 1);
  // Ajuste para que Lunes sea 0 y Domingo 6
  let diaSemanaInicio = primerDiaMes.getDay() - 1;
  if (diaSemanaInicio === -1) diaSemanaInicio = 6;

  const totalDiasMes = new Date(anioActual, mesActual + 1, 0).getDate();

  const celdas: { fecha: Date; esMesActual: boolean }[] = [];

  // Días previos del mes anterior
  const diasMesAnterior = new Date(anioActual, mesActual, 0).getDate();
  for (let i = diaSemanaInicio - 1; i >= 0; i--) {
    celdas.push({
      fecha: new Date(anioActual, mesActual - 1, diasMesAnterior - i),
      esMesActual: false,
    });
  }

  // Días del mes actual
  for (let i = 1; i <= totalDiasMes; i++) {
    celdas.push({
      fecha: new Date(anioActual, mesActual, i),
      esMesActual: true,
    });
  }

  // Rellenar hasta completar semanas (múltiplos de 7)
  const celdasRestantes = 7 - (celdas.length % 7);
  if (celdasRestantes < 7) {
    for (let i = 1; i <= celdasRestantes; i++) {
      celdas.push({
        fecha: new Date(anioActual, mesActual + 1, i),
        esMesActual: false,
      });
    }
  }

  // Filtrar eventos por fecha (respetando zona horaria local e intervalos multi-día)
  function getEventosParaFecha(f: Date) {
    const fInicio = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 0, 0, 0, 0);
    const fFin = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 23, 59, 59, 999);
    return eventos.filter((ev) => {
      const evInicio = new Date(ev.fecha_inicio);
      const evFin = ev.fecha_fin ? new Date(ev.fecha_fin) : evInicio;
      return evInicio <= fFin && evFin >= fInicio;
    });
  }

  const eventosDelDiaSeleccionado = selectedDate ? getEventosParaFecha(selectedDate) : [];

  return (
    <div className="space-y-6">
      
      {/* Notificación Flotante */}
      {notificacion && (
        <div className="fixed top-20 right-6 z-60 glass-card bg-[#c7e1d7]/95 dark:bg-mint/20 border border-[#6eb5a5]/40 text-mint px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
          <CheckCircle2 size={18} className="text-mint" />
          <span>{notificacion}</span>
        </div>
      )}

      {/* Cabecera del Calendario */}
      <div className="glass-card p-5 sm:p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-white/80 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ce9b8c]/25 dark:bg-brand-deep/15 border border-[#bd7471]/30 text-brand-deep flex items-center justify-center shadow-2xs">
            <CalendarIcon size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="apple-title-2 font-bold text-label-primary tracking-tight">
              {MESES[mesActual]} {anioActual}
            </h2>
            <p className="apple-subhead text-label-secondary font-normal">
              Agenda unificada de tareas, riegos y finanzas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={irAHoy}
            className="px-3.5 py-2 bg-white/80 dark:bg-tertiary/60 hover:bg-white dark:hover:bg-tertiary text-xs font-semibold text-label-primary rounded-xl border border-separator transition cursor-pointer active:scale-95 shadow-2xs"
          >
            Hoy
          </button>
          
          <div className="flex items-center gap-1 bg-white/60 dark:bg-tertiary/40 p-1 rounded-2xl border border-separator">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              className="w-8 h-8 rounded-xl bg-white dark:bg-secondary hover:bg-[#c7e1d7]/40 dark:hover:bg-tertiary text-label-primary flex items-center justify-center transition cursor-pointer active:scale-90"
              title="Mes anterior"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              className="w-8 h-8 rounded-xl bg-white dark:bg-secondary hover:bg-[#c7e1d7]/40 dark:hover:bg-tertiary text-label-primary flex items-center justify-center transition cursor-pointer active:scale-90"
              title="Mes siguiente"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleDayClick(new Date())}
            className="px-4 py-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-xl text-xs font-semibold transition shadow-sm shadow-terracotta/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Agendar</span>
          </button>
        </div>
      </div>

      {/* Cuadrícula del Calendario (El Lienzo es el Formulario) */}
      <div className="glass-card rounded-[2.2rem] p-4 sm:p-6 shadow-sm border border-white/80 dark:border-white/10 overflow-hidden">
        
        {/* Nombres de los días de la semana */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
          {DIAS_SEMANA.map((dia) => (
            <div
              key={dia}
              className="py-1.5 apple-caption-2 font-semibold text-label-secondary"
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Celdas de los días */}
        <div className={`grid grid-cols-7 gap-1.5 sm:gap-2.5 ${cargando ? 'opacity-50' : ''} transition-opacity`}>
          {celdas.map(({ fecha, esMesActual }, index) => {
            const esHoy =
              fecha.getDate() === hoy.getDate() &&
              fecha.getMonth() === hoy.getMonth() &&
              fecha.getFullYear() === hoy.getFullYear();

            const eventosDia = getEventosParaFecha(fecha);

            return (
              <div
                key={index}
                onClick={() => handleDayClick(fecha)}
                className={`min-h-[88px] sm:min-h-[118px] p-1 sm:p-2 rounded-2xl sm:rounded-3xl transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  esHoy
                    ? 'bg-[#ce9b8c]/20 dark:bg-terracotta/15 border-terracotta/40 dark:border-terracotta/40 shadow-xs'
                    : esMesActual
                    ? 'bg-white/70 dark:bg-tertiary/40 hover:bg-white dark:hover:bg-tertiary/70 hover:border-terracotta/30 dark:hover:border-terracotta/30 hover:shadow-sm border-white/80 dark:border-white/10'
                    : 'bg-white/20 dark:bg-transparent text-label-quaternary border-transparent hover:bg-white/40 dark:hover:bg-tertiary/20'
                } group active:scale-95`}
              >
                {/* Número del día */}
                <div className="flex items-center justify-between">
                  <span
                    className={`apple-footnote font-semibold tabular-nums w-6 h-6 rounded-full flex items-center justify-center text-center leading-none ${
                      esHoy
                        ? 'bg-terracotta text-white shadow-2xs'
                        : esMesActual
                        ? 'text-label-primary'
                        : 'text-label-quaternary'
                    }`}
                  >
                    {fecha.getDate()}
                  </span>

                  {/* Micro botón '+' al hover */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-terracotta hidden sm:inline-block">
                    <Plus size={12} strokeWidth={2.5} />
                  </span>
                </div>

                {/* Lista de píldoras de eventos visibles en móvil y desktop */}
                <div className="flex flex-col gap-1 w-full overflow-hidden mt-1 flex-1">
                  {eventosDia.slice(0, 3).map((ev, i) => {
                    const esCancelado = ev.estado === 'CANCELADO';
                    // Si hay más de 2 eventos, en móvil mostramos los 2 primeros + contador
                    const ocultarEnMovil = i === 2 && eventosDia.length > 2;

                    return (
                      <div
                        key={ev.id}
                        className={`w-full text-[9px] sm:text-[10.5px] font-semibold px-1 sm:px-1.5 py-0.5 rounded-md truncate items-center gap-1 leading-tight text-white transition-opacity shadow-3xs ${
                          ocultarEnMovil ? 'hidden sm:flex' : 'flex'
                        } ${
                          esCancelado ? 'line-through opacity-50 italic' : ''
                        }`}
                        style={{ backgroundColor: ev.color }}
                        title={esCancelado ? `${ev.titulo} (Cancelado)` : ev.titulo}
                      >
                        {ev.origen === 'PLANTA' && <Sprout size={9} className="shrink-0 hidden sm:inline-block" />}
                        {ev.origen === 'SERVICIO' && <Receipt size={9} className="shrink-0 hidden sm:inline-block" />}
                        <span className="truncate">{ev.titulo}</span>
                      </div>
                    );
                  })}

                  {/* Contador +N más en móvil (cuando hay > 2 eventos) */}
                  {eventosDia.length > 2 && (
                    <span className="sm:hidden text-[8.5px] font-bold text-label-secondary px-0.5 truncate leading-tight tabular-nums">
                      +{eventosDia.length - 2} más
                    </span>
                  )}

                  {/* Contador +N más en desktop (cuando hay > 3 eventos) */}
                  {eventosDia.length > 3 && (
                    <span className="hidden sm:inline-block text-[10px] font-bold text-label-secondary pl-0.5 truncate leading-tight tabular-nums">
                      +{eventosDia.length - 3} más
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Modal / Bottom Sheet Híbrido Contextual */}
      <EventoContextModal
        isOpen={isModalOpen}
        selectedDate={selectedDate}
        eventosDelDia={eventosDelDiaSeleccionado}
        miembros={miembros}
        usuarioActualId={usuarioActualId}
        onClose={() => setIsModalOpen(false)}
        onSuccess={async (msg) => {
          mostrarAviso(msg);
          const actualizados = await onRefresh(mesActual + 1, anioActual);
          setEventos(actualizados);
        }}
      />

    </div>
  );
}
