'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { EventoUnificado, deleteEvento } from '@/actions/eventos';
import {
  crearEvento,
  actualizarEvento,
  cancelarEventoLogico,
  eliminarEventoFisico,
  EventoData,
  OpcionRecurrenciaEdicion,
} from '@/actions/calendario';
import ConfirmModal from '@/components/ui/ConfirmModal';
import AppleSwitch from '@/components/ui/AppleSwitch';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { TipoPlantilla, CanalRecordatorio, EstadoEvento } from '@prisma/client';
import {
  X,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Check,
  Trash2,
  Sparkles,
  HeartHandshake,
  ListTodo,
  Stethoscope,
  ShoppingCart,
  Minus,
  AlertCircle,
  Sprout,
  Receipt,
  Bell,
  Mail,
  Smartphone,
  CheckSquare,
  Square,
  User,
  Repeat,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Pencil,
  XCircle,
} from 'lucide-react';

interface EventoContextModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  eventosDelDia: EventoUnificado[];
  miembros: { id: string; nombre: string; email?: string }[];
  usuarioActualId?: string;
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

// 5 Plantillas Preconfiguradas (RF-02)
const PLANTILLAS_CONFIG = [
  {
    tipo: TipoPlantilla.EVENTO,
    label: 'Evento Estándar',
    icon: CalendarIcon,
    color: '#2563EB',
    placeholder: 'Ej. Reunión familiar, cena con amigos...',
  },
  {
    tipo: TipoPlantilla.CUMPLEANOS,
    label: 'Cumpleaños',
    icon: HeartHandshake,
    color: '#7C3AED',
    placeholder: 'Ej. Cumpleaños de...',
  },
  {
    tipo: TipoPlantilla.TAREA,
    label: 'Tarea',
    icon: ListTodo,
    color: '#D97706',
    placeholder: 'Ej. Limpiar filtros, podar jardín...',
  },
  {
    tipo: TipoPlantilla.CITA_MEDICA,
    label: 'Cita Médica',
    icon: Stethoscope,
    color: '#0284C7',
    placeholder: 'Ej. Control odontológico, pediatra...',
  },
  {
    tipo: TipoPlantilla.MERCADO,
    label: 'Mercado',
    icon: ShoppingCart,
    color: '#059669',
    placeholder: 'Ej. Mercado quincenal...',
  },
];

// Paleta de Colores Identificadores
const PALETA_COLORES = [
  '#2563EB', // Azul
  '#5F6F52', // Verde Oliva
  '#C86242', // Terracota
  '#D97706', // Ámbar
  '#7C3AED', // Violeta
  '#059669', // Esmeralda
];

const MESES_LABELS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DIAS_MINI = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

export default function EventoContextModal({
  isOpen,
  selectedDate,
  eventosDelDia,
  miembros,
  usuarioActualId,
  onClose,
  onSuccess,
}: EventoContextModalProps) {
  const [mounted, setMounted] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // 1. Plantilla activa
  const [plantilla, setPlantilla] = useState<TipoPlantilla>(TipoPlantilla.EVENTO);

  // 2. Atributos Comunes
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [color, setColor] = useState(PLANTILLAS_CONFIG[0].color);
  const [idEventoAEliminar, setIdEventoAEliminar] = useState<string | null>(null);
  const [eventoAEditar, setEventoAEditar] = useState<EventoUnificado | null>(null);
  const [idEventoACancelar, setIdEventoACancelar] = useState<{ id: string; titulo: string } | null>(null);
  const [mostrarDialogoRecurrencia, setMostrarDialogoRecurrencia] = useState(false);
  const [payloadPendienteRecurrencia, setPayloadPendienteRecurrencia] = useState<Partial<EventoData> | null>(null);

  // Fecha seleccionada editable puntual (Formulario Híbrido Contextual)
  const [fechaActividad, setFechaActividad] = useState<string>('');
  const [mostrarMiniCal, setMostrarMiniCal] = useState(false);
  const [miniCalMes, setMiniCalMes] = useState(new Date().getMonth());
  const [miniCalAnio, setMiniCalAnio] = useState(new Date().getFullYear());

  // Sincronizar mini calendario con la fecha activa
  useEffect(() => {
    if (fechaActividad) {
      const [y, m] = fechaActividad.split('-').map(Number);
      if (y && m) {
        setMiniCalAnio(y);
        setMiniCalMes(m - 1);
      }
    }
  }, [fechaActividad]);

  // Temporalidad Híbrida (12h AM/PM amigable y directa)
  const [todoElDia, setTodoElDia] = useState(false);
  const [hora12, setHora12] = useState('09');
  const [minutos, setMinutos] = useState('00');
  const [periodo, setPeriodo] = useState<'AM' | 'PM'>('AM');
  const minInputRef = useRef<HTMLInputElement>(null);

  // Recordatorios y Alarmas Comunes
  const [activarAlarma, setActivarAlarma] = useState(false);
  const [canalPush, setCanalPush] = useState(true);
  const [canalEmail, setCanalEmail] = useState(false);
  const [minutosAnticipacion, setMinutosAnticipacion] = useState(60); // 1 hora por defecto

  // 3. Campos Específicos por Plantilla (RF-02)
  // Plantilla 1: Evento Estándar
  const [organizadorId, setOrganizadorId] = useState(usuarioActualId || miembros[0]?.id || '');
  const [correoContacto, setCorreoContacto] = useState('');
  const [asistentesIds, setAsistentesIds] = useState<string[]>([]);

  // Plantilla 2: Cumpleaños
  const [recurrenciaAnual, setRecurrenciaAnual] = useState(true);
  const [agasajadoTipo, setAgasajadoTipo] = useState<'hogar' | 'externo'>('hogar');
  const [agasajadoHogarId, setAgasajadoHogarId] = useState(miembros[0]?.id || '');
  const [agasajadoExternoNombre, setAgasajadoExternoNombre] = useState('');
  const [agasajadoExternoContacto, setAgasajadoExternoContacto] = useState('');
  const [participantesCumpleIds, setParticipantesCumpleIds] = useState<string[]>([]);

  // Plantilla 3: Tarea
  const [responsableTareaId, setResponsableTareaId] = useState(usuarioActualId || miembros[0]?.id || '');
  const [participantesTareaIds, setParticipantesTareaIds] = useState<string[]>([]);
  const [estadoTarea, setEstadoTarea] = useState<EstadoEvento>(EstadoEvento.ACTIVO);
  const [subtareas, setSubtareas] = useState<{ id: string; descripcion: string; completado: boolean }[]>([]);
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  // Plantilla 4: Cita Médica
  const [pacienteId, setPacienteId] = useState(usuarioActualId || miembros[0]?.id || '');
  const [acompanantesIds, setAcompanantesIds] = useState<string[]>([]);
  const [especialista, setEspecialista] = useState('');
  const [especialidad, setEspecialidad] = useState('');

  // Plantilla 5: Mercado
  const [encargadosMercadoIds, setEncargadosMercadoIds] = useState<string[]>(
    usuarioActualId ? [usuarioActualId] : miembros[0]?.id ? [miembros[0].id] : []
  );
  const [itemsMercado, setItemsMercado] = useState<{ id: string; descripcion: string; completado: boolean }[]>([]);
  const [nuevoItemMercado, setNuevoItemMercado] = useState('');

  function aFechaString(d: Date) {
    const anio = d.getFullYear();
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  useEffect(() => {
    setMounted(true);
  }, []);

  // Inicialización al abrir modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (eventosDelDia.length === 0) {
        setMostrarFormulario(true);
      } else {
        setMostrarFormulario(false);
      }
      if (selectedDate) {
        setFechaActividad(aFechaString(selectedDate));
      } else {
        setFechaActividad(aFechaString(new Date()));
      }
      resetFormulario(TipoPlantilla.EVENTO);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, selectedDate, eventosDelDia.length]);

  function resetFormulario(nuevaPlantilla: TipoPlantilla) {
    setPlantilla(nuevaPlantilla);
    const config = PLANTILLAS_CONFIG.find((p) => p.tipo === nuevaPlantilla) || PLANTILLAS_CONFIG[0];
    setColor(config.color);
    setTitulo('');
    setDescripcion('');
    setUbicacion('');
    setErrorMsg(null);

    // Ajustes por defecto de temporalidad según plantilla
    if (nuevaPlantilla === TipoPlantilla.CUMPLEANOS) {
      setTodoElDia(true);
      setHora12('09');
      setMinutos('00');
      setPeriodo('AM');
    } else if (nuevaPlantilla === TipoPlantilla.CITA_MEDICA) {
      setTodoElDia(false);
      setHora12('10');
      setMinutos('00');
      setPeriodo('AM');
    } else {
      setTodoElDia(false);
      setHora12('09');
      setMinutos('00');
      setPeriodo('AM');
    }

    setActivarAlarma(false);
    setCanalPush(true);
    setCanalEmail(false);
    setMinutosAnticipacion(60);

    setOrganizadorId(usuarioActualId || miembros[0]?.id || '');
    setCorreoContacto('');
    setAsistentesIds([]);

    setRecurrenciaAnual(true);
    setAgasajadoTipo('hogar');
    setAgasajadoHogarId(miembros[0]?.id || '');
    setAgasajadoExternoNombre('');
    setAgasajadoExternoContacto('');
    setParticipantesCumpleIds([]);

    setResponsableTareaId(usuarioActualId || miembros[0]?.id || '');
    setParticipantesTareaIds([]);
    setEstadoTarea(EstadoEvento.ACTIVO);
    setSubtareas([]);
    setNuevaSubtarea('');

    setPacienteId(usuarioActualId || miembros[0]?.id || '');
    setAcompanantesIds([]);
    setEspecialista('');
    setEspecialidad('');

    setEncargadosMercadoIds(usuarioActualId ? [usuarioActualId] : miembros[0]?.id ? [miembros[0].id] : []);
    setItemsMercado([]);
    setNuevoItemMercado('');
  }

  if (!isOpen || !mounted || !selectedDate) return null;

  // Fecha reactiva activa (usada para la cabecera y el cálculo de la actividad)
  const fechaActividadObj = fechaActividad
    ? (() => {
        const [y, m, d] = fechaActividad.split('-').map(Number);
        return new Date(y, (m || 1) - 1, d || 1);
      })()
    : selectedDate;

  const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fechaActividadObj);


  // Conversiones y utilidades de tiempo 12h / 24h
  function getHora24(h12Str: string, minStr: string, per: 'AM' | 'PM'): string {
    let h = parseInt(h12Str, 10);
    if (isNaN(h) || h < 1 || h > 12) h = 12;
    let m = parseInt(minStr, 10);
    if (isNaN(m) || m < 0 || m > 59) m = 0;
    let h24 = h % 12;
    if (per === 'PM') h24 += 12;
    return `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  function handleAjustarMinutos(deltaMinutos: number) {
    let h12Num = parseInt(hora12, 10);
    if (isNaN(h12Num) || h12Num < 1 || h12Num > 12) h12Num = 12;
    let minNum = parseInt(minutos, 10);
    if (isNaN(minNum) || minNum < 0 || minNum > 59) minNum = 0;

    let h24 = h12Num % 12;
    if (periodo === 'PM') h24 += 12;

    let totalMin = h24 * 60 + minNum + deltaMinutos;
    totalMin = ((totalMin % 1440) + 1440) % 1440;

    const nuevoH24 = Math.floor(totalMin / 60);
    const nuevoM = totalMin % 60;

    const nuevoPeriodo: 'AM' | 'PM' = nuevoH24 >= 12 ? 'PM' : 'AM';
    let nuevoH12 = nuevoH24 % 12;
    if (nuevoH12 === 0) nuevoH12 = 12;

    setHora12(nuevoH12.toString().padStart(2, '0'));
    setMinutos(nuevoM.toString().padStart(2, '0'));
    setPeriodo(nuevoPeriodo);
    setTodoElDia(false);
  }

  function handleTogglePeriodo(nuevoPeriodo: 'AM' | 'PM') {
    setPeriodo(nuevoPeriodo);
    setTodoElDia(false);
  }

  function handleSetMinutosExactos(nuevosMin: number) {
    setMinutos(nuevosMin.toString().padStart(2, '0'));
    setTodoElDia(false);
  }

  function handleHorasChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val === '') {
      setHora12('');
      return;
    }
    const num = parseInt(val, 10);
    if (num <= 12) {
      setHora12(val);
      setTodoElDia(false);
    }
  }

  function handleHorasBlur() {
    let num = parseInt(hora12, 10);
    if (isNaN(num) || num < 1 || num > 12) {
      num = 12;
    }
    setHora12(num.toString().padStart(2, '0'));
  }

  function handleMinutosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    if (val === '') {
      setMinutos('');
      return;
    }
    const num = parseInt(val, 10);
    if (num <= 59) {
      setMinutos(val);
      setTodoElDia(false);
    }
  }

  function handleMinutosBlur() {
    let num = parseInt(minutos, 10);
    if (isNaN(num) || num < 0 || num > 59) {
      num = 0;
    }
    setMinutos(num.toString().padStart(2, '0'));
  }

  // Toggle de selección en listas múltiples
  function toggleIdEnLista(id: string, lista: string[], setLista: (val: string[]) => void) {
    if (lista.includes(id)) {
      setLista(lista.filter((item) => item !== id));
    } else {
      setLista([...lista, id]);
    }
  }

  // Subtareas / Items de Mercado
  function handleAgregarSubtarea() {
    if (!nuevaSubtarea.trim()) return;
    setSubtareas([
      ...subtareas,
      { id: Math.random().toString(), descripcion: nuevaSubtarea.trim(), completado: false },
    ]);
    setNuevaSubtarea('');
  }

  function handleAgregarItemMercado() {
    if (!nuevoItemMercado.trim()) return;
    setItemsMercado([
      ...itemsMercado,
      { id: Math.random().toString(), descripcion: nuevoItemMercado.trim(), completado: false },
    ]);
    setNuevoItemMercado('');
  }

  // Manejo de envío del formulario
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!titulo.trim()) {
      setErrorMsg('El título es obligatorio.');
      return;
    }

    // Validaciones específicas según plantilla (RF-02)
    if (plantilla === TipoPlantilla.CITA_MEDICA) {
      if (todoElDia) {
        setErrorMsg('La cita médica requiere obligatoriamente una hora específica de inicio.');
        return;
      }
      if (!ubicacion.trim()) {
        setErrorMsg('La ubicación (consultorio o clínica) es obligatoria para una cita médica.');
        return;
      }
      if (!pacienteId) {
        setErrorMsg('Debe seleccionar obligatoriamente un paciente del hogar.');
        return;
      }
    }

    if (plantilla === TipoPlantilla.TAREA && !responsableTareaId) {
      setErrorMsg('Debe asignar un responsable para la tarea.');
      return;
    }

    if (plantilla === TipoPlantilla.CUMPLEANOS) {
      if (agasajadoTipo === 'externo' && !agasajadoExternoNombre.trim()) {
        setErrorMsg('Por favor ingrese el nombre del agasajado.');
        return;
      }
      if (agasajadoTipo === 'hogar' && !agasajadoHogarId) {
        setErrorMsg('Por favor seleccione al agasajado del hogar.');
        return;
      }
    }

    setProcesando(true);

    // Calcular inicio y fin reactivamente usando la fecha puntual seleccionada (+1h de duración estándar)
    const [y, mesNum, diaNum] = (fechaActividad || aFechaString(new Date())).split('-').map(Number);
    const dInicio = new Date(y, (mesNum || 1) - 1, diaNum || 1);
    let dFin = new Date(y, (mesNum || 1) - 1, diaNum || 1);

    if (todoElDia) {
      dInicio.setHours(0, 0, 0, 0);
      dFin.setHours(23, 59, 59, 999);
    } else {
      const [h, m] = getHora24(hora12, minutos, periodo).split(':').map(Number);
      dInicio.setHours(h ?? 9, m ?? 0, 0, 0);
      dFin = new Date(dInicio.getTime() + 60 * 60 * 1000); // +1 hora reactiva
    }

    // Preparar participantes según la plantilla
    let participantesFinales: string[] = [];
    const detalles: any = {};

    if (plantilla === TipoPlantilla.EVENTO) {
      participantesFinales = Array.from(new Set([organizadorId, ...asistentesIds]));
      detalles.organizador_id = organizadorId;
      if (correoContacto.trim()) detalles.correo_contacto = correoContacto.trim();
    } else if (plantilla === TipoPlantilla.CUMPLEANOS) {
      if (agasajadoTipo === 'hogar') {
        participantesFinales = Array.from(new Set([agasajadoHogarId, ...participantesCumpleIds]));
        detalles.agasajado_tipo = 'hogar';
        detalles.agasajado_interno_id = agasajadoHogarId;
      } else {
        participantesFinales = [...participantesCumpleIds];
        detalles.agasajado_tipo = 'externo';
        detalles.agasajado_externo = agasajadoExternoNombre.trim();
        if (agasajadoExternoContacto.trim()) detalles.contacto_externo = agasajadoExternoContacto.trim();
      }
    } else if (plantilla === TipoPlantilla.TAREA) {
      participantesFinales = Array.from(new Set([responsableTareaId, ...participantesTareaIds]));
      detalles.responsable_id = responsableTareaId;
    } else if (plantilla === TipoPlantilla.CITA_MEDICA) {
      participantesFinales = Array.from(new Set([pacienteId, ...acompanantesIds]));
      detalles.paciente_id = pacienteId;
      detalles.acompanantes_ids = acompanantesIds;
      if (especialista.trim()) detalles.especialista = especialista.trim();
      if (especialidad.trim()) detalles.especialidad = especialidad.trim();
    } else if (plantilla === TipoPlantilla.MERCADO) {
      participantesFinales = [...encargadosMercadoIds];
    }

    // Recordatorios
    const recordatoriosList: { tipo_canal: CanalRecordatorio; minutos_anticipacion: number }[] = [];
    if (activarAlarma) {
      if (canalPush) recordatoriosList.push({ tipo_canal: CanalRecordatorio.PUSH, minutos_anticipacion: minutosAnticipacion });
      if (canalEmail) recordatoriosList.push({ tipo_canal: CanalRecordatorio.EMAIL, minutos_anticipacion: minutosAnticipacion });
    }

    // Subtareas o Lista de compras
    const subtareasList =
      plantilla === TipoPlantilla.TAREA
        ? subtareas.map((s) => ({ descripcion: s.descripcion, completado: s.completado }))
        : plantilla === TipoPlantilla.MERCADO
        ? itemsMercado.map((i) => ({ descripcion: i.descripcion, completado: i.completado }))
        : [];

    const eventoPayload: EventoData = {
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || undefined,
      tipo_plantilla: plantilla,
      estado: plantilla === TipoPlantilla.TAREA ? estadoTarea : EstadoEvento.ACTIVO,
      fecha_inicio: dInicio,
      fecha_fin: dFin,
      todo_el_dia: todoElDia,
      color,
      ubicacion: ubicacion.trim() || undefined,
      recurrencia: plantilla === TipoPlantilla.CUMPLEANOS && recurrenciaAnual ? 'ANUAL' : undefined,
      detalles,
      creador_id: usuarioActualId || organizadorId || miembros[0]?.id || '',
      participantes_ids: participantesFinales,
      subtareas: subtareasList,
      recordatorios: recordatoriosList,
    };

    if (eventoAEditar) {
      if (eventoAEditar.recurrencia) {
        setPayloadPendienteRecurrencia(eventoPayload);
        setProcesando(false);
        setMostrarDialogoRecurrencia(true);
        return;
      }
      await ejecutarActualizacion(eventoPayload, 'SIN_RECURRENCIA');
      return;
    }

    const res = await crearEvento(eventoPayload);
    setProcesando(false);

    if (res.success) {
      onSuccess(`¡${PLANTILLAS_CONFIG.find((p) => p.tipo === plantilla)?.label} agendado con éxito!`);
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al guardar la actividad');
    }
  }

  async function ejecutarActualizacion(
    payload: Partial<EventoData>,
    opcionRecurrencia: OpcionRecurrenciaEdicion
  ) {
    if (!eventoAEditar) return;
    setProcesando(true);
    const res = await actualizarEvento(eventoAEditar.id, payload, opcionRecurrencia);
    setProcesando(false);
    setMostrarDialogoRecurrencia(false);
    setPayloadPendienteRecurrencia(null);
    if (res.success) {
      onSuccess('¡Actividad modificada con éxito!');
      setEventoAEditar(null);
      onClose();
    } else {
      setErrorMsg(res.error || 'No se pudo actualizar la actividad');
    }
  }

  function handleEditar(ev: EventoUnificado) {
    setEventoAEditar(ev);
    setMostrarFormulario(true);
    setPlantilla(ev.tipo_plantilla as TipoPlantilla);
    setTitulo(ev.titulo);
    setDescripcion(ev.descripcion || '');
    setUbicacion(ev.ubicacion || '');
    setColor(ev.color);
    setTodoElDia(ev.todo_el_dia);

    const fInicio = new Date(ev.fecha_inicio);
    setFechaActividad(aFechaString(fInicio));

    let h24 = fInicio.getHours();
    const m = fInicio.getMinutes().toString().padStart(2, '0');
    let p: 'AM' | 'PM' = 'AM';
    if (h24 >= 12) {
      p = 'PM';
      if (h24 > 12) h24 -= 12;
    } else if (h24 === 0) {
      h24 = 12;
    }
    setHora12(h24.toString().padStart(2, '0'));
    setMinutos(m);
    setPeriodo(p);

    const detalles = ev.detalles || {};

    if (ev.tipo_plantilla === TipoPlantilla.EVENTO) {
      setOrganizadorId(detalles.organizador_id || usuarioActualId || miembros[0]?.id || '');
      setCorreoContacto(detalles.correo_contacto || '');
      setAsistentesIds(ev.participantes ? ev.participantes.map((part) => part.id).filter((id) => id !== detalles.organizador_id) : []);
    } else if (ev.tipo_plantilla === TipoPlantilla.CUMPLEANOS) {
      setRecurrenciaAnual(ev.recurrencia === 'ANUAL');
      if (detalles.agasajado_tipo === 'externo') {
        setAgasajadoTipo('externo');
        setAgasajadoExternoNombre(detalles.agasajado_externo || '');
        setAgasajadoExternoContacto(detalles.contacto_externo || '');
      } else {
        setAgasajadoTipo('hogar');
        setAgasajadoHogarId(detalles.agasajado_interno_id || ev.participantes?.[0]?.id || miembros[0]?.id || '');
      }
      setParticipantesCumpleIds(ev.participantes ? ev.participantes.map((part) => part.id).filter((id) => id !== detalles.agasajado_interno_id) : []);
    } else if (ev.tipo_plantilla === TipoPlantilla.TAREA) {
      setResponsableTareaId(detalles.responsable_id || ev.participantes?.[0]?.id || usuarioActualId || miembros[0]?.id || '');
      setParticipantesTareaIds(ev.participantes ? ev.participantes.map((part) => part.id).filter((id) => id !== detalles.responsable_id) : []);
      setEstadoTarea((ev.estado as EstadoEvento) || EstadoEvento.ACTIVO);
      if (ev.subtareas) {
        setSubtareas(ev.subtareas.map((s) => ({ id: s.id, descripcion: s.descripcion, completado: s.completado })));
      }
    } else if (ev.tipo_plantilla === TipoPlantilla.CITA_MEDICA) {
      setPacienteId(detalles.paciente_id || ev.participantes?.[0]?.id || miembros[0]?.id || '');
      setAcompanantesIds(detalles.acompanantes_ids || (ev.participantes ? ev.participantes.map((part) => part.id).filter((id) => id !== detalles.paciente_id) : []));
      setEspecialista(detalles.especialista || '');
      setEspecialidad(detalles.especialidad || '');
    } else if (ev.tipo_plantilla === TipoPlantilla.MERCADO) {
      setEncargadosMercadoIds(ev.participantes ? ev.participantes.map((part) => part.id) : [usuarioActualId || miembros[0]?.id || '']);
      if (ev.subtareas) {
        setItemsMercado(ev.subtareas.map((s) => ({ id: s.id, descripcion: s.descripcion, completado: s.completado })));
      }
    }
  }

  function cancelarEdicion() {
    setEventoAEditar(null);
    if (eventosDelDia.length > 0) {
      setMostrarFormulario(false);
    }
    resetFormulario(TipoPlantilla.EVENTO);
  }

  function handleCancelarClick(ev: EventoUnificado) {
    setIdEventoACancelar({ id: ev.id, titulo: ev.titulo });
  }

  async function confirmarCancelarEvento() {
    if (!idEventoACancelar) return;
    setProcesando(true);
    const res = await cancelarEventoLogico(idEventoACancelar.id);
    setProcesando(false);
    if (res.success) {
      onSuccess(`Actividad "${idEventoACancelar.titulo}" cancelada. Permanecerá archivada en el historial.`);
      setIdEventoACancelar(null);
      onClose();
    } else {
      setErrorMsg(res.error || 'No se pudo cancelar la actividad');
      setIdEventoACancelar(null);
    }
  }

  function handleEliminar(id: string) {
    setIdEventoAEliminar(id);
  }

  async function confirmarEliminarEvento() {
    if (!idEventoAEliminar) return;
    setProcesando(true);
    const res = await eliminarEventoFisico(idEventoAEliminar);
    setProcesando(false);
    if (res.success) {
      onSuccess('Actividad eliminada definitivamente de la base de datos');
      setIdEventoAEliminar(null);
      onClose();
    } else {
      setErrorMsg(res.error || 'No se pudo eliminar el evento');
      setIdEventoAEliminar(null);
    }
  }

  const plantillaActualConfig = PLANTILLAS_CONFIG.find((p) => p.tipo === plantilla)!;

  // Cálculo del mini-calendario desplegable orgánico
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative glass-modal w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col my-auto max-h-[calc(100vh-3.5rem)] border border-white/80 dark:border-white/10 animate-fade-in-up">
        
        {/* Encabezado del Día */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-4.5 border-b border-[#E8E0D2]/80 dark:border-separator bg-white/85 dark:bg-[#1C1F1A]/85 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EEF2EA] dark:bg-[#282C25] border border-[#B7CBA9]/60 dark:border-separator text-[#3A4630] dark:text-olive flex items-center justify-center shadow-2xs font-black text-sm">
              {fechaActividadObj.getDate()}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-[#3A4630] dark:text-label-primary capitalize tracking-tight">
                {fechaFormateada}
              </h2>
              <p className="text-[11px] text-label-secondary font-medium">
                {eventosDelDia.length} {eventosDelDia.length === 1 ? 'evento programado' : 'eventos programados'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F4EFE6] dark:bg-tertiary text-label-secondary hover:text-label-primary hover:bg-[#E8E0D2] dark:hover:bg-secondary transition flex items-center justify-center cursor-pointer border border-[#E8E0D2] dark:border-separator active:scale-90"
          >
            <X size={15} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cuerpo Contextual */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 pr-5 sm:pr-7">
          
          {/* Agenda del Día Existente */}
          {eventosDelDia.length > 0 && !mostrarFormulario && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#3A4630] dark:text-label-primary uppercase tracking-wider">
                  Actividades para este día:
                </span>
                <button
                  type="button"
                  onClick={() => setMostrarFormulario(true)}
                  className="px-3 py-1.5 bg-[#5F6F52] hover:bg-[#4E5D42] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs active:scale-95"
                >
                  <Plus size={14} strokeWidth={2.5} />
                  <span>Agregar evento</span>
                </button>
              </div>

              <div className="space-y-2.5">
                {eventosDelDia.map((ev) => {
                  const esCancelado = ev.estado === 'CANCELADO';
                  return (
                    <div
                      key={ev.id}
                      className={`p-4 rounded-2xl border transition-all space-y-2 ${
                        esCancelado
                          ? 'bg-white/50 dark:bg-tertiary/30 border-gray-200/80 dark:border-separator opacity-60'
                          : 'bg-white/85 dark:bg-tertiary/60 border-white dark:border-white/10 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
                            style={{ backgroundColor: ev.color }}
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-extrabold text-[#3A4630] dark:text-label-primary truncate flex items-center gap-1.5">
                              {ev.origen === 'PLANTA' && <Sprout size={13} className="text-olive" />}
                              {ev.origen === 'SERVICIO' && <Receipt size={13} className="text-terracotta" />}
                              <span className={esCancelado ? 'line-through text-label-tertiary' : ''}>{ev.titulo}</span>
                              {esCancelado && (
                                <span className="text-[10px] uppercase font-bold bg-[#E8E0D2] dark:bg-tertiary text-label-secondary px-1.5 py-0.5 rounded-md">
                                  Cancelado
                                </span>
                              )}
                              {ev.recurrencia && (
                                <span className="text-[10px] font-bold bg-[#F3E8FF] dark:bg-purple-950/40 text-[#7C3AED] dark:text-purple-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                  <Repeat size={10} />
                                  <span>{ev.recurrencia}</span>
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-label-secondary font-medium">
                              {ev.todo_el_dia
                                ? 'Todo el día'
                                : new Date(ev.fecha_inicio).toLocaleTimeString('es-ES', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                              {ev.ubicacion ? ` • ${ev.ubicacion}` : ''}
                              {ev.creador ? ` • Por ${ev.creador.nombre}` : ''}
                            </p>
                          </div>
                        </div>

                        {ev.origen === 'MANUAL' && (
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleEditar(ev)}
                              className="p-1.5 text-label-secondary hover:text-label-primary hover:bg-[#EEF2EA] dark:hover:bg-secondary rounded-xl transition cursor-pointer"
                              title="Editar actividad"
                            >
                              <Pencil size={14} />
                            </button>
                            {!esCancelado && (
                              <button
                                type="button"
                                onClick={() => handleCancelarClick(ev)}
                                className="p-1.5 text-amber-sem hover:text-amber-sem hover:bg-amber-sem/15 rounded-xl transition cursor-pointer"
                                title="Cancelar actividad (conservar en historial)"
                              >
                                <XCircle size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleEliminar(ev.id)}
                              className="p-1.5 text-label-tertiary hover:text-terracotta hover:bg-[#FBEBE8] dark:hover:bg-terracotta/20 rounded-xl transition cursor-pointer"
                              title="Eliminar definitivamente"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Vista previa de subtareas si existen */}
                      {ev.subtareas && ev.subtareas.length > 0 && (
                        <div className="pt-2 border-t border-[#F0EAE1] dark:border-separator pl-6 space-y-1">
                          {ev.subtareas.map((st) => (
                            <div key={st.id} className="text-xs text-[#524D45] dark:text-label-secondary flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-label-tertiary" />
                              <span className={st.completado ? 'line-through text-label-quaternary' : ''}>
                                {st.descripcion}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Formulario Híbrido Contextual con Plantillas Rápidas (RF-02 y RF-03) */}
          {mostrarFormulario && (
            <form onSubmit={handleSubmit} className="space-y-6 pt-1">
              
              {/* Botón para volver a ver agenda si hay eventos */}
              {eventosDelDia.length > 0 && (
                <div className="flex justify-between items-center pb-2 border-b border-[#F0EAE1] dark:border-separator">
                  <span className="text-xs font-bold text-label-secondary">
                    {eventoAEditar ? 'Modificando Actividad' : 'Nueva Actividad'}
                  </span>
                  <button
                    type="button"
                    onClick={cancelarEdicion}
                    className="text-xs font-extrabold text-[#5F6F52] dark:text-olive hover:text-[#3A4630] dark:hover:text-label-primary cursor-pointer"
                  >
                    Volver a la agenda
                  </button>
                </div>
              )}

              {errorMsg && (
                <div className="p-3.5 bg-[#FAE2D8] dark:bg-terracotta/20 border border-[#F2BAA5] dark:border-terracotta/40 text-[#B84626] dark:text-terracotta rounded-2xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* 1. Selector de 5 Plantillas Preconfiguradas (RF-02) */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2.5">
                  Selecciona una Plantilla Rápida
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {PLANTILLAS_CONFIG.map((p) => {
                    const Icon = p.icon;
                    const isSelected = plantilla === p.tipo;
                    return (
                      <button
                        key={p.tipo}
                        type="button"
                        onClick={() => resetFormulario(p.tipo)}
                        className={`py-2.5 px-2 rounded-2xl text-xs font-bold flex flex-col items-center gap-1.5 transition cursor-pointer active:scale-95 border ${
                          isSelected
                            ? 'bg-[#3A4630] dark:bg-olive text-white border-[#3A4630] dark:border-olive shadow-md'
                            : 'bg-white/80 dark:bg-tertiary/60 hover:bg-white dark:hover:bg-tertiary text-label-secondary border-[#E8E0D2] dark:border-separator'
                        }`}
                      >
                        <Icon size={18} strokeWidth={isSelected ? 2.5 : 2} style={{ color: isSelected ? '#FFFFFF' : p.color }} />
                        <span className="text-[11px] tracking-tight leading-none text-center">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Título Contextual */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                  Título de la actividad *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-olive">
                    <Sparkles size={16} strokeWidth={2.2} />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder={plantillaActualConfig.placeholder}
                    className="w-full pl-10 pr-4 py-3 bg-white/85 dark:bg-tertiary/60 border border-[#D9CEBC] dark:border-separator rounded-2xl text-sm text-[#191C16] dark:text-label-primary font-semibold placeholder-[#A39E95] dark:placeholder-label-tertiary focus:outline-none focus:bg-white dark:focus:bg-tertiary focus:border-[#3A4630] dark:focus:border-olive focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              {/* 2.5 Selector de Fecha Puntual 100% Orgánico (Sin popup nativo) */}
              <div className="p-4.5 bg-white/75 dark:bg-tertiary/40 rounded-3xl border border-white/90 dark:border-white/10 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary flex items-center gap-1.5">
                    <CalendarIcon size={14} className="text-olive" />
                    <span>Fecha de la Actividad *</span>
                  </span>
                  <span className="text-[11px] font-bold text-olive capitalize">
                    {fechaFormateada}
                  </span>
                </div>

                {/* Cápsula de fecha y botón para desplegar mini-calendario */}
                <div className="flex items-center justify-between p-3 bg-white/95 dark:bg-secondary rounded-2xl border border-[#D9CEBC] dark:border-separator shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[#EEF2EA] dark:bg-tertiary text-[#3A4630] dark:text-olive flex items-center justify-center shrink-0 font-black text-xs border border-[#B7CBA9]/60 dark:border-separator">
                      {fechaActividadObj.getDate()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-[#3A4630] dark:text-label-primary capitalize truncate">
                        {fechaFormateada}
                      </p>
                      <p className="text-[10px] text-label-secondary font-medium">Toca para cambiar de día</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMostrarMiniCal(!mostrarMiniCal)}
                    className="px-3 py-1.5 rounded-xl bg-[#F4EFE6] dark:bg-tertiary hover:bg-[#E8E0D2] dark:hover:bg-secondary text-[#3A4630] dark:text-label-primary text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shrink-0 border border-[#E8E0D2] dark:border-separator"
                  >
                    <span>{mostrarMiniCal ? 'Ocultar' : 'Elegir día'}</span>
                    {mostrarMiniCal ? <ChevronUp size={13} strokeWidth={2.5} /> : <ChevronDown size={13} strokeWidth={2.5} />}
                  </button>
                </div>

                {/* Píldoras Rápidas de Atajo */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setFechaActividad(aFechaString(new Date()));
                      setMostrarMiniCal(false);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer active:scale-95 text-center ${
                      fechaActividad === aFechaString(new Date())
                        ? 'bg-[#5F6F52] text-white border-[#5F6F52] shadow-2xs'
                        : 'bg-white dark:bg-tertiary/60 hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-label-secondary border border-[#E8E0D2] dark:border-separator'
                    }`}
                  >
                    Hoy
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const manana = new Date();
                      manana.setDate(manana.getDate() + 1);
                      setFechaActividad(aFechaString(manana));
                      setMostrarMiniCal(false);
                    }}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer active:scale-95 text-center ${
                      fechaActividad ===
                      (() => {
                        const m = new Date();
                        m.setDate(m.getDate() + 1);
                        return aFechaString(m);
                      })()
                        ? 'bg-[#5F6F52] text-white border-[#5F6F52] shadow-2xs'
                        : 'bg-white dark:bg-tertiary/60 hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-label-secondary border border-[#E8E0D2] dark:border-separator'
                    }`}
                  >
                    Mañana
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      const diff = (6 - d.getDay() + 7) % 7 || 7;
                      d.setDate(d.getDate() + diff);
                      setFechaActividad(aFechaString(d));
                      setMostrarMiniCal(false);
                    }}
                    className="flex-1 py-1.5 rounded-xl text-xs font-bold transition border bg-white dark:bg-tertiary/60 hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-label-secondary border border-[#E8E0D2] dark:border-separator cursor-pointer active:scale-95 text-center"
                  >
                    Sábado
                  </button>
                </div>

                {/* Mini Calendario Glassmorphic Integrado (Desplegable) */}
                {mostrarMiniCal && (
                  <div className="p-3 bg-white/95 dark:bg-secondary rounded-2xl border border-[#D9CEBC] dark:border-separator shadow-xs space-y-2 animate-fade-in-up">
                    {/* Navegación del Mini Mes */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-black text-[#3A4630] dark:text-label-primary capitalize">
                        {MESES_LABELS[miniCalMes]} {miniCalAnio}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (miniCalMes === 0) {
                              setMiniCalMes(11);
                              setMiniCalAnio(miniCalAnio - 1);
                            } else {
                              setMiniCalMes(miniCalMes - 1);
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-[#F4EFE6] dark:bg-tertiary hover:bg-[#E8E0D2] dark:hover:bg-secondary flex items-center justify-center text-[#3A4630] dark:text-label-primary cursor-pointer"
                        >
                          <ChevronLeft size={14} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (miniCalMes === 11) {
                              setMiniCalMes(0);
                              setMiniCalAnio(miniCalAnio + 1);
                            } else {
                              setMiniCalMes(miniCalMes + 1);
                            }
                          }}
                          className="w-7 h-7 rounded-lg bg-[#F4EFE6] dark:bg-tertiary hover:bg-[#E8E0D2] dark:hover:bg-secondary flex items-center justify-center text-[#3A4630] dark:text-label-primary cursor-pointer"
                        >
                          <ChevronRight size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    </div>

                    {/* Días de la semana */}
                    <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold text-label-secondary uppercase">
                      {DIAS_MINI.map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </div>

                    {/* Cuadrícula de Días */}
                    <div className="grid grid-cols-7 gap-1">
                      {celdasMiniPicker.map((c, idx) => {
                        const isSelected = c.fechaStr === fechaActividad;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFechaActividad(c.fechaStr);
                              setMostrarMiniCal(false);
                            }}
                            className={`h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                              isSelected
                                ? 'bg-[#5F6F52] text-white shadow-2xs font-black'
                                : c.esMesActual
                                ? 'bg-transparent hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-[#3A4630] dark:text-label-primary'
                                : 'text-label-quaternary hover:bg-white/50 dark:hover:bg-tertiary/50'
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

              {/* 3. Temporalidad Híbrida (Con 12h AM/PM y duración inteligente) */}
              <div className="p-4.5 bg-white/75 dark:bg-tertiary/40 rounded-3xl border border-white/90 dark:border-white/10 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary flex items-center gap-1.5">
                    <Clock size={14} className="text-olive" />
                    <span>Horario</span>
                  </span>
                  {!todoElDia && (
                    <span className="text-xs font-bold text-olive">
                      {(hora12 || '12').padStart(2, '0')}:{(minutos || '00').padStart(2, '0')} {periodo} (Duración: 1 hora)
                    </span>
                  )}
                </div>

                {/* Restricción de Cita Médica: no todo el día */}
                {plantilla === TipoPlantilla.CITA_MEDICA ? (
                  <div className="text-[11px] font-bold text-[#0284C7] dark:text-blue-sem bg-[#E0F2FE] dark:bg-blue-sem/20 p-2 rounded-xl border border-[#BAE6FD] dark:border-blue-sem/40 flex items-center gap-1.5">
                    <AlertCircle size={13} />
                    <span>La cita médica requiere obligatoriamente una hora específica.</span>
                  </div>
                ) : (
                  /* Píldoras Rápidas */
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setTodoElDia(true)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                        todoElDia
                          ? 'bg-[#5F6F52] text-white shadow-2xs'
                          : 'bg-white dark:bg-tertiary/60 hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-label-secondary border border-[#E8E0D2] dark:border-separator'
                      }`}
                    >
                      Todo el día
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTodoElDia(false);
                        setHora12('09');
                        setMinutos('00');
                        setPeriodo('AM');
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                        !todoElDia && (parseInt(hora12, 10) === 9 || hora12 === '09') && (parseInt(minutos, 10) === 0) && periodo === 'AM'
                          ? 'bg-[#5F6F52] text-white shadow-2xs'
                          : 'bg-white dark:bg-tertiary/60 hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-label-secondary border border-[#E8E0D2] dark:border-separator'
                      }`}
                    >
                      Mañana (9:00 AM)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTodoElDia(false);
                        setHora12('03');
                        setMinutos('00');
                        setPeriodo('PM');
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                        !todoElDia && (parseInt(hora12, 10) === 3 || hora12 === '03') && (parseInt(minutos, 10) === 0) && periodo === 'PM'
                          ? 'bg-[#5F6F52] text-white shadow-2xs'
                          : 'bg-white dark:bg-tertiary/60 hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-label-secondary border border-[#E8E0D2] dark:border-separator'
                      }`}
                    >
                      Tarde (3:00 PM)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTodoElDia(false);
                        setHora12('07');
                        setMinutos('00');
                        setPeriodo('PM');
                      }}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 ${
                        !todoElDia && (parseInt(hora12, 10) === 7 || hora12 === '07') && (parseInt(minutos, 10) === 0) && periodo === 'PM'
                          ? 'bg-[#5F6F52] text-white shadow-2xs'
                          : 'bg-white dark:bg-tertiary/60 hover:bg-[#EEF2EA] dark:hover:bg-tertiary text-label-secondary border border-[#E8E0D2] dark:border-separator'
                      }`}
                    >
                      Noche (7:00 PM)
                    </button>
                  </div>
                )}

                {/* Selector Glassmorphic de Hora Exacta (Sin controles nativos del navegador) */}
                {!todoElDia && (
                  <div className="pt-3 border-t border-[#F0EAE1] dark:border-separator space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white/80 dark:bg-secondary backdrop-blur-xs p-3 rounded-2xl border border-[#E8E0D2] dark:border-separator shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#5F6F52]/10 dark:bg-olive/20 text-olive flex items-center justify-center">
                          <Clock size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-[#3A4630] dark:text-label-primary leading-none">Hora exacta</p>
                          <p className="text-[11px] text-label-secondary mt-0.5">Escribe o ajusta en tramos de 15m</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Entrada manual de Horas y Minutos */}
                        <div className="flex items-center bg-[#F4EFE6] dark:bg-tertiary px-2.5 py-1 rounded-xl border border-[#D9CEBC] dark:border-separator">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={2}
                            value={hora12}
                            onFocus={(e) => e.target.select()}
                            onChange={handleHorasChange}
                            onBlur={handleHorasBlur}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const cur = parseInt(hora12, 10) || 12;
                                const next = cur >= 12 ? 1 : cur + 1;
                                setHora12(next.toString().padStart(2, '0'));
                                setTodoElDia(false);
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                const cur = parseInt(hora12, 10) || 1;
                                const next = cur <= 1 ? 12 : cur - 1;
                                setHora12(next.toString().padStart(2, '0'));
                                setTodoElDia(false);
                              }
                            }}
                            className="w-8 text-center text-sm font-black text-[#3A4630] dark:text-label-primary bg-transparent focus:outline-none focus:bg-white/80 dark:focus:bg-secondary rounded-lg"
                          />
                          <span className="text-sm font-black text-[#3A4630] dark:text-label-primary px-0.5">:</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={2}
                            value={minutos}
                            onFocus={(e) => e.target.select()}
                            onChange={handleMinutosChange}
                            onBlur={handleMinutosBlur}
                            onKeyDown={(e) => {
                              if (e.key === 'ArrowUp') {
                                e.preventDefault();
                                const cur = parseInt(minutos, 10) || 0;
                                const next = cur >= 59 ? 0 : cur + 1;
                                setMinutos(next.toString().padStart(2, '0'));
                                setTodoElDia(false);
                              } else if (e.key === 'ArrowDown') {
                                e.preventDefault();
                                const cur = parseInt(minutos, 10) || 0;
                                const next = cur <= 0 ? 59 : cur - 1;
                                setMinutos(next.toString().padStart(2, '0'));
                                setTodoElDia(false);
                              }
                            }}
                            className="w-8 text-center text-sm font-black text-[#3A4630] dark:text-label-primary bg-transparent focus:outline-none focus:bg-white/80 dark:focus:bg-secondary rounded-lg"
                          />
                        </div>

                        {/* Selector AM / PM Segmentado Apple HIG */}
                        <SegmentedControl<'AM' | 'PM'>
                          options={[
                            { value: 'AM', label: 'AM' },
                            { value: 'PM', label: 'PM' },
                          ]}
                          value={periodo}
                          onChange={handleTogglePeriodo}
                          size="sm"
                          fullWidth={false}
                          ariaLabel="Seleccionar periodo AM o PM"
                        />

                        {/* Steppers +/- 15 minutos */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleAjustarMinutos(-15)}
                            title="Restar 15 minutos"
                            aria-label="Restar 15 minutos"
                            className="w-8 h-8 rounded-xl bg-[#F4EFE6] dark:bg-tertiary hover:bg-[#E8E0D2] dark:hover:bg-secondary active:scale-90 text-[#3A4630] dark:text-label-primary flex items-center justify-center transition cursor-pointer border border-[#D9CEBC]/60 dark:border-separator"
                          >
                            <Minus size={13} strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => handleAjustarMinutos(15)}
                            title="Sumar 15 minutos"
                            aria-label="Sumar 15 minutos"
                            className="w-8 h-8 rounded-xl bg-[#F4EFE6] dark:bg-tertiary hover:bg-[#E8E0D2] dark:hover:bg-secondary active:scale-90 text-[#3A4630] dark:text-label-primary flex items-center justify-center transition cursor-pointer border border-[#D9CEBC]/60 dark:border-separator"
                          >
                            <Plus size={13} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Chips de minutos rápidos */}
                    <div className="flex items-center justify-between gap-2 px-1">
                      <span className="text-[11px] font-bold text-[#736F68] dark:text-label-tertiary">Minutos rápidos:</span>
                      <div className="flex items-center gap-1.5">
                        {[0, 15, 30, 45].map((m) => {
                          const isMinSelected = (parseInt(minutos, 10) || 0) === m;
                          return (
                            <button
                              key={m}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => handleSetMinutosExactos(m)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer active:scale-95 ${
                                isMinSelected
                                  ? 'bg-[#5F6F52] dark:bg-olive text-white shadow-2xs'
                                  : 'bg-white dark:bg-tertiary hover:bg-[#EEF2EA] dark:hover:bg-secondary text-[#736F68] dark:text-label-secondary border border-[#E8E0D2] dark:border-separator'
                              }`}
                            >
                              :{m.toString().padStart(2, '0')}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 4. VARIACIONES ESPECÍFICAS POR PLANTILLA (RF-02) */}
              
              {/* === Plantilla 1: Evento Estándar === */}
              {plantilla === TipoPlantilla.EVENTO && (
                <div className="p-4.5 bg-white/70 dark:bg-secondary/70 rounded-3xl border border-white/90 dark:border-separator space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2">
                      Organizador Principal
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {miembros.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setOrganizadorId(m.id)}
                          className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                            organizadorId === m.id
                              ? 'bg-[#2563EB] dark:bg-blue-600 text-white border-[#2563EB] dark:border-blue-600 shadow-2xs'
                              : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                          }`}
                        >
                          <span className="w-5 h-5 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                            {m.nombre.charAt(0).toUpperCase()}
                          </span>
                          <span>{m.nombre}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#736F68] dark:text-label-secondary mb-1">
                      Correo de contacto (opcional)
                    </label>
                    <input
                      type="email"
                      value={correoContacto}
                      onChange={(e) => setCorreoContacto(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-xl text-xs text-[#191C16] dark:text-label-primary placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:border-[#3A4630] dark:focus:border-olive"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2">
                      Asistentes del Hogar
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {miembros.map((m) => {
                        const isSelected = asistentesIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleIdEnLista(m.id, asistentesIds, setAsistentesIds)}
                            className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                              isSelected
                                ? 'bg-[#3A4630] dark:bg-olive text-white border-[#3A4630] dark:border-olive'
                                : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                            }`}
                          >
                            {isSelected ? <Check size={12} strokeWidth={3} /> : <Plus size={12} />}
                            <span>{m.nombre}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* === Plantilla 2: Cumpleaños === */}
              {plantilla === TipoPlantilla.CUMPLEANOS && (
                <div className="p-4.5 bg-white/70 dark:bg-secondary/70 rounded-3xl border border-white/90 dark:border-separator space-y-4">
                  {/* Recurrencia anual Apple HIG */}
                  <div className="flex items-center justify-between p-3.5 bg-white dark:bg-tertiary rounded-2xl border border-[#E8E0D2] dark:border-separator">
                    <div className="flex items-center gap-2.5 text-xs font-black text-[#3A4630] dark:text-label-primary">
                      <Repeat size={15} strokeWidth={2.2} className="text-[#7C3AED] dark:text-purple-400" />
                      <span>Repetir cada año automáticamente</span>
                    </div>
                    <AppleSwitch
                      checked={recurrenciaAnual}
                      onChange={setRecurrenciaAnual}
                      accentColor="purple"
                      ariaLabel="Repetir cada año automáticamente"
                    />
                  </div>

                  {/* Tipo de Agasajado Segmentado Apple HIG */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2">
                      ¿A quién celebramos?
                    </label>
                    <SegmentedControl<'hogar' | 'externo'>
                      options={[
                        { value: 'hogar', label: 'Miembro del Hogar', icon: User },
                        { value: 'externo', label: 'Amigo o Familiar Externo', icon: HeartHandshake },
                      ]}
                      value={agasajadoTipo}
                      onChange={(val) => setAgasajadoTipo(val)}
                      className="mb-3"
                      ariaLabel="Seleccionar tipo de agasajado"
                    />

                    {agasajadoTipo === 'hogar' ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        {miembros.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setAgasajadoHogarId(m.id)}
                            className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition border cursor-pointer ${
                              agasajadoHogarId === m.id
                                ? 'bg-[#7C3AED] dark:bg-purple-600 text-white border-[#7C3AED] dark:border-purple-600'
                                : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                            }`}
                          >
                            {m.nombre}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          required
                          value={agasajadoExternoNombre}
                          onChange={(e) => setAgasajadoExternoNombre(e.target.value)}
                          placeholder="Nombre del agasajado *"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-xl text-xs text-[#191C16] dark:text-label-primary placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:border-[#3A4630] dark:focus:border-olive"
                        />
                        <input
                          type="text"
                          value={agasajadoExternoContacto}
                          onChange={(e) => setAgasajadoExternoContacto(e.target.value)}
                          placeholder="Teléfono o contacto (opcional)"
                          className="w-full px-3.5 py-2.5 bg-white dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-xl text-xs text-[#191C16] dark:text-label-primary placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:border-[#3A4630] dark:focus:border-olive"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* === Plantilla 3: Tarea === */}
              {plantilla === TipoPlantilla.TAREA && (
                <div className="p-4.5 bg-white/70 dark:bg-secondary/70 rounded-3xl border border-white/90 dark:border-separator space-y-4">
                  {/* Responsable Obligatorio */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2">
                      Responsable Obligatorio *
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {miembros.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setResponsableTareaId(m.id)}
                          className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition border cursor-pointer ${
                            responsableTareaId === m.id
                              ? 'bg-[#D97706] dark:bg-amber text-white border-[#D97706] dark:border-amber shadow-2xs'
                              : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                          }`}
                        >
                          {m.nombre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Estado de ejecución */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2">
                      Estado
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: EstadoEvento.ACTIVO, label: 'Pendiente' },
                        { id: EstadoEvento.COMPLETADO, label: 'Realizado' },
                        { id: EstadoEvento.CANCELADO, label: 'Cancelado' },
                      ].map((est) => (
                        <button
                          key={est.id}
                          type="button"
                          onClick={() => setEstadoTarea(est.id)}
                          className={`py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                            estadoTarea === est.id
                              ? 'bg-[#3A4630] dark:bg-olive text-white border-[#3A4630] dark:border-olive'
                              : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                          }`}
                        >
                          {est.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Subtareas To-Do Dinámico */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                      Subtareas (To-Do Dinámico)
                    </label>
                    <div className="flex gap-2 mb-2.5">
                      <input
                        type="text"
                        value={nuevaSubtarea}
                        onChange={(e) => setNuevaSubtarea(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAgregarSubtarea();
                          }
                        }}
                        placeholder="Agregar paso o subtarea..."
                        className="flex-1 px-3.5 py-2 bg-white dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-xl text-xs text-[#191C16] dark:text-label-primary placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:border-[#3A4630] dark:focus:border-olive"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarSubtarea}
                        className="px-3 py-2 bg-[#D97706] dark:bg-amber text-white rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 active:scale-95 transition"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {subtareas.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-tertiary rounded-xl border border-[#E8E0D2] dark:border-separator text-xs"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setSubtareas(
                                subtareas.map((item) =>
                                  item.id === st.id ? { ...item, completado: !item.completado } : item
                                )
                              )
                            }
                            className="flex items-center gap-2 text-left cursor-pointer flex-1"
                          >
                            {st.completado ? (
                              <CheckSquare size={14} className="text-[#D97706] dark:text-amber" />
                            ) : (
                              <Square size={14} className="text-[#A39E95] dark:text-label-quaternary" />
                            )}
                            <span className={st.completado ? 'line-through text-[#A39E95] dark:text-label-quaternary' : 'text-[#3A4630] dark:text-label-primary font-medium'}>
                              {st.descripcion}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSubtareas(subtareas.filter((item) => item.id !== st.id))}
                            className="text-[#A39E95] dark:text-label-tertiary hover:text-[#B84626] dark:hover:text-terracotta p-1 cursor-pointer transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* === Plantilla 4: Cita Médica === */}
              {plantilla === TipoPlantilla.CITA_MEDICA && (
                <div className="p-4.5 bg-white/70 dark:bg-secondary/70 rounded-3xl border border-white/90 dark:border-separator space-y-4">
                  {/* Paciente Obligatorio */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2">
                      Paciente del Hogar *
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {miembros.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setPacienteId(m.id)}
                          className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition border cursor-pointer ${
                            pacienteId === m.id
                              ? 'bg-[#0284C7] dark:bg-sky-600 text-white border-[#0284C7] dark:border-sky-600 shadow-2xs'
                              : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                          }`}
                        >
                          {m.nombre}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Acompañante(s) */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2">
                      Acompañante(s) (Opcional)
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {miembros
                        .filter((m) => m.id !== pacienteId)
                        .map((m) => {
                          const isSelected = acompanantesIds.includes(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggleIdEnLista(m.id, acompanantesIds, setAsistentesIds)}
                              className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition border cursor-pointer ${
                                isSelected
                                  ? 'bg-[#3A4630] dark:bg-olive text-white border-[#3A4630] dark:border-olive'
                                  : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                              }`}
                            >
                              {m.nombre}
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Especialista y Especialidad */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={especialista}
                      onChange={(e) => setEspecialista(e.target.value)}
                      placeholder="Doctor / Especialista (opcional)"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-xl text-xs text-[#191C16] dark:text-label-primary placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:border-[#3A4630] dark:focus:border-olive"
                    />
                    <input
                      type="text"
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      placeholder="Especialidad (opcional)"
                      className="w-full px-3.5 py-2.5 bg-white dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-xl text-xs text-[#191C16] dark:text-label-primary placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:border-[#3A4630] dark:focus:border-olive"
                    />
                  </div>
                </div>
              )}

              {/* === Plantilla 5: Mercado === */}
              {plantilla === TipoPlantilla.MERCADO && (
                <div className="p-4.5 bg-white/70 dark:bg-secondary/70 rounded-3xl border border-white/90 dark:border-separator space-y-4">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2">
                      Encargados de las Compras
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {miembros.map((m) => {
                        const isSelected = encargadosMercadoIds.includes(m.id);
                        return (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleIdEnLista(m.id, encargadosMercadoIds, setEncargadosMercadoIds)}
                            className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition border cursor-pointer ${
                              isSelected
                                ? 'bg-[#059669] dark:bg-emerald-600 text-white border-[#059669] dark:border-emerald-600'
                                : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                            }`}
                          >
                            {m.nombre}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Lista de Compras Dinámica */}
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                      Lista de Compras (Artículos)
                    </label>
                    <div className="flex gap-2 mb-2.5">
                      <input
                        type="text"
                        value={nuevoItemMercado}
                        onChange={(e) => setNuevoItemMercado(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAgregarItemMercado();
                          }
                        }}
                        placeholder="Ej. Leche, Frutas, Jabón..."
                        className="flex-1 px-3.5 py-2 bg-white dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-xl text-xs text-[#191C16] dark:text-label-primary placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:border-[#3A4630] dark:focus:border-olive"
                      />
                      <button
                        type="button"
                        onClick={handleAgregarItemMercado}
                        className="px-3 py-2 bg-[#059669] dark:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:opacity-90 active:scale-95 transition"
                      >
                        <Plus size={14} strokeWidth={2.5} />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {itemsMercado.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 bg-white dark:bg-tertiary rounded-xl border border-[#E8E0D2] dark:border-separator text-xs"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setItemsMercado(
                                itemsMercado.map((it) =>
                                  it.id === item.id ? { ...it, completado: !it.completado } : it
                                )
                              )
                            }
                            className="flex items-center gap-2 text-left cursor-pointer flex-1"
                          >
                            {item.completado ? (
                              <CheckSquare size={14} className="text-[#059669] dark:text-emerald-500" />
                            ) : (
                              <Square size={14} className="text-[#A39E95] dark:text-label-quaternary" />
                            )}
                            <span className={item.completado ? 'line-through text-[#A39E95] dark:text-label-quaternary' : 'text-[#3A4630] dark:text-label-primary font-medium'}>
                              {item.descripcion}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemsMercado(itemsMercado.filter((it) => it.id !== item.id))}
                            className="text-[#A39E95] dark:text-label-tertiary hover:text-[#B84626] dark:hover:text-terracotta p-1 cursor-pointer transition"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 5. ATRIBUTOS COMUNES A TODAS LAS PLANTILLAS */}
              
              {/* Ubicación */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                  Ubicación {plantilla === TipoPlantilla.CITA_MEDICA && <span className="text-[#B84626] dark:text-terracotta">*</span>}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736F68] dark:text-label-tertiary">
                    <MapPin size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="text"
                    required={plantilla === TipoPlantilla.CITA_MEDICA}
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder={
                      plantilla === TipoPlantilla.CITA_MEDICA
                        ? 'Consultorio, clínica o centro de salud *'
                        : 'Lugar físico o digital (opcional)'
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-white/80 dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-2xl text-xs text-[#191C16] dark:text-label-primary placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-[#3A4630] dark:focus:border-olive"
                  />
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                  Detalles o Notas Adicionales
                </label>
                <textarea
                  rows={2}
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Detalles adicionales, recordatorios o enlaces..."
                  className="w-full px-3.5 py-2.5 bg-white/80 dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-2xl text-xs text-[#191C16] dark:text-label-primary placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-[#3A4630] dark:focus:border-olive"
                />
              </div>

              {/* Recordatorios y Alarmas */}
              <div className="p-4 bg-white/70 dark:bg-secondary/70 rounded-3xl border border-white/90 dark:border-separator space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell size={15} strokeWidth={2.2} className="text-[#5F6F52] dark:text-olive" />
                    <span className="text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary">
                      Recordatorios y Alarmas
                    </span>
                  </div>
                  <AppleSwitch
                    checked={activarAlarma}
                    onChange={setActivarAlarma}
                    accentColor="olive"
                    ariaLabel="Activar recordatorios y alarmas"
                  />
                </div>

                {activarAlarma && (
                  <div className="pt-2 space-y-3 border-t border-[#F0EAE1] dark:border-separator">
                    {/* Canales */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCanalPush(!canalPush)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          canalPush
                            ? 'bg-[#5F6F52] dark:bg-olive text-white border-[#5F6F52] dark:border-olive shadow-2xs'
                            : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                        }`}
                      >
                        <Smartphone size={13} />
                        <span>Alerta Móvil (Push)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCanalEmail(!canalEmail)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          canalEmail
                            ? 'bg-[#5F6F52] dark:bg-olive text-white border-[#5F6F52] dark:border-olive shadow-2xs'
                            : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                        }`}
                      >
                        <Mail size={13} />
                        <span>Correo</span>
                      </button>
                    </div>

                    {/* Tiempo de Anticipación */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { min: 15, label: '15 min' },
                        { min: 60, label: '1 hora' },
                        { min: 120, label: '2 horas' },
                        { min: 1440, label: '1 día' },
                      ].map((t) => (
                        <button
                          key={t.min}
                          type="button"
                          onClick={() => setMinutosAnticipacion(t.min)}
                          className={`py-1.5 text-[11px] font-bold rounded-xl border transition cursor-pointer ${
                            minutosAnticipacion === t.min
                              ? 'bg-[#3A4630] dark:bg-olive text-white border-[#3A4630] dark:border-olive shadow-2xs'
                              : 'bg-white dark:bg-tertiary text-[#736F68] dark:text-label-secondary border-[#E8E0D2] dark:border-separator'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Selector de Color Identificador */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-2">
                  Código de Color Identificador
                </label>
                <div className="flex items-center gap-3">
                  {PALETA_COLORES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer border-2 ${
                        color === c ? 'scale-125 border-white dark:border-white shadow-md' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Botón de Envío */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={procesando}
                  className="w-full py-4 bg-gradient-to-r from-[#5F6F52] to-[#4E5D42] dark:from-olive dark:to-[#4E5D42] hover:from-[#4E5D42] hover:to-[#3A4630] dark:hover:from-[#4E5D42] dark:hover:to-olive text-white font-black text-xs uppercase tracking-wider rounded-2xl transition shadow-lg shadow-[#5F6F52]/25 dark:shadow-none disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                >
                  <Check size={16} strokeWidth={2.5} />
                  <span>
                    {procesando
                      ? 'Guardando en agenda...'
                      : eventoAEditar
                      ? 'Guardar Modificaciones'
                      : 'Programar Actividad'}
                  </span>
                </button>
              </div>

            </form>
          )}

        </div>

      </div>

      {/* Modal de Confirmación: Eliminación Definitiva (Baja Física - RF-03) */}
      <ConfirmModal
        isOpen={!!idEventoAEliminar}
        title="¿Eliminar definitivamente?"
        description="¿Deseas eliminar permanentemente esta actividad de la agenda del hogar? Esta acción borrará en cascada todas sus subtareas y recordatorios, y no se puede deshacer."
        confirmText="Eliminar definitivamente"
        cancelText="Conservar"
        variant="danger"
        onConfirm={confirmarEliminarEvento}
        onClose={() => setIdEventoAEliminar(null)}
      />

      {/* Modal de Confirmación: Cancelación de Actividad (Baja Lógica - RF-03) */}
      <ConfirmModal
        isOpen={!!idEventoACancelar}
        title="¿Cancelar actividad?"
        description={`¿Deseas cancelar "${idEventoACancelar?.titulo}"? La actividad permanecerá archivada en el historial del hogar con estilo atenuado y sus alertas programadas se desactivarán.`}
        confirmText="Cancelar actividad"
        cancelText="Volver"
        variant="warning"
        onConfirm={confirmarCancelarEvento}
        onClose={() => setIdEventoACancelar(null)}
      />

      {/* Diálogo de Confirmación: Recurrencia Anual (RF-03) */}
      {mostrarDialogoRecurrencia && (
        <div className="fixed inset-0 z-[10000] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="relative glass-modal w-full max-w-md rounded-[2.5rem] p-6 sm:p-7 shadow-2xl border border-white/85 dark:border-separator bg-[#FDFBF7]/95 dark:bg-secondary/95 space-y-5 text-center my-auto animate-fade-in-up">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs bg-[#7C3AED]/15 dark:bg-purple-900/30 text-[#7C3AED] dark:text-purple-400 border border-[#7C3AED]/30 dark:border-purple-500/30">
              <Repeat size={26} strokeWidth={2.3} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black text-[#2E2B27] dark:text-label-primary tracking-tight">Actividad con Recurrencia</h3>
              <p className="text-xs text-[#736F68] dark:text-label-secondary font-medium leading-relaxed px-1">
                Esta actividad cuenta con repetición programada. ¿Cómo deseas aplicar las modificaciones realizadas?
              </p>
            </div>
            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => payloadPendienteRecurrencia && ejecutarActualizacion(payloadPendienteRecurrencia, 'SOLO_ESTE')}
                disabled={procesando}
                className="w-full py-3.5 px-4 rounded-2xl border border-[#7C3AED]/40 dark:border-purple-500/40 bg-white dark:bg-tertiary hover:bg-[#F3E8FF] dark:hover:bg-purple-950/30 text-[#6B21A8] dark:text-purple-300 font-bold text-xs transition cursor-pointer active:scale-95 shadow-2xs"
              >
                Modificar solo este evento
              </button>
              <button
                type="button"
                onClick={() => payloadPendienteRecurrencia && ejecutarActualizacion(payloadPendienteRecurrencia, 'ESTE_Y_FUTUROS')}
                disabled={procesando}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#7C3AED] dark:bg-purple-600 hover:bg-[#6D28D9] dark:hover:bg-purple-700 text-white font-bold text-xs transition cursor-pointer active:scale-95 shadow-md"
              >
                Modificar este y los eventos futuros
              </button>
              <button
                type="button"
                onClick={() => setMostrarDialogoRecurrencia(false)}
                disabled={procesando}
                className="w-full py-2.5 px-4 rounded-2xl text-[#736F68] dark:text-label-secondary hover:text-[#2E2B27] dark:hover:text-label-primary font-medium text-xs transition cursor-pointer"
              >
                Volver al formulario
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
