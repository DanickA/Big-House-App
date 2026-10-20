'use client';

import { useState, useRef, useMemo, useCallback, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { EventoUnificado } from '@/actions/eventos';
import {
  crearEvento,
  actualizarEvento,
  eliminarEventoFisico,
  toggleEstadoSubtarea,
} from '@/actions/calendario';
import { exportarRecordatorioHogarAGoogle } from '@/actions/google-calendar';
import { TipoPlantilla } from '@prisma/client';
import GoogleCalendarButton from './GoogleCalendarButton';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  Plus,
  Sprout,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  AlignLeft,
  Trash2,
  Pencil,
  ExternalLink,
  Cloud,
  X,
  Check,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';

interface CalendarioViewProps {
  initialEventos: EventoUnificado[];
  miembros: { id: string; nombre: string; email?: string }[];
  usuarioActualId?: string;
  onRefresh: (mes: number, anio: number) => Promise<EventoUnificado[]>;
}

type FiltroOrigen = 'TODOS' | 'EVENTOS' | 'PLANTA' | 'SERVICIO';

const DIAS_SEMANA_CORTO = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const DIAS_SEMANA_LARGO = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const COLORES_GOOGLE = [
  { hex: '#54749d', nombre: 'Acero Primario' },
  { hex: '#3e6190', nombre: 'Zafiro Profundo' },
  { hex: '#6b87a9', nombre: 'Acero Medio' },
  { hex: '#8599b2', nombre: 'Pizarra Suave' },
  { hex: '#f9deaf', nombre: 'Vainilla Dorado' },
];

export default function CalendarioView({
  initialEventos,
  onRefresh,
}: CalendarioViewProps) {
  const hoy = useMemo(() => new Date(), []);
  const [mesActual, setMesActual] = useState(hoy.getMonth()); // 0-11
  const [anioActual, setAnioActual] = useState(hoy.getFullYear());
  const [eventos, setEventos] = useState<EventoUnificado[]>(initialEventos);
  const [cargando, setCargando] = useState(false);
  const [filtroOrigen, setFiltroOrigen] = useState<FiltroOrigen>('TODOS');
  const [notificacion, setNotificacion] = useState<{
    texto: string;
    tipo: 'ok' | 'error';
  } | null>(null);

  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Día seleccionado y cápsula expandida (Acordeón In-Place sin duplicidad)
  const [selectedDate, setSelectedDate] = useState<Date>(hoy);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  // Estado de la Gaveta Inferior Contenida (Bottom Sheet 2B-2)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventoUnificado | null>(null);
  const [mostrarOpcionesExtra, setMostrarOpcionesExtra] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [horaInicio, setHoraInicio] = useState('09:00');
  const [horaFin, setHoraFin] = useState('10:00');
  const [todoElDia, setTodoElDia] = useState(false);
  const [ubicacion, setUbicacion] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [color, setColor] = useState('#54749d');

  // Caché Stale-While-Revalidate en memoria para transiciones de 0 ms
  const cacheMesesRef = useRef<Record<string, EventoUnificado[]>>({
    [`${hoy.getMonth() + 1}-${hoy.getFullYear()}`]: initialEventos,
  });

  function mostrarAviso(texto: string, tipo: 'ok' | 'error' = 'ok') {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 3500);
  }

  const recargarMesActual = useCallback(
    async (m = mesActual + 1, y = anioActual) => {
      const actualizados = await onRefresh(m, y);
      const cacheKey = `${m}-${y}`;
      cacheMesesRef.current[cacheKey] = actualizados;
      setEventos(actualizados);
      return actualizados;
    },
    [onRefresh, mesActual, anioActual]
  );

  // Navegar meses con respuesta inmediata (0ms desde caché) y revalidación en segundo plano
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

    const cacheKey = `${nuevoMes + 1}-${nuevoAnio}`;
    if (cacheMesesRef.current[cacheKey]) {
      setEventos(cacheMesesRef.current[cacheKey]);
      onRefresh(nuevoMes + 1, nuevoAnio).then((nuevosEventos) => {
        cacheMesesRef.current[cacheKey] = nuevosEventos;
        setEventos(nuevosEventos);
      });
    } else {
      setCargando(true);
      const nuevosEventos = await onRefresh(nuevoMes + 1, nuevoAnio);
      cacheMesesRef.current[cacheKey] = nuevosEventos;
      setEventos(nuevosEventos);
      setCargando(false);
    }
  }

  async function irAHoy() {
    const d = new Date();
    const m = d.getMonth();
    const y = d.getFullYear();
    setSelectedDate(d);
    setMesActual(m);
    setAnioActual(y);

    const cacheKey = `${m + 1}-${y}`;
    if (cacheMesesRef.current[cacheKey]) {
      setEventos(cacheMesesRef.current[cacheKey]);
      onRefresh(m + 1, y).then((nuevosEventos) => {
        cacheMesesRef.current[cacheKey] = nuevosEventos;
        setEventos(nuevosEventos);
      });
    } else {
      setCargando(true);
      const nuevosEventos = await onRefresh(m + 1, y);
      cacheMesesRef.current[cacheKey] = nuevosEventos;
      setEventos(nuevosEventos);
      setCargando(false);
    }
  }

  const handleGoogleSynced = useCallback(() => {
    recargarMesActual(mesActual + 1, anioActual);
  }, [recargarMesActual, mesActual, anioActual]);

  function abrirCreacion(fechaBase = selectedDate) {
    setSelectedDate(fechaBase);
    setEditingEvent(null);
    setTitulo('');
    setHoraInicio('09:00');
    setHoraFin('10:00');
    setTodoElDia(false);
    setUbicacion('');
    setDescripcion('');
    setColor('#54749d');
    setMostrarOpcionesExtra(false);
    setIsSheetOpen(true);
  }

  function abrirEdicion(ev: EventoUnificado) {
    setEditingEvent(ev);
    setTitulo(ev.titulo);
    setTodoElDia(ev.todo_el_dia);
    const ini = new Date(ev.fecha_inicio);
    const fin = new Date(ev.fecha_fin || ev.fecha_inicio);
    setSelectedDate(ini);
    setHoraInicio(
      `${String(ini.getHours()).padStart(2, '0')}:${String(ini.getMinutes()).padStart(2, '0')}`
    );
    setHoraFin(
      `${String(fin.getHours()).padStart(2, '0')}:${String(fin.getMinutes()).padStart(2, '0')}`
    );
    setUbicacion(ev.ubicacion || '');
    setDescripcion(ev.descripcion || '');
    setColor(ev.color || '#54749d');
    setMostrarOpcionesExtra(Boolean(ev.ubicacion || ev.descripcion));
    setIsSheetOpen(true);
  }

  function cerrarSheet() {
    setIsSheetOpen(false);
    setEditingEvent(null);
  }

  // Guardar (Creación o Edición) con UI Optimista y Sincronización Bidireccional a Google Calendar
  function handleSubmitEvento(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;

    const inicio = new Date(selectedDate);
    if (!todoElDia) {
      const [h, m] = horaInicio.split(':').map(Number);
      inicio.setHours(h || 9, m || 0, 0, 0);
    } else {
      inicio.setHours(0, 0, 0, 0);
    }

    const fin = new Date(selectedDate);
    if (!todoElDia) {
      const [h, m] = horaFin.split(':').map(Number);
      fin.setHours(h || 10, m || 0, 0, 0);
    } else {
      fin.setHours(23, 59, 59, 999);
    }

    if (!todoElDia && fin <= inicio) {
      mostrarAviso('La hora de fin debe ser posterior a la de inicio', 'error');
      return;
    }

    const payload = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo_plantilla: (editingEvent?.tipo_plantilla as TipoPlantilla) || TipoPlantilla.EVENTO,
      fecha_inicio: inicio,
      fecha_fin: fin,
      todo_el_dia: todoElDia,
      color,
      ubicacion: ubicacion.trim() || undefined,
    };

    const targetEditing = editingEvent;
    cerrarSheet();

    startTransition(async () => {
      if (targetEditing) {
        const res = await actualizarEvento(targetEditing.id, payload, 'SIN_RECURRENCIA');
        if (res.success) {
          await recargarMesActual();
          if ((res as any).googleSynced) {
            mostrarAviso('Evento actualizado y sincronizado con Google Calendar');
          } else {
            mostrarAviso('Evento actualizado en la App');
          }
        } else {
          mostrarAviso(res.error || 'No se pudo actualizar el evento', 'error');
        }
      } else {
        const res = await crearEvento(payload);
        if (res.success) {
          await recargarMesActual();
          if ((res as any).googleSynced) {
            mostrarAviso('Evento agendado y sincronizado con Google Calendar');
          } else {
            mostrarAviso('Evento agendado en la App');
          }
        } else {
          mostrarAviso(res.error || 'No se pudo crear el evento', 'error');
        }
      }
    });
  }

  function handleEliminarEvento(ev: EventoUnificado) {
    // Actualización optimista inmediata
    setEventos((prev) => prev.filter((item) => item.id !== ev.id));
    setExpandedEventId(null);

    startTransition(async () => {
      const res = await eliminarEventoFisico(ev.id);
      if (res.success) {
        await recargarMesActual();
        mostrarAviso('Evento eliminado en la App y en Google Calendar');
      } else {
        await recargarMesActual();
        mostrarAviso(res.error || 'No se pudo eliminar el evento', 'error');
      }
    });
  }

  function handleToggleSubtarea(subtareaId: string, estadoActual: boolean) {
    const nuevoEstado = !estadoActual;
    setEventos((prev) =>
      prev.map((ev) => ({
        ...ev,
        subtareas: ev.subtareas?.map((st) =>
          st.id === subtareaId ? { ...st, completado: nuevoEstado } : st
        ),
      }))
    );

    startTransition(async () => {
      const res = await toggleEstadoSubtarea(subtareaId, nuevoEstado);
      if (!res.success) {
        await recargarMesActual();
      }
    });
  }

  function handleCopiarHogarAGoogle(ev: EventoUnificado) {
    startTransition(async () => {
      const res = await exportarRecordatorioHogarAGoogle({
        titulo: ev.titulo,
        descripcion: ev.descripcion,
        ubicacion: ev.ubicacion,
        fecha: ev.fecha_inicio,
        color: ev.color,
      });

      if (res.success) {
        await recargarMesActual();
        mostrarAviso(
          res.syncedToGoogle
            ? `Recordatorio "${ev.titulo}" sincronizado en tu Google Calendar`
            : `Recordatorio "${ev.titulo}" guardado en la agenda`
        );
      } else {
        mostrarAviso(res.error || 'No se pudo copiar a Google Calendar', 'error');
      }
    });
  }

  // Filtrado por Signpost (Origen)
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((ev) => {
      if (filtroOrigen === 'TODOS') return true;
      if (filtroOrigen === 'EVENTOS') return ev.origen === 'MANUAL';
      return ev.origen === filtroOrigen;
    });
  }, [eventos, filtroOrigen]);

  // Contadores únicos en los Signposts (Cero Duplicidad de Datos)
  const conteos = useMemo(() => {
    const manuales = eventos.filter((e) => e.origen === 'MANUAL').length;
    const plantas = eventos.filter((e) => e.origen === 'PLANTA').length;
    const servicios = eventos.filter((e) => e.origen === 'SERVICIO').length;
    return {
      todos: eventos.length,
      eventos: manuales,
      plantas,
      servicios,
    };
  }, [eventos]);

  // Matriz mensual
  const celdasMes = useMemo(() => {
    const primerDiaMes = new Date(anioActual, mesActual, 1);
    let diaSemanaInicio = primerDiaMes.getDay() - 1;
    if (diaSemanaInicio === -1) diaSemanaInicio = 6;

    const totalDiasMes = new Date(anioActual, mesActual + 1, 0).getDate();
    const celdas: { fecha: Date; esMesActual: boolean }[] = [];

    const diasMesAnterior = new Date(anioActual, mesActual, 0).getDate();
    for (let i = diaSemanaInicio - 1; i >= 0; i--) {
      celdas.push({
        fecha: new Date(anioActual, mesActual - 1, diasMesAnterior - i),
        esMesActual: false,
      });
    }

    for (let i = 1; i <= totalDiasMes; i++) {
      celdas.push({
        fecha: new Date(anioActual, mesActual, i),
        esMesActual: true,
      });
    }

    const celdasRestantes = 7 - (celdas.length % 7);
    if (celdasRestantes < 7) {
      for (let i = 1; i <= celdasRestantes; i++) {
        celdas.push({
          fecha: new Date(anioActual, mesActual + 1, i),
          esMesActual: false,
        });
      }
    }
    return celdas;
  }, [anioActual, mesActual]);

  function getEventosParaFecha(f: Date) {
    const fInicio = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 0, 0, 0, 0);
    const fFin = new Date(f.getFullYear(), f.getMonth(), f.getDate(), 23, 59, 59, 999);
    return eventosFiltrados.filter((ev) => {
      const evInicio = new Date(ev.fecha_inicio);
      const evFin = ev.fecha_fin ? new Date(ev.fecha_fin) : evInicio;
      return evInicio <= fFin && evFin >= fInicio;
    });
  }

  const eventosDiaSeleccionado = useMemo(
    () => getEventosParaFecha(selectedDate),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedDate, eventosFiltrados]
  );

  function esMismoDia(a: Date, b: Date) {
    return (
      a.getDate() === b.getDate() &&
      a.getMonth() === b.getMonth() &&
      a.getFullYear() === b.getFullYear()
    );
  }

  function formatHoraEvento(ev: EventoUnificado) {
    if (ev.todo_el_dia) return 'Todo el día';
    return new Date(ev.fecha_inicio).toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Notificación Flotante */}
      {notificacion && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-50 glass-card px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-xs animate-fade-in-up ${
            notificacion.tipo === 'error'
              ? 'bg-red-100/95 dark:bg-red-950/80 border border-red-300 text-red-700 dark:text-red-300'
              : 'bg-mint/20 border border-mint/40 text-label-primary'
          }`}
        >
          {notificacion.tipo === 'error' ? (
            <AlertCircle size={16} className="shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="shrink-0" />
          )}
          <span>{notificacion.texto}</span>
        </div>
      )}

      {/* CABECERA ÚNICA (Sin superposición entre Selector de Mes y Google Sync en móvil) */}
      <div className="glass-card p-3.5 sm:p-5 rounded-[1.8rem] sm:rounded-[2rem] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Fila 1 en Móvil / Izquierda en Desktop: Selector de Mes + Botón Hoy */}
          <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
            <div className="flex items-center bg-tertiary p-1 rounded-2xl border border-separator">
              <button
                type="button"
                onClick={() => cambiarMes(-1)}
                className="w-8 h-8 rounded-xl bg-secondary hover:bg-mint/20 text-label-primary border border-separator flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                title="Mes anterior"
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>
              <h2 className="px-3 text-sm sm:text-base font-bold text-label-primary min-w-[130px] sm:min-w-[148px] text-center tracking-tight">
                {MESES[mesActual]} {anioActual}
              </h2>
              <button
                type="button"
                onClick={() => cambiarMes(1)}
                className="w-8 h-8 rounded-xl bg-secondary hover:bg-mint/20 text-label-primary border border-separator flex items-center justify-center transition cursor-pointer active:scale-90 shrink-0"
                title="Mes siguiente"
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </div>

            <button
              type="button"
              onClick={irAHoy}
              className="px-3 py-2 bg-tertiary hover:bg-secondary text-xs font-bold text-label-primary rounded-xl border border-separator transition cursor-pointer active:scale-95 shrink-0"
            >
              Hoy
            </button>
          </div>

          {/* Fila 2 en Móvil / Derecha en Desktop: Botón Google Calendar Sync + Agendar */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0 border-t sm:border-t-0 border-separator">
            <GoogleCalendarButton
              mes={mesActual + 1}
              anio={anioActual}
              onSynced={handleGoogleSynced}
            />

            <button
              type="button"
              onClick={() => abrirCreacion(selectedDate)}
              className="px-3.5 py-2 bg-terracotta hover:bg-terracotta-hover text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Agendar</span>
            </button>
          </div>
        </div>

        {/* SIGNPOSTS INTERACTIVOS DE FILTRADO (Único lugar donde aparecen los conteos -> Cero Duplicidad) */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar">
          {[
            { id: 'TODOS', label: 'Todos', count: conteos.todos, icon: null },
            { id: 'EVENTOS', label: 'Google y Eventos', count: conteos.eventos, icon: Cloud },
            { id: 'PLANTA', label: 'Riegos', count: conteos.plantas, icon: Sprout },
            { id: 'SERVICIO', label: 'Finanzas', count: conteos.servicios, icon: Receipt },
          ].map((pill) => {
            const active = filtroOrigen === pill.id;
            const Icon = pill.icon;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFiltroOrigen(pill.id as FiltroOrigen)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
                  active
                    ? 'bg-terracotta text-white border-terracotta'
                    : 'bg-tertiary text-label-secondary border-separator hover:text-label-primary'
                }`}
              >
                {Icon && <Icon size={12} />}
                <span>{pill.label}</span>
                <span
                  className={`px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                    active ? 'bg-white/20 text-white' : 'bg-secondary text-label-secondary'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* LAYOUT 2B-2: SPLIT MASTER-DETAIL + MES ULTRA-COMPACTO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* COLUMNA IZQUIERDA (MASTER): CUADRÍCULA MENSUAL ULTRA-COMPACTA */}
        <div className="lg:col-span-7 glass-card rounded-[1.8rem] sm:rounded-[2rem] p-3 sm:p-5">
          {/* Nombres de los días de la semana (1 letra en celular, 3 letras en desktop) */}
          <div className="grid grid-cols-7 gap-1 mb-1.5 text-center">
            {DIAS_SEMANA_CORTO.map((diaCorto, i) => (
              <div
                key={i}
                className="text-[11px] font-bold text-label-secondary py-1"
              >
                <span className="sm:hidden">{diaCorto}</span>
                <span className="hidden sm:inline">{DIAS_SEMANA_LARGO[i]}</span>
              </div>
            ))}
          </div>

          {/* Celdas de los días (Plano 2: superficie sólida limpia con borde simétrico 1px) */}
          <div
            className={`grid grid-cols-7 gap-1 sm:gap-2 ${
              cargando ? 'opacity-50' : ''
            } transition-opacity`}
          >
            {celdasMes.map(({ fecha, esMesActual }, index) => {
              const esHoy = esMismoDia(fecha, hoy);
              const seleccionado = esMismoDia(fecha, selectedDate);
              const eventosDia = getEventosParaFecha(fecha);

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedDate(fecha)}
                  className={`h-10 sm:h-16 p-1 sm:p-2 rounded-xl sm:rounded-2xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                    seleccionado
                      ? 'bg-terracotta text-white border-terracotta'
                      : esHoy
                      ? 'bg-terracotta/15 border-terracotta text-label-primary'
                      : esMesActual
                      ? 'bg-tertiary border-separator text-label-primary hover:border-terracotta/50'
                      : 'opacity-35 border-transparent text-label-quaternary'
                  }`}
                >
                  <span className="text-xs font-bold tabular-nums leading-none mt-0.5">
                    {fecha.getDate()}
                  </span>

                  {/* Puntos cromáticos limpios por evento (Cero texto truncado ilegible en celdas móviles) */}
                  <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
                    {eventosDia.slice(0, 3).map((ev) => (
                      <span
                        key={ev.id}
                        className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                        style={{
                          backgroundColor: seleccionado ? '#f8eddb' : ev.color || '#54749d',
                        }}
                      />
                    ))}
                    {eventosDia.length > 3 && (
                      <span
                        className={`text-[8px] font-bold leading-none ${
                          seleccionado ? 'text-white' : 'text-label-tertiary'
                        }`}
                      >
                        +
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* COLUMNA DERECHA / INFERIOR (DETAIL): AGENDA DEL DÍA CON CÁPSULAS ACORDEÓN IN-PLACE */}
        <div className="lg:col-span-5 glass-card rounded-[1.8rem] sm:rounded-[2rem] p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between border-b border-separator pb-3 gap-2">
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-label-primary capitalize truncate">
                {selectedDate.toLocaleDateString('es-CO', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </h3>
              <p className="text-xs text-label-secondary mt-0.5">
                {eventosDiaSeleccionado.length === 0
                  ? 'Día libre — sin compromisos'
                  : `${eventosDiaSeleccionado.length} ${
                      eventosDiaSeleccionado.length === 1 ? 'compromiso' : 'compromisos'
                    }`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => abrirCreacion(selectedDate)}
              className="px-3 py-1.5 rounded-xl bg-terracotta/15 hover:bg-terracotta text-label-primary hover:text-white border border-separator text-xs font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 shrink-0"
            >
              <Plus size={14} strokeWidth={2.5} />
              <span>Añadir</span>
            </button>
          </div>

          {eventosDiaSeleccionado.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-label-secondary">
                No hay actividades programadas para este día.
              </p>
              <button
                type="button"
                onClick={() => abrirCreacion(selectedDate)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-label-secondary hover:underline cursor-pointer"
              >
                <Plus size={13} />
                <span>Agendar evento en Google Calendar</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-0.5">
              {eventosDiaSeleccionado.map((ev) => {
                const isExpanded = expandedEventId === ev.id;
                const esPlanta = ev.origen === 'PLANTA';
                const esServicio = ev.origen === 'SERVICIO';
                const esCancelado = ev.estado === 'CANCELADO';

                return (
                  <div
                    key={ev.id}
                    className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                      esCancelado
                        ? 'opacity-55 bg-tertiary/50 border-separator'
                        : isExpanded
                        ? 'bg-tertiary border-terracotta'
                        : 'bg-tertiary border-separator hover:border-terracotta/50'
                    }`}
                  >
                    {/* Nivel 1 Visible: Identidad + Hora + Acción Primaria / Chevron */}
                    <div
                      onClick={() => setExpandedEventId(isExpanded ? null : ev.id)}
                      className="px-3.5 py-3 flex items-center justify-between gap-2.5 cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-2xs"
                          style={{ backgroundColor: ev.color || '#54749d' }}
                        >
                          {esPlanta ? (
                            <Sprout size={15} />
                          ) : esServicio ? (
                            <Receipt size={15} />
                          ) : (
                            <CalendarIcon size={15} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p
                              className={`text-xs sm:text-sm font-bold text-label-primary truncate ${
                                esCancelado ? 'line-through text-label-tertiary' : ''
                              }`}
                            >
                              {ev.titulo}
                            </p>
                            {ev.origen === 'MANUAL' && (
                              <span
                                className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-mint/15 text-olive dark:text-mint shrink-0"
                                title={
                                  ev.google_event_id
                                    ? 'Sincronizado con Google Calendar'
                                    : 'Evento de Agenda'
                                }
                              >
                                <Cloud size={10} />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-label-secondary truncate flex items-center gap-1 mt-0.5">
                            <Clock size={10} className="shrink-0 opacity-70" />
                            <span>{formatHoraEvento(ev)}</span>
                            {ev.ubicacion && (
                              <>
                                <span>•</span>
                                <span className="truncate">{ev.ubicacion}</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {esPlanta && (
                          <Link
                            href="/plantas"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 rounded-lg bg-mint/20 hover:bg-mint/30 text-olive dark:text-mint text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <span>Jardín</span>
                            <ExternalLink size={10} />
                          </Link>
                        )}
                        {esServicio && (
                          <Link
                            href="/finanzas"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2 py-1 rounded-lg bg-terracotta/15 hover:bg-terracotta/25 text-terracotta text-[11px] font-bold flex items-center gap-1 transition"
                          >
                            <span>Finanzas</span>
                            <ExternalLink size={10} />
                          </Link>
                        )}
                        <ChevronDown
                          size={15}
                          className={`text-label-tertiary transition-transform duration-200 ${
                            isExpanded ? 'rotate-180 text-terracotta' : ''
                          }`}
                        />
                      </div>
                    </div>

                    {/* Nivel 2 (Acordeón In-Place): Notas, Subtareas Interactivas y Acciones */}
                    {isExpanded && (
                      <div className="px-3.5 pb-3 pt-2 border-t border-separator/50 bg-system/40 dark:bg-secondary/30 space-y-2.5 animate-fade-in">
                        {ev.descripcion ? (
                          <div className="flex items-start gap-2 text-xs text-label-secondary">
                            <AlignLeft size={12} className="shrink-0 mt-0.5 text-label-tertiary" />
                            <p className="leading-relaxed">{ev.descripcion}</p>
                          </div>
                        ) : (
                          <p className="text-[11px] text-label-tertiary italic">
                            Sin descripción adicional.
                          </p>
                        )}

                        {/* Subtareas interactivas en 1 toque */}
                        {ev.subtareas && ev.subtareas.length > 0 && (
                          <div className="space-y-1 pt-0.5">
                            {ev.subtareas.map((st) => (
                              <button
                                key={st.id}
                                type="button"
                                onClick={() => handleToggleSubtarea(st.id, st.completado)}
                                className="w-full flex items-center gap-2 text-xs text-label-primary py-0.5 text-left hover:opacity-80 cursor-pointer"
                              >
                                <span
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                                    st.completado
                                      ? 'bg-mint border-mint text-white'
                                      : 'border-separator bg-tertiary'
                                  }`}
                                >
                                  {st.completado && <Check size={10} />}
                                </span>
                                <span
                                  className={
                                    st.completado ? 'line-through text-label-tertiary' : ''
                                  }
                                >
                                  {st.descripcion}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-1.5 border-t border-separator/40 gap-2">
                          <span className="text-[10.5px] text-label-tertiary truncate">
                            {ev.origen === 'MANUAL'
                              ? ev.google_event_id
                                ? 'Sincronizado con Google Calendar'
                                : 'Evento de Agenda del Hogar'
                              : ev.origen === 'PLANTA'
                              ? 'Ciclo automático de riego'
                              : 'Vencimiento programado'}
                          </span>

                          {ev.origen === 'MANUAL' ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => abrirEdicion(ev)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-label-secondary hover:text-label-primary hover:bg-tertiary flex items-center gap-1 transition cursor-pointer"
                              >
                                <Pencil size={11} />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEliminarEvento(ev)}
                                className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-1 transition cursor-pointer"
                              >
                                <Trash2 size={11} />
                                <span>Borrar</span>
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopiarHogarAGoogle(ev)}
                              disabled={isPending}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-olive dark:text-mint bg-mint/15 hover:bg-mint/25 flex items-center gap-1 transition cursor-pointer shrink-0"
                            >
                              <Cloud size={11} />
                              <span>Copiar a Google</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* GAVETA INFERIOR CONTENIDA (BOTTOM SHEET EN MÓVIL / MODAL COMPACTO EN DESKTOP — 2B-2) */}
      {mounted && isSheetOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black/45 backdrop-blur-[2px] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={cerrarSheet}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-system dark:bg-secondary rounded-t-3xl sm:rounded-3xl p-4 sm:p-6 border-t sm:border border-separator shadow-2xl flex flex-col max-h-[88dvh] overflow-hidden"
          >
            {/* Tirador de gaveta móvil */}
            <div className="w-10 h-1 bg-separator rounded-full mx-auto sm:hidden mb-2 shrink-0" />

            <div className="flex items-center justify-between gap-2 pb-2.5 shrink-0 border-b border-separator/40">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-mint/20 text-olive dark:text-mint flex items-center justify-center shrink-0">
                  <Cloud size={16} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-label-primary truncate">
                    {editingEvent ? 'Editar Evento' : 'Nuevo Evento en Google Calendar'}
                  </h3>
                  <p className="text-[11px] text-label-secondary capitalize truncate">
                    {selectedDate.toLocaleDateString('es-CO', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                    })}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={cerrarSheet}
                className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-label-secondary hover:text-label-primary shrink-0 cursor-pointer"
                aria-label="Cerrar modal"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitEvento} className="flex flex-col min-h-0 flex-1 overflow-hidden pt-2">
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 min-w-0">
                {/* Campo 1: Título */}
                <div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Título (ej. Cita médica, Reunión, Mercado)..."
                    className="w-full min-w-0 px-3.5 py-2.5 rounded-2xl bg-tertiary border border-separator text-sm font-semibold text-label-primary focus:outline-none focus:border-terracotta"
                  />
                </div>

                {/* Campo 2: Horario en Grid de 2 Columnas (Nunca rompe el ancho en celular de 320px-375px) */}
                <div className="rounded-2xl bg-tertiary p-3 border border-separator/70 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-label-secondary flex items-center gap-1.5">
                      <Clock size={13} className="text-terracotta" />
                      <span>Horario</span>
                    </span>
                    <label className="flex items-center gap-2 text-xs font-bold text-label-primary cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={todoElDia}
                        onChange={(e) => setTodoElDia(e.target.checked)}
                        className="rounded accent-terracotta w-4 h-4"
                      />
                      <span>Todo el día</span>
                    </label>
                  </div>

                  {!todoElDia && (
                    <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                      <div className="min-w-0">
                        <label className="block text-[10.5px] font-semibold text-label-tertiary mb-1">
                          Hora de inicio
                        </label>
                        <input
                          type="time"
                          value={horaInicio}
                          onChange={(e) => setHoraInicio(e.target.value)}
                          className="w-full min-w-0 px-2.5 py-1.5 rounded-xl bg-secondary border border-separator text-xs font-bold text-label-primary focus:outline-none focus:border-terracotta"
                        />
                      </div>
                      <div className="min-w-0">
                        <label className="block text-[10.5px] font-semibold text-label-tertiary mb-1">
                          Hora de fin
                        </label>
                        <input
                          type="time"
                          value={horaFin}
                          onChange={(e) => setHoraFin(e.target.value)}
                          className="w-full min-w-0 px-2.5 py-1.5 rounded-xl bg-secondary border border-separator text-xs font-bold text-label-primary focus:outline-none focus:border-terracotta"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Acordeón de Divulgación Progresiva: Ubicación, Notas y Color */}
                <div>
                  <button
                    type="button"
                    onClick={() => setMostrarOpcionesExtra(!mostrarOpcionesExtra)}
                    className="text-xs font-bold text-terracotta flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronDown
                      size={14}
                      className={`transition-transform ${mostrarOpcionesExtra ? 'rotate-180' : ''}`}
                    />
                    <span>
                      {mostrarOpcionesExtra
                        ? 'Ocultar ubicación, notas y color'
                        : '+ Añadir ubicación, notas o color'}
                    </span>
                  </button>

                  {mostrarOpcionesExtra && (
                    <div className="space-y-2.5 pt-2.5 animate-fade-in">
                      <div className="flex items-center gap-2 bg-tertiary px-3 py-2 rounded-xl border border-separator min-w-0">
                        <MapPin size={14} className="text-label-tertiary shrink-0" />
                        <input
                          type="text"
                          value={ubicacion}
                          onChange={(e) => setUbicacion(e.target.value)}
                          placeholder="Ubicación o enlace"
                          className="w-full min-w-0 text-xs bg-transparent focus:outline-none text-label-primary"
                        />
                      </div>

                      <div className="flex items-start gap-2 bg-tertiary px-3 py-2 rounded-xl border border-separator min-w-0">
                        <AlignLeft size={14} className="text-label-tertiary shrink-0 mt-0.5" />
                        <textarea
                          rows={2}
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          placeholder="Descripción o notas (se sincronizan en Google Calendar)"
                          className="w-full min-w-0 text-xs bg-transparent focus:outline-none text-label-primary resize-none"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-xs text-label-secondary font-medium">Color:</span>
                        <div className="flex items-center gap-2">
                          {COLORES_GOOGLE.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setColor(c.hex)}
                              className={`w-6 h-6 rounded-full transition-transform cursor-pointer ${
                                color === c.hex
                                  ? 'scale-120 ring-2 ring-offset-2 ring-terracotta'
                                  : ''
                              }`}
                              style={{ backgroundColor: c.hex }}
                              title={c.nombre}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-3 mt-2 border-t border-separator/50 shrink-0 pb-[env(safe-area-inset-bottom,0px)]">
                <button
                  type="button"
                  onClick={cerrarSheet}
                  className="w-full py-2.5 rounded-xl border border-separator bg-tertiary text-xs font-semibold text-label-secondary hover:text-label-primary cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full py-2.5 rounded-xl bg-terracotta hover:bg-terracotta-hover text-white text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {isPending && <Loader2 size={13} className="animate-spin" />}
                  <span>{editingEvent ? 'Guardar cambios' : 'Guardar en Google'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
