'use client';

import { useState } from 'react';
import { EventoUnificado } from '@/actions/eventos';
import EventoContextModal from './EventoContextModal';
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

  // Filtrar eventos por fecha
  function getEventosParaFecha(f: Date) {
    const fStr = f.toISOString().split('T')[0];
    return eventos.filter((ev) => {
      const evStr = new Date(ev.fecha_inicio).toISOString().split('T')[0];
      return evStr === fStr;
    });
  }

  const eventosDelDiaSeleccionado = selectedDate ? getEventosParaFecha(selectedDate) : [];

  return (
    <div className="space-y-6">
      
      {/* Notificación Flotante */}
      {notificacion && (
        <div className="fixed top-20 right-6 z-60 glass-card bg-[#EEF2EA]/90 dark:bg-[#1E261B]/95 border border-[#B7CBA9] dark:border-olive/40 text-[#2D3E24] dark:text-olive px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
          <CheckCircle2 size={18} className="text-olive" />
          <span>{notificacion}</span>
        </div>
      )}

      {/* Cabecera del Calendario */}
      <div className="glass-card p-5 sm:p-6 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm border border-white/80 dark:border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2EA] dark:bg-[#282C25] border border-[#DCE7D3] dark:border-separator text-[#3A4630] dark:text-olive flex items-center justify-center shadow-2xs">
            <CalendarIcon size={22} strokeWidth={2.2} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#3A4630] dark:text-label-primary tracking-tight">
              {MESES[mesActual]} {anioActual}
            </h2>
            <p className="text-xs text-label-secondary font-medium">
              Agenda unificada de tareas, riegos y finanzas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={irAHoy}
            className="px-3.5 py-2 bg-white/80 dark:bg-tertiary/60 hover:bg-white dark:hover:bg-tertiary text-xs font-bold text-[#3A4630] dark:text-label-primary rounded-xl border border-[#E8E0D2] dark:border-separator transition cursor-pointer active:scale-95 shadow-2xs"
          >
            Hoy
          </button>
          
          <div className="flex items-center gap-1 bg-white/60 dark:bg-tertiary/40 p-1 rounded-2xl border border-[#E8E0D2] dark:border-separator">
            <button
              type="button"
              onClick={() => cambiarMes(-1)}
              className="w-8 h-8 rounded-xl bg-white dark:bg-secondary hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-[#3A4630] dark:text-label-primary flex items-center justify-center transition cursor-pointer active:scale-90"
              title="Mes anterior"
            >
              <ChevronLeft size={16} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={() => cambiarMes(1)}
              className="w-8 h-8 rounded-xl bg-white dark:bg-secondary hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-[#3A4630] dark:text-label-primary flex items-center justify-center transition cursor-pointer active:scale-90"
              title="Mes siguiente"
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => handleDayClick(new Date())}
            className="px-4 py-2 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-xl text-xs font-bold transition shadow-sm shadow-[#5F6F52]/20 flex items-center gap-1.5 cursor-pointer active:scale-95"
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
              className="py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-label-secondary"
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
            const tieneRiego = eventosDia.some((e) => e.origen === 'PLANTA');
            const tieneServicio = eventosDia.some((e) => e.origen === 'SERVICIO');
            const tieneManual = eventosDia.some((e) => e.origen === 'MANUAL');

            return (
              <div
                key={index}
                onClick={() => handleDayClick(fecha)}
                className={`min-h-[72px] sm:min-h-[96px] p-2 rounded-2xl sm:rounded-3xl transition-all duration-200 cursor-pointer flex flex-col justify-between border ${
                  esHoy
                    ? 'bg-[#EEF2EA] dark:bg-olive/20 border-[#B7CBA9] dark:border-olive/40 shadow-xs'
                    : esMesActual
                    ? 'bg-white/70 dark:bg-tertiary/40 hover:bg-white dark:hover:bg-tertiary/70 hover:border-[#B7CBA9] dark:hover:border-olive/40 hover:shadow-sm border-white/80 dark:border-white/10'
                    : 'bg-white/20 dark:bg-transparent text-label-quaternary border-transparent hover:bg-white/40 dark:hover:bg-tertiary/20'
                } group active:scale-95`}
              >
                {/* Número del día */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs sm:text-sm font-black w-6 h-6 rounded-full flex items-center justify-center ${
                      esHoy
                        ? 'bg-[#5F6F52] dark:bg-olive text-white shadow-2xs'
                        : esMesActual
                        ? 'text-[#3A4630] dark:text-label-primary'
                        : 'text-label-quaternary'
                    }`}
                  >
                    {fecha.getDate()}
                  </span>

                  {/* Micro botón '+' al hover */}
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-olive hidden sm:inline-block">
                    <Plus size={12} strokeWidth={2.5} />
                  </span>
                </div>

                {/* Indicadores de Eventos (Dots y Micro-Badges) */}
                <div className="space-y-1 mt-1">
                  {/* Vista condensada en móvil (Puntos) */}
                  <div className="flex items-center gap-1 sm:hidden">
                    {tieneRiego && <span className="w-1.5 h-1.5 rounded-full bg-olive" />}
                    {tieneServicio && <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />}
                    {tieneManual && <span className="w-1.5 h-1.5 rounded-full bg-[#2B6CB0] dark:bg-blue-sem" />}
                  </div>

                  {/* Vista detallada en tablet/escritorio */}
                  <div className="hidden sm:flex flex-col gap-1 overflow-hidden">
                    {eventosDia.slice(0, 2).map((ev) => {
                      const esCancelado = ev.estado === 'CANCELADO';
                      return (
                        <div
                          key={ev.id}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg truncate flex items-center gap-1 leading-tight text-white transition-opacity ${
                            esCancelado ? 'line-through opacity-50 italic' : ''
                          }`}
                          style={{ backgroundColor: ev.color }}
                          title={esCancelado ? `${ev.titulo} (Cancelado)` : ev.titulo}
                        >
                          {ev.origen === 'PLANTA' && <Sprout size={10} className="shrink-0" />}
                          {ev.origen === 'SERVICIO' && <Receipt size={10} className="shrink-0" />}
                          <span className="truncate">{ev.titulo}</span>
                        </div>
                      );
                    })}
                    {eventosDia.length > 2 && (
                      <span className="text-[9px] font-extrabold text-label-secondary pl-1">
                        +{eventosDia.length - 2} más
                      </span>
                    )}
                  </div>
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
