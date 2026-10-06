'use client';

import { useState, useEffect } from 'react';
import { TipoPlantilla, CanalRecordatorio, EstadoEvento } from '@prisma/client';
import { EventoUnificado } from '@/actions/eventos';
import {
  crearEvento,
  actualizarEvento,
  EventoData,
  OpcionRecurrenciaEdicion,
} from '@/actions/calendario';
import { PLANTILLAS_CONFIG, SubtareaItem } from '../types';

interface UseEventoFormProps {
  miembros: { id: string; nombre: string; email?: string }[];
  usuarioActualId?: string;
  selectedDate: Date | null;
  onSuccess: (mensaje: string) => void;
  onClose: () => void;
}

export function useEventoForm({
  miembros,
  usuarioActualId,
  selectedDate,
  onSuccess,
  onClose,
}: UseEventoFormProps) {
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Plantilla activa
  const [plantilla, setPlantilla] = useState<TipoPlantilla>(TipoPlantilla.EVENTO);

  // 2. Atributos Comunes
  const [titulo, setTitulo] = useState('');
  const [tituloEditadoManualmente, setTituloEditadoManualmente] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [color, setColor] = useState(PLANTILLAS_CONFIG[0].color);

  // Estado de edición y recurrencia
  const [eventoAEditar, setEventoAEditar] = useState<EventoUnificado | null>(null);
  const [opcionRecurrenciaEdicion, setOpcionRecurrenciaEdicion] = useState<OpcionRecurrenciaEdicion>('SOLO_ESTE');

  // Fecha puntual seleccionada
  const [fechaActividad, setFechaActividad] = useState<string>('');

  // Temporalidad Híbrida (12h AM/PM)
  const [todoElDia, setTodoElDia] = useState(false);
  const [hora12, setHora12] = useState('09');
  const [minutos, setMinutos] = useState('00');
  const [periodo, setPeriodo] = useState<'AM' | 'PM'>('AM');

  function safeSetTodoElDia(val: boolean) {
    if (plantilla === TipoPlantilla.CITA_MEDICA) {
      setTodoElDia(false);
      return;
    }
    setTodoElDia(val);
  }

  function safeSetUbicacion(val: string) {
    setUbicacion(val);
    if (errorMsg && errorMsg.toLowerCase().includes('ubicación')) {
      setErrorMsg(null);
    }
  }

  // Recordatorios y Alarmas Comunes
  const [activarAlarma, setActivarAlarma] = useState(false);
  const [canalPush, setCanalPush] = useState(true);
  const [canalEmail, setCanalEmail] = useState(false);
  const [minutosAnticipacion, setMinutosAnticipacion] = useState(60);

  // 3. Campos Específicos por Plantilla
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

  // Lógica reactiva para Título de Cumpleaños (AUD-03)
  function generarTituloCumpleanos(
    tipo: 'hogar' | 'externo',
    hogarId: string,
    extNombre: string
  ): string {
    if (tipo === 'hogar') {
      const miembro = miembros.find((m) => m.id === hogarId);
      return miembro?.nombre ? `Cumpleaños de ${miembro.nombre}` : 'Cumpleaños';
    } else {
      const nombreLimpio = extNombre.trim();
      return nombreLimpio ? `Cumpleaños de ${nombreLimpio}` : 'Cumpleaños';
    }
  }

  function regenerarTituloCumpleanos() {
    const nuevoTitulo = generarTituloCumpleanos(agasajadoTipo, agasajadoHogarId, agasajadoExternoNombre);
    setTitulo(nuevoTitulo);
    setTituloEditadoManualmente(false);
  }

  function handleSetTitulo(val: string) {
    setTitulo(val);
    if (plantilla === TipoPlantilla.CUMPLEANOS) {
      const tituloEsperado = generarTituloCumpleanos(agasajadoTipo, agasajadoHogarId, agasajadoExternoNombre);
      if (val.trim() === '' || val === tituloEsperado) {
        setTituloEditadoManualmente(false);
      } else {
        setTituloEditadoManualmente(true);
      }
    }
  }

  function setAgasajadoTipoReactivo(nuevoTipo: 'hogar' | 'externo') {
    setAgasajadoTipo(nuevoTipo);
    if (!tituloEditadoManualmente) {
      setTitulo(generarTituloCumpleanos(nuevoTipo, agasajadoHogarId, agasajadoExternoNombre));
    }
  }

  function setAgasajadoHogarIdReactivo(nuevoId: string) {
    setAgasajadoHogarId(nuevoId);
    if (!tituloEditadoManualmente && agasajadoTipo === 'hogar') {
      setTitulo(generarTituloCumpleanos('hogar', nuevoId, agasajadoExternoNombre));
    }
  }

  function setAgasajadoExternoNombreReactivo(nuevoNombre: string) {
    setAgasajadoExternoNombre(nuevoNombre);
    if (!tituloEditadoManualmente && agasajadoTipo === 'externo') {
      setTitulo(generarTituloCumpleanos('externo', agasajadoHogarId, nuevoNombre));
    }
  }

  // Plantilla 3: Tarea
  const [responsableTareaId, setResponsableTareaId] = useState(usuarioActualId || miembros[0]?.id || '');
  const [participantesTareaIds, setParticipantesTareaIds] = useState<string[]>([]);
  const [estadoTarea, setEstadoTarea] = useState<EstadoEvento>(EstadoEvento.ACTIVO);
  const [subtareas, setSubtareas] = useState<SubtareaItem[]>([]);

  // Plantilla 4: Cita Médica
  const [pacienteId, setPacienteId] = useState(usuarioActualId || miembros[0]?.id || '');
  const [acompanantesIds, setAcompanantesIds] = useState<string[]>([]);
  const [especialista, setEspecialista] = useState('');
  const [especialidad, setEspecialidad] = useState('');

  // Plantilla 5: Mercado
  const [encargadosMercadoIds, setEncargadosMercadoIds] = useState<string[]>(
    usuarioActualId ? [usuarioActualId] : miembros[0]?.id ? [miembros[0].id] : []
  );
  const [itemsMercado, setItemsMercado] = useState<SubtareaItem[]>([]);

  function aFechaString(d: Date) {
    const anio = d.getFullYear();
    const mes = (d.getMonth() + 1).toString().padStart(2, '0');
    const dia = d.getDate().toString().padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  // Sincronizar fecha al cambiar selectedDate
  useEffect(() => {
    if (selectedDate) {
      setFechaActividad(aFechaString(selectedDate));
    } else {
      setFechaActividad(aFechaString(new Date()));
    }
  }, [selectedDate]);

  // Sincronizar usuario activo cuando esté disponible
  useEffect(() => {
    if (usuarioActualId) {
      if (!organizadorId) setOrganizadorId(usuarioActualId);
      if (!responsableTareaId) setResponsableTareaId(usuarioActualId);
      if (!pacienteId) setPacienteId(usuarioActualId);
    }
  }, [usuarioActualId]);

  // Persistencia de borrador en sessionStorage (AUD-04)
  useEffect(() => {
    if (typeof window === 'undefined' || eventoAEditar) return;
    try {
      const draftMercado = sessionStorage.getItem('bighouse_borrador_mercado');
      if (draftMercado) {
        const parsed = JSON.parse(draftMercado);
        if (Array.isArray(parsed) && parsed.length > 0 && itemsMercado.length === 0) {
          setItemsMercado(parsed);
        }
      }
      const draftSubtareas = sessionStorage.getItem('bighouse_borrador_subtareas');
      if (draftSubtareas) {
        const parsed = JSON.parse(draftSubtareas);
        if (Array.isArray(parsed) && parsed.length > 0 && subtareas.length === 0) {
          setSubtareas(parsed);
        }
      }
    } catch {
      // Ignorar errores de lectura de storage
    }
  }, [eventoAEditar]);

  useEffect(() => {
    if (typeof window === 'undefined' || eventoAEditar) return;
    try {
      if (itemsMercado.length > 0) {
        sessionStorage.setItem('bighouse_borrador_mercado', JSON.stringify(itemsMercado));
      } else {
        sessionStorage.removeItem('bighouse_borrador_mercado');
      }
    } catch {}
  }, [itemsMercado, eventoAEditar]);

  useEffect(() => {
    if (typeof window === 'undefined' || eventoAEditar) return;
    try {
      if (subtareas.length > 0) {
        sessionStorage.setItem('bighouse_borrador_subtareas', JSON.stringify(subtareas));
      } else {
        sessionStorage.removeItem('bighouse_borrador_subtareas');
      }
    } catch {}
  }, [subtareas, eventoAEditar]);

  function limpiarBorradoresStorage() {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem('bighouse_borrador_mercado');
      sessionStorage.removeItem('bighouse_borrador_subtareas');
    } catch {}
  }

  // Cambiar de plantilla preservando el contenido ingresado (título, fecha, notas) pero adaptando reglas RF-03
  function cambiarPlantilla(nuevaPlantilla: TipoPlantilla) {
    setPlantilla(nuevaPlantilla);
    const config = PLANTILLAS_CONFIG.find((p) => p.tipo === nuevaPlantilla) || PLANTILLAS_CONFIG[0];
    setColor(config.color);
    setErrorMsg(null);

    // Ajustar reglas de negocio específicas según plantilla (RF-02 / RF-03)
    if (nuevaPlantilla === TipoPlantilla.CITA_MEDICA) {
      // Regla: Cita médica siempre requiere hora fija diurna y paciente del hogar
      setTodoElDia(false);
      if (hora12 === '09' && minutos === '00' && periodo === 'AM') {
        setHora12('10');
      }
      if (!pacienteId || pacienteId === miembros[0]?.id) {
        setPacienteId(usuarioActualId || miembros[0]?.id || '');
      }
    } else if (nuevaPlantilla === TipoPlantilla.TAREA) {
      // Regla: Tarea pre-asigna al usuario activo como responsable principal
      if (!responsableTareaId || responsableTareaId === miembros[0]?.id) {
        setResponsableTareaId(usuarioActualId || miembros[0]?.id || '');
      }
    } else if (nuevaPlantilla === TipoPlantilla.CUMPLEANOS) {
      // Regla: Cumpleaños es evento de todo el día con recurrencia anual
      setTodoElDia(true);
      setRecurrenciaAnual(true);
      const targetId = agasajadoHogarId || miembros[0]?.id || '';
      if (!agasajadoHogarId && targetId) {
        setAgasajadoHogarId(targetId);
      }
      if (!tituloEditadoManualmente || !titulo.trim() || titulo.startsWith('Cumpleaños')) {
        setTitulo(generarTituloCumpleanos(agasajadoTipo, targetId, agasajadoExternoNombre));
        setTituloEditadoManualmente(false);
      }
    } else if (nuevaPlantilla === TipoPlantilla.MERCADO) {
      if (encargadosMercadoIds.length === 0) {
        setEncargadosMercadoIds(usuarioActualId ? [usuarioActualId] : miembros[0]?.id ? [miembros[0].id] : []);
      }
    }
  }

  function resetFormulario(nuevaPlantilla: TipoPlantilla) {
    limpiarBorradoresStorage();
    setPlantilla(nuevaPlantilla);
    const config = PLANTILLAS_CONFIG.find((p) => p.tipo === nuevaPlantilla) || PLANTILLAS_CONFIG[0];
    setColor(config.color);
    setDescripcion('');
    setUbicacion('');
    setErrorMsg(null);
    setEventoAEditar(null);

    if (nuevaPlantilla === TipoPlantilla.CUMPLEANOS) {
      setTodoElDia(true);
      setHora12('09');
      setMinutos('00');
      setPeriodo('AM');
      const primerMiembro = miembros[0];
      setTitulo(primerMiembro ? `Cumpleaños de ${primerMiembro.nombre}` : 'Cumpleaños');
      setTituloEditadoManualmente(false);
    } else if (nuevaPlantilla === TipoPlantilla.CITA_MEDICA) {
      setTitulo('');
      setTituloEditadoManualmente(false);
      setTodoElDia(false);
      setHora12('10');
      setMinutos('00');
      setPeriodo('AM');
    } else {
      setTitulo('');
      setTituloEditadoManualmente(false);
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

    setPacienteId(usuarioActualId || miembros[0]?.id || '');
    setAcompanantesIds([]);
    setEspecialista('');
    setEspecialidad('');

    setEncargadosMercadoIds(usuarioActualId ? [usuarioActualId] : miembros[0]?.id ? [miembros[0].id] : []);
    setItemsMercado([]);
  }

  function getHora24(h12Str: string, minStr: string, per: 'AM' | 'PM'): string {
    let h = parseInt(h12Str, 10);
    if (isNaN(h) || h < 1 || h > 12) h = 12;
    let m = parseInt(minStr, 10);
    if (isNaN(m) || m < 0 || m > 59) m = 0;
    let h24 = h % 12;
    if (per === 'PM') h24 += 12;
    return `${h24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  function toggleIdEnLista(id: string, lista: string[], setLista: (val: string[]) => void) {
    if (lista.includes(id)) {
      setLista(lista.filter((item) => item !== id));
    } else {
      setLista([...lista, id]);
    }
  }

  function cargarEventoParaEdicion(ev: EventoUnificado) {
    setEventoAEditar(ev);
    setOpcionRecurrenciaEdicion('SOLO_ESTE');
    setPlantilla(ev.tipo_plantilla as TipoPlantilla);
    setTitulo(ev.titulo);
    setTituloEditadoManualmente(true);
    setDescripcion(ev.descripcion || '');
    setUbicacion(ev.ubicacion || '');
    setColor(ev.color);
    setTodoElDia(ev.tipo_plantilla === TipoPlantilla.CITA_MEDICA ? false : ev.todo_el_dia);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!titulo.trim()) {
      setErrorMsg('El título es obligatorio.');
      return;
    }

    let efectivoTodoElDia = todoElDia;
    let efectivoPacienteId = pacienteId;
    let efectivoResponsableTareaId = responsableTareaId;

    if (plantilla === TipoPlantilla.CITA_MEDICA) {
      if (efectivoTodoElDia) {
        efectivoTodoElDia = false;
        setTodoElDia(false);
      }
      if (!ubicacion.trim()) {
        setErrorMsg('La ubicación (consultorio o clínica) es obligatoria para una cita médica.');
        return;
      }
      if (!efectivoPacienteId) {
        efectivoPacienteId = usuarioActualId || miembros[0]?.id || '';
        setPacienteId(efectivoPacienteId);
        if (!efectivoPacienteId) {
          setErrorMsg('Debe seleccionar obligatoriamente un paciente del hogar.');
          return;
        }
      }
    }

    if (plantilla === TipoPlantilla.TAREA && !efectivoResponsableTareaId) {
      efectivoResponsableTareaId = usuarioActualId || miembros[0]?.id || '';
      setResponsableTareaId(efectivoResponsableTareaId);
      if (!efectivoResponsableTareaId) {
        setErrorMsg('Debe asignar un responsable para la tarea.');
        return;
      }
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

    const [y, mesNum, diaNum] = (fechaActividad || aFechaString(new Date())).split('-').map(Number);
    const dInicio = new Date(y, (mesNum || 1) - 1, diaNum || 1);
    let dFin = new Date(y, (mesNum || 1) - 1, diaNum || 1);

    if (efectivoTodoElDia) {
      dInicio.setHours(0, 0, 0, 0);
      dFin.setHours(23, 59, 59, 999);
    } else {
      const [h, m] = getHora24(hora12, minutos, periodo).split(':').map(Number);
      dInicio.setHours(h ?? 10, m ?? 0, 0, 0);
      dFin = new Date(dInicio.getTime() + 60 * 60 * 1000);
    }

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
      participantesFinales = Array.from(new Set([efectivoResponsableTareaId, ...participantesTareaIds]));
      detalles.responsable_id = efectivoResponsableTareaId;
    } else if (plantilla === TipoPlantilla.CITA_MEDICA) {
      participantesFinales = Array.from(new Set([efectivoPacienteId, ...acompanantesIds]));
      detalles.paciente_id = efectivoPacienteId;
      detalles.acompanantes_ids = acompanantesIds;
      if (especialista.trim()) detalles.especialista = especialista.trim();
      if (especialidad.trim()) detalles.especialidad = especialidad.trim();
    } else if (plantilla === TipoPlantilla.MERCADO) {
      participantesFinales = [...encargadosMercadoIds];
    }

    const recordatoriosList: { tipo_canal: CanalRecordatorio; minutos_anticipacion: number }[] = [];
    if (activarAlarma) {
      if (canalPush) recordatoriosList.push({ tipo_canal: CanalRecordatorio.PUSH, minutos_anticipacion: minutosAnticipacion });
      if (canalEmail) recordatoriosList.push({ tipo_canal: CanalRecordatorio.EMAIL, minutos_anticipacion: minutosAnticipacion });
    }

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
      todo_el_dia: efectivoTodoElDia,
      color,
      ubicacion: ubicacion.trim() || undefined,
      recurrencia: plantilla === TipoPlantilla.CUMPLEANOS && recurrenciaAnual ? 'ANUAL' : undefined,
      detalles,
      // creador_id se omite: el servidor lo resuelve desde la sesión firmada
      participantes_ids: participantesFinales,
      subtareas: subtareasList,
      recordatorios: recordatoriosList,
    };

    if (eventoAEditar) {
      const opcionFinal: OpcionRecurrenciaEdicion = eventoAEditar.recurrencia
        ? opcionRecurrenciaEdicion
        : 'SIN_RECURRENCIA';
      await ejecutarActualizacion(eventoPayload, opcionFinal);
      return;
    }

    const res = await crearEvento(eventoPayload);
    setProcesando(false);

    if (res.success) {
      limpiarBorradoresStorage();
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
    if (res.success) {
      limpiarBorradoresStorage();
      onSuccess('¡Actividad modificada con éxito!');
      setEventoAEditar(null);
      onClose();
    } else {
      setErrorMsg(res.error || 'No se pudo actualizar la actividad');
    }
  }

  return {
    procesando,
    errorMsg,
    setErrorMsg,
    plantilla,
    setPlantilla,
    titulo,
    setTitulo: handleSetTitulo,
    tituloEditadoManualmente,
    regenerarTituloCumpleanos,
    descripcion,
    setDescripcion,
    ubicacion,
    setUbicacion: safeSetUbicacion,
    color,
    setColor,
    fechaActividad,
    setFechaActividad,
    todoElDia,
    setTodoElDia: safeSetTodoElDia,
    hora12,
    setHora12,
    minutos,
    setMinutos,
    periodo,
    setPeriodo,
    activarAlarma,
    setActivarAlarma,
    canalPush,
    setCanalPush,
    canalEmail,
    setCanalEmail,
    minutosAnticipacion,
    setMinutosAnticipacion,
    eventoAEditar,
    setEventoAEditar,
    organizadorId,
    setOrganizadorId,
    correoContacto,
    setCorreoContacto,
    asistentesIds,
    toggleAsistente: (id: string) => toggleIdEnLista(id, asistentesIds, setAsistentesIds),
    recurrenciaAnual,
    setRecurrenciaAnual,
    agasajadoTipo,
    setAgasajadoTipo: setAgasajadoTipoReactivo,
    agasajadoHogarId,
    setAgasajadoHogarId: setAgasajadoHogarIdReactivo,
    agasajadoExternoNombre,
    setAgasajadoExternoNombre: setAgasajadoExternoNombreReactivo,
    agasajadoExternoContacto,
    setAgasajadoExternoContacto,
    participantesCumpleIds,
    toggleParticipanteCumple: (id: string) => toggleIdEnLista(id, participantesCumpleIds, setParticipantesCumpleIds),
    responsableTareaId,
    setResponsableTareaId,
    participantesTareaIds,
    toggleParticipanteTarea: (id: string) => toggleIdEnLista(id, participantesTareaIds, setParticipantesTareaIds),
    estadoTarea,
    setEstadoTarea,
    subtareas,
    addSubtarea: (desc: string) => setSubtareas((prev) => [...prev, { id: Math.random().toString(), descripcion: desc, completado: false }]),
    addSubtareasBatch: (descs: string[]) => setSubtareas((prev) => [...prev, ...descs.map((desc) => ({ id: Math.random().toString(), descripcion: desc, completado: false }))]),
    clearSubtareas: () => setSubtareas([]),
    toggleSubtarea: (id: string) => setSubtareas((prev) => prev.map((s) => s.id === id ? { ...s, completado: !s.completado } : s)),
    removeSubtarea: (id: string) => setSubtareas((prev) => prev.filter((s) => s.id !== id)),
    pacienteId,
    setPacienteId,
    especialista,
    setEspecialista,
    especialidad,
    setEspecialidad,
    acompanantesIds,
    toggleAcompanante: (id: string) => toggleIdEnLista(id, acompanantesIds, setAcompanantesIds),
    encargadosMercadoIds,
    toggleEncargadoMercado: (id: string) => toggleIdEnLista(id, encargadosMercadoIds, setEncargadosMercadoIds),
    itemsMercado,
    addItemMercado: (desc: string) => setItemsMercado((prev) => [...prev, { id: Math.random().toString(), descripcion: desc, completado: false }]),
    addItemsMercadoBatch: (descs: string[]) => setItemsMercado((prev) => [...prev, ...descs.map((desc) => ({ id: Math.random().toString(), descripcion: desc, completado: false }))]),
    clearItemsMercado: () => setItemsMercado([]),
    toggleItemMercado: (id: string) => setItemsMercado((prev) => prev.map((i) => i.id === id ? { ...i, completado: !i.completado } : i)),
    removeItemMercado: (id: string) => setItemsMercado((prev) => prev.filter((i) => i.id !== id)),
    cambiarPlantilla,
    resetFormulario,
    cargarEventoParaEdicion,
    handleSubmit,
    ejecutarActualizacion,
    usuarioActualId,
    opcionRecurrenciaEdicion,
    setOpcionRecurrenciaEdicion,
    esEventoRecurrente: !!eventoAEditar?.recurrencia,
  };
}
