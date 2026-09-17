'use client';

import React, { useState, useEffect } from 'react';
import { DrawerResponsivo } from './DrawerResponsivo';
import { crearEvento, EventoData } from '@/actions/calendario';
import { TipoPlantilla, CanalRecordatorio, EstadoEvento } from '@prisma/client';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Bell, 
  Tag, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square,
  FileText,
  User,
  HeartHandshake,
  Stethoscope,
  ShoppingCart,
  ListTodo
} from 'lucide-react';

interface FormularioEventoProps {
  isOpen: boolean;
  onClose: () => void;
  usuarios: { id: string; nombre: string; email?: string }[];
  usuarioActualId: string;
  onEventCreated: () => void;
  fechaPreseleccionada?: Date;
}

const TEMPLATE_CONFIGS: Record<TipoPlantilla, { label: string; color: string; icon: any }> = {
  [TipoPlantilla.EVENTO]: { label: 'Evento Estándar', color: '#AA4B50', icon: Calendar },
  [TipoPlantilla.CUMPLEANOS]: { label: 'Cumpleaños', color: '#A13842', icon: HeartHandshake },
  [TipoPlantilla.TAREA]: { label: 'Tarea', color: '#BD7471', icon: ListTodo },
  [TipoPlantilla.CITA_MEDICA]: { label: 'Cita Médica', color: '#B25D5D', icon: Stethoscope },
  [TipoPlantilla.MERCADO]: { label: 'Mercado', color: '#6EB5A5', icon: ShoppingCart },
  [TipoPlantilla.MANTENIMIENTO]: { label: 'Mantenimiento', color: '#BD7471', icon: ListTodo },
  [TipoPlantilla.VISITAS]: { label: 'Visitas', color: '#CE9B8C', icon: HeartHandshake },
  [TipoPlantilla.COMPRAS]: { label: 'Compras', color: '#6EB5A5', icon: ShoppingCart },
  [TipoPlantilla.MASCOTAS]: { label: 'Mascotas', color: '#AA4B50', icon: HeartHandshake },
};

export function FormularioEvento({ 
  isOpen, 
  onClose, 
  usuarios, 
  usuarioActualId, 
  onEventCreated,
  fechaPreseleccionada 
}: FormularioEventoProps) {
  const [plantilla, setPlantilla] = useState<TipoPlantilla>(TipoPlantilla.EVENTO);
  
  // Base común
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [color, setColor] = useState(TEMPLATE_CONFIGS[TipoPlantilla.EVENTO].color);
  const [todoElDia, setTodoElDia] = useState(false);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  
  // Participantes comunes
  const [participantesSeleccionados, setParticipantesSeleccionados] = useState<string[]>([]);
  
  // Recordatorios
  const [activarRecordatorio, setActivarRecordatorio] = useState(false);
  const [canalPush, setCanalPush] = useState(true);
  const [canalEmail, setCanalEmail] = useState(false);
  const [minutosAnticipacion, setMinutosAnticipacion] = useState(60); // 1 hora por defecto

  // Plantilla: Evento Estándar
  const [organizadorId, setOrganizadorId] = useState(usuarioActualId);
  const [correoContacto, setCorreoContacto] = useState('');

  // Plantilla: Cumpleaños
  const [recurrenciaAnual, setRecurrenciaAnual] = useState(true);
  const [agasajadoTipo, setAgasajadoTipo] = useState<'hogar' | 'externo'>('hogar');
  const [agasajadoId, setAgasajadoId] = useState('');
  const [agasajadoExternoNombre, setAgasajadoExternoNombre] = useState('');
  const [agasajadoExternoContacto, setAgasajadoExternoContacto] = useState('');

  // Plantilla: Tarea
  const [responsableTareaId, setResponsableTareaId] = useState(usuarioActualId);
  const [estadoTarea, setEstadoTarea] = useState<EstadoEvento>(EstadoEvento.ACTIVO);
  const [listaSubtareas, setListaSubtareas] = useState<{ id: string; descripcion: string; completado: boolean }[]>([]);
  const [nuevaSubtarea, setNuevaSubtarea] = useState('');

  // Plantilla: Cita Médica
  const [pacienteId, setPacienteId] = useState('');
  const [acompanantesIds, setAcompanantesIds] = useState<string[]>([]);
  const [nombreEspecialista, setNombreEspecialista] = useState('');
  const [especialidadMedica, setEspecialidadMedica] = useState('');

  // Plantilla: Mercado
  const [encargadosMercadoIds, setEncargadosMercadoIds] = useState<string[]>([usuarioActualId]);
  const [listaCompras, setListaCompras] = useState<{ id: string; descripcion: string; completado: boolean }[]>([]);
  const [nuevoItemCompra, setNuevoItemCompra] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  // Inicializar fechas y estados por defecto al abrir o cambiar plantilla
  useEffect(() => {
    if (isOpen) {
      const baseDate = fechaPreseleccionada || new Date();
      const pad = (n: number) => n.toString().padStart(2, '0');
      const year = baseDate.getFullYear();
      const month = pad(baseDate.getMonth() + 1);
      const day = pad(baseDate.getDate());
      
      const dateStr = `${year}-${month}-${day}`;
      const dateTimeStr = `${dateStr}T10:00`;
      const dateTimeEndStr = `${dateStr}T11:00`;

      setFechaInicio(dateTimeStr);
      setFechaFin(dateTimeEndStr);
      setErrorValidacion(null);
      setOrganizadorId(usuarioActualId);
      setResponsableTareaId(usuarioActualId);
      if (usuarios.length > 0) {
        setAgasajadoId(usuarios[0].id);
        setPacienteId(usuarios[0].id);
      }
    }
  }, [isOpen, fechaPreseleccionada, usuarioActualId, usuarios]);

  // Al cambiar la plantilla, adaptar valores por defecto según RF-02
  const handleCambiarPlantilla = (nueva: TipoPlantilla) => {
    setPlantilla(nueva);
    setColor(TEMPLATE_CONFIGS[nueva].color);
    setErrorValidacion(null);

    if (nueva === TipoPlantilla.CUMPLEANOS) {
      setTodoElDia(true);
      setRecurrenciaAnual(true);
      if (!titulo || titulo.startsWith('Cumpleaños') || titulo === '') {
        setTitulo('Cumpleaños de ');
      }
    } else if (nueva === TipoPlantilla.CITA_MEDICA) {
      setTodoElDia(false);
      if (!titulo || titulo.startsWith('Cita médica') || titulo === '') {
        setTitulo('Cita Médica');
      }
    } else if (nueva === TipoPlantilla.MERCADO) {
      setTodoElDia(false);
      if (!titulo || titulo.startsWith('Mercado') || titulo === '') {
        setTitulo('Compras de Mercado');
      }
    } else if (nueva === TipoPlantilla.TAREA) {
      setTodoElDia(false);
      if (!titulo || titulo.startsWith('Tarea') || titulo === '') {
        setTitulo('Tarea del Hogar');
      }
    } else {
      setTodoElDia(false);
    }
  };

  // Manejo de subtareas en plantilla Tarea
  const agregarSubtarea = () => {
    if (!nuevaSubtarea.trim()) return;
    setListaSubtareas([
      ...listaSubtareas,
      { id: Math.random().toString(), descripcion: nuevaSubtarea.trim(), completado: false }
    ]);
    setNuevaSubtarea('');
  };

  const eliminarSubtarea = (id: string) => {
    setListaSubtareas(listaSubtareas.filter(s => s.id !== id));
  };

  const toggleSubtareaLocal = (id: string) => {
    setListaSubtareas(listaSubtareas.map(s => s.id === id ? { ...s, completado: !s.completado } : s));
  };

  // Manejo de lista de compras en plantilla Mercado
  const agregarItemCompra = () => {
    if (!nuevoItemCompra.trim()) return;
    setListaCompras([
      ...listaCompras,
      { id: Math.random().toString(), descripcion: nuevoItemCompra.trim(), completado: false }
    ]);
    setNuevoItemCompra('');
  };

  const eliminarItemCompra = (id: string) => {
    setListaCompras(listaCompras.filter(s => s.id !== id));
  };

  const toggleItemCompraLocal = (id: string) => {
    setListaCompras(listaCompras.map(s => s.id === id ? { ...s, completado: !s.completado } : s));
  };

  // Toggle de selección múltiple
  const toggleParticipante = (id: string, seleccionados: string[], setSeleccionados: (val: string[]) => void) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(item => item !== id));
    } else {
      setSeleccionados([...seleccionados, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorValidacion(null);
    setLoading(true);

    try {
      if (!titulo.trim()) {
        throw new Error('El título es obligatorio.');
      }

      // Validaciones específicas por plantilla
      if (plantilla === TipoPlantilla.CITA_MEDICA) {
        if (todoElDia) {
          throw new Error('La cita médica requiere obligatoriamente una hora específica de inicio.');
        }
        if (!ubicacion.trim()) {
          throw new Error('La ubicación (consultorio/clínica) es obligatoria para la cita médica.');
        }
        if (!pacienteId) {
          throw new Error('Debe seleccionar el paciente del hogar para la cita médica.');
        }
      }

      if (plantilla === TipoPlantilla.TAREA) {
        if (!responsableTareaId) {
          throw new Error('Debe asignar un responsable para la tarea.');
        }
      }

      if (plantilla === TipoPlantilla.CUMPLEANOS) {
        if (agasajadoTipo === 'externo' && !agasajadoExternoNombre.trim()) {
          throw new Error('Por favor ingrese el nombre del agasajado externo.');
        }
        if (agasajadoTipo === 'hogar' && !agasajadoId) {
          throw new Error('Por favor seleccione al agasajado del hogar.');
        }
      }

      // Preparar recordatorios
      const recordatoriosList: { tipo_canal: CanalRecordatorio; minutos_anticipacion: number }[] = [];
      if (activarRecordatorio) {
        if (canalPush) {
          recordatoriosList.push({ tipo_canal: CanalRecordatorio.PUSH, minutos_anticipacion: Number(minutosAnticipacion) });
        }
        if (canalEmail) {
          recordatoriosList.push({ tipo_canal: CanalRecordatorio.EMAIL, minutos_anticipacion: Number(minutosAnticipacion) });
        }
      }

      // Participantes y subtareas según la plantilla
      let participantesIdsFinal: string[] = [];
      let subtareasFinal: { descripcion: string; completado?: boolean; asignado_id?: string }[] = [];
      let externosFinal: { nombre: string; contacto?: string }[] = [];
      let detallesPayload: any = {};
      let estadoFinal: EstadoEvento = EstadoEvento.ACTIVO;

      if (plantilla === TipoPlantilla.EVENTO) {
        participantesIdsFinal = Array.from(new Set([organizadorId, ...participantesSeleccionados]));
        detallesPayload = { organizador_id: organizadorId, correo_contacto: correoContacto };
      } else if (plantilla === TipoPlantilla.CUMPLEANOS) {
        if (agasajadoTipo === 'hogar') {
          participantesIdsFinal = Array.from(new Set([agasajadoId, ...participantesSeleccionados]));
          detallesPayload = { agasajado_tipo: 'hogar', agasajado_interno_id: agasajadoId };
        } else {
          participantesIdsFinal = participantesSeleccionados;
          detallesPayload = { 
            agasajado_tipo: 'externo', 
            agasajado_externo: agasajadoExternoNombre.trim(),
            contacto_externo: agasajadoExternoContacto.trim() || undefined
          };
          externosFinal.push({
            nombre: agasajadoExternoNombre.trim(),
            contacto: agasajadoExternoContacto.trim() || undefined
          });
        }
      } else if (plantilla === TipoPlantilla.TAREA) {
        participantesIdsFinal = Array.from(new Set([responsableTareaId, ...participantesSeleccionados]));
        subtareasFinal = listaSubtareas.map(s => ({
          descripcion: s.descripcion,
          completado: s.completado,
          asignado_id: responsableTareaId
        }));
        estadoFinal = estadoTarea;
        detallesPayload = { responsable_id: responsableTareaId, estado_tarea: estadoTarea };
      } else if (plantilla === TipoPlantilla.CITA_MEDICA) {
        participantesIdsFinal = Array.from(new Set([pacienteId, ...acompanantesIds]));
        detallesPayload = {
          paciente_id: pacienteId,
          acompanantes_ids: acompanantesIds,
          especialista: nombreEspecialista.trim() || undefined,
          especialidad: especialidadMedica.trim() || undefined
        };
      } else if (plantilla === TipoPlantilla.MERCADO) {
        participantesIdsFinal = encargadosMercadoIds;
        subtareasFinal = listaCompras.map(s => ({
          descripcion: s.descripcion,
          completado: s.completado
        }));
        detallesPayload = { encargados_ids: encargadosMercadoIds };
      }

      // Normalizar fechas
      const fInicio = new Date(fechaInicio);
      const fFin = fechaFin ? new Date(fechaFin) : new Date(fechaInicio);

      const payload: EventoData = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        tipo_plantilla: plantilla,
        estado: estadoFinal,
        fecha_inicio: fInicio,
        fecha_fin: fFin,
        todo_el_dia: todoElDia,
        color,
        ubicacion: ubicacion.trim() || undefined,
        recurrencia: (plantilla === TipoPlantilla.CUMPLEANOS && recurrenciaAnual) ? 'ANUAL' : undefined,
        detalles: Object.keys(detallesPayload).length > 0 ? detallesPayload : undefined,
        creador_id: usuarioActualId,
        participantes_ids: participantesIdsFinal,
        externos: externosFinal,
        subtareas: subtareasFinal,
        recordatorios: recordatoriosList,
      };

      const res = await crearEvento(payload);
      if (!res.success) {
        throw new Error(res.error || 'Error al guardar el evento.');
      }

      onEventCreated();
      onClose();
    } catch (err: any) {
      setErrorValidacion(err.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DrawerResponsivo isOpen={isOpen} onClose={onClose} title="Programar Actividad">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-6">
        
        {/* Selector de Plantilla */}
        <div>
          <label className="block apple-footnote font-medium text-label-secondary mb-2">
            Plantilla rápida
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(Object.keys(TEMPLATE_CONFIGS) as TipoPlantilla[]).map((tKey) => {
              const conf = TEMPLATE_CONFIGS[tKey];
              const IconComp = conf.icon;
              const activo = plantilla === tKey;
              return (
                <button
                  key={tKey}
                  type="button"
                  onClick={() => handleCambiarPlantilla(tKey)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border apple-footnote font-medium transition-all ${
                    activo 
                      ? 'border-terracotta bg-mint/15 text-label-primary shadow-sm font-semibold' 
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <IconComp size={15} className={activo ? 'text-terracotta' : 'text-gray-400'} />
                  <span className="truncate">{conf.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {errorValidacion && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl apple-footnote text-red-700 font-medium">
            {errorValidacion}
          </div>
        )}

        {/* Título Principal */}
        <div>
          <label className="block apple-footnote font-medium text-label-secondary mb-1">
            Título de la actividad *
          </label>
          <input
            type="text"
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej. Título de la actividad"
            className="w-full apple-body border border-gray-300 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta outline-none transition"
          />
        </div>

        {/* ----------------- CAMPOS ESPECÍFICOS POR PLANTILLA ----------------- */}

        {/* 1. PLANTILLA: CUMPLEANOS */}
        {plantilla === TipoPlantilla.CUMPLEANOS && (
          <div className="bg-secondary border border-separator p-3.5 rounded-xl flex flex-col gap-3">
            <span className="apple-subhead font-semibold text-label-primary flex items-center gap-1.5">
              <HeartHandshake size={14} className="text-terracotta" />
              Información del agasajado
            </span>

            <div className="flex gap-4 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
                <input 
                  type="radio" 
                  name="agasajadoTipo" 
                  checked={agasajadoTipo === 'hogar'} 
                  onChange={() => setAgasajadoTipo('hogar')}
                  className="text-terracotta focus:ring-terracotta"
                />
                Miembro del hogar
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
                <input 
                  type="radio" 
                  name="agasajadoTipo" 
                  checked={agasajadoTipo === 'externo'} 
                  onChange={() => setAgasajadoTipo('externo')}
                  className="text-terracotta focus:ring-terracotta"
                />
                Persona externa
              </label>
            </div>

            {agasajadoTipo === 'hogar' ? (
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Seleccionar Agasajado</label>
                <select
                  value={agasajadoId}
                  onChange={(e) => {
                    setAgasajadoId(e.target.value);
                    const sel = usuarios.find(u => u.id === e.target.value);
                    if (sel) setTitulo(`Cumpleaños de ${sel.nombre}`);
                  }}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                >
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Nombre completo *</label>
                  <input
                    type="text"
                    value={agasajadoExternoNombre}
                    onChange={(e) => {
                      setAgasajadoExternoNombre(e.target.value);
                      if (e.target.value) setTitulo(`Cumpleaños de ${e.target.value}`);
                    }}
                    placeholder="Ej. Tío Carlos"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Contacto (Opcional)</label>
                  <input
                    type="text"
                    value={agasajadoExternoContacto}
                    onChange={(e) => setAgasajadoExternoContacto(e.target.value)}
                    placeholder="Teléfono o correo"
                    className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="recAnual"
                checked={recurrenciaAnual}
                onChange={(e) => setRecurrenciaAnual(e.target.checked)}
                className="rounded text-terracotta focus:ring-terracotta"
              />
              <label htmlFor="recAnual" className="text-xs font-medium text-gray-700 cursor-pointer">
                Repetir anualmente en esta fecha
              </label>
            </div>
          </div>
        )}

        {/* 2. PLANTILLA: TAREA */}
        {plantilla === TipoPlantilla.TAREA && (
          <div className="bg-secondary border border-separator p-3.5 rounded-xl flex flex-col gap-3">
            <span className="apple-subhead font-semibold text-label-primary flex items-center gap-1.5">
              <ListTodo size={14} className="text-terracotta" />
              Configuración de la tarea
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsable Principal *</label>
                <select
                  value={responsableTareaId}
                  onChange={(e) => setResponsableTareaId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                >
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Estado de Ejecución</label>
                <select
                  value={estadoTarea}
                  onChange={(e) => setEstadoTarea(e.target.value as EstadoEvento)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                >
                  <option value={EstadoEvento.ACTIVO}>Pendiente</option>
                  <option value={EstadoEvento.COMPLETADO}>Realizado</option>
                  <option value={EstadoEvento.CANCELADO}>Cancelado</option>
                </select>
              </div>
            </div>

            {/* To-Do Dinámico de la Tarea */}
            <div className="mt-1">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lista de subtareas</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={nuevaSubtarea}
                  onChange={(e) => setNuevaSubtarea(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarSubtarea(); } }}
                  placeholder="Escribir subtarea y pulsar Agregar..."
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
                />
                <button
                  type="button"
                  onClick={agregarSubtarea}
                  className="px-3 py-1.5 bg-terracotta text-white text-xs font-semibold rounded-lg hover:bg-terracotta-hover transition"
                >
                  Agregar
                </button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                {listaSubtareas.map(st => (
                  <div key={st.id} className="flex items-center justify-between bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs">
                    <div 
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={() => toggleSubtareaLocal(st.id)}
                    >
                      {st.completado ? <CheckSquare size={14} className="text-terracotta" /> : <Square size={14} className="text-gray-400" />}
                      <span className={st.completado ? 'line-through text-gray-400' : 'text-gray-800'}>
                        {st.descripcion}
                      </span>
                    </div>
                    <button type="button" onClick={() => eliminarSubtarea(st.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. PLANTILLA: CITA MÉDICA */}
        {plantilla === TipoPlantilla.CITA_MEDICA && (
          <div className="bg-secondary border border-separator p-3.5 rounded-xl flex flex-col gap-3">
            <span className="apple-subhead font-semibold text-label-primary flex items-center gap-1.5">
              <Stethoscope size={14} className="text-terracotta" />
              Detalles médicos
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Paciente del Hogar *</label>
                <select
                  value={pacienteId}
                  onChange={(e) => setPacienteId(e.target.value)}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                >
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Acompañante(s)</label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white border border-gray-300 rounded-lg">
                  {usuarios.filter(u => u.id !== pacienteId).map(u => {
                    const sel = acompanantesIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleParticipante(u.id, acompanantesIds, setAcompanantesIds)}
                        className={`text-xs px-2 py-0.5 rounded-md border ${
                          sel ? 'bg-mint/15 border-terracotta text-label-primary font-semibold' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        {u.nombre}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Especialista (Opcional)</label>
                <input
                  type="text"
                  value={nombreEspecialista}
                  onChange={(e) => setNombreEspecialista(e.target.value)}
                  placeholder="Ej. Dr. Mario Gómez"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Especialidad (Opcional)</label>
                <input
                  type="text"
                  value={especialidadMedica}
                  onChange={(e) => setEspecialidadMedica(e.target.value)}
                  placeholder="Ej. Odontología, Pediatría"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 4. PLANTILLA: MERCADO */}
        {plantilla === TipoPlantilla.MERCADO && (
          <div className="bg-secondary border border-separator p-3.5 rounded-xl flex flex-col gap-3">
            <span className="apple-subhead font-semibold text-label-primary flex items-center gap-1.5">
              <ShoppingCart size={14} className="text-terracotta" />
              Gestión de compras
            </span>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Encargados de la Compra</label>
              <div className="flex flex-wrap gap-1.5 p-1.5 bg-white border border-gray-300 rounded-lg">
                {usuarios.map(u => {
                  const sel = encargadosMercadoIds.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleParticipante(u.id, encargadosMercadoIds, setEncargadosMercadoIds)}
                      className={`text-xs px-2.5 py-1 rounded-md border ${
                        sel ? 'bg-mint/15 border-terracotta text-label-primary font-semibold' : 'bg-gray-50 border-gray-200 text-gray-600'
                      }`}
                    >
                      {u.nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista dinámica de compras */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lista de artículos / productos</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={nuevoItemCompra}
                  onChange={(e) => setNuevoItemCompra(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarItemCompra(); } }}
                  placeholder="Ej. Leche, Frutas, Detergente..."
                  className="flex-1 text-xs border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white outline-none"
                />
                <button
                  type="button"
                  onClick={agregarItemCompra}
                  className="px-3 py-1.5 bg-terracotta text-white text-xs font-semibold rounded-lg hover:bg-terracotta-hover transition"
                >
                  Añadir
                </button>
              </div>

              <div className="flex flex-col gap-1.5 max-h-32 overflow-y-auto">
                {listaCompras.map(it => (
                  <div key={it.id} className="flex items-center justify-between bg-white border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs">
                    <div 
                      className="flex items-center gap-2 cursor-pointer flex-1"
                      onClick={() => toggleItemCompraLocal(it.id)}
                    >
                      {it.completado ? <CheckSquare size={14} className="text-terracotta" /> : <Square size={14} className="text-gray-400" />}
                      <span className={it.completado ? 'line-through text-gray-400' : 'text-gray-800'}>
                        {it.descripcion}
                      </span>
                    </div>
                    <button type="button" onClick={() => eliminarItemCompra(it.id)} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 5. PLANTILLA: EVENTO ESTÁNDAR (Organizador / Correo) */}
        {plantilla === TipoPlantilla.EVENTO && (
          <div className="bg-secondary border border-separator p-3.5 rounded-xl flex flex-col gap-3">
            <span className="apple-subhead font-semibold text-label-primary flex items-center gap-1.5">
              <User size={14} className="text-terracotta" />
              Organizador del evento
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Responsable Principal</label>
                <select
                  value={organizadorId}
                  onChange={(e) => {
                    setOrganizadorId(e.target.value);
                    const usr = usuarios.find(u => u.id === e.target.value);
                    if (usr?.email) setCorreoContacto(usr.email);
                  }}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                >
                  {usuarios.map(u => (
                    <option key={u.id} value={u.id}>{u.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Correo de Contacto</label>
                <input
                  type="email"
                  value={correoContacto}
                  onChange={(e) => setCorreoContacto(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  className="w-full text-xs border border-gray-300 rounded-lg p-2.5 bg-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TEMPORALIDAD Y FECHAS ----------------- */}
        <div className="flex flex-col gap-3 border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="apple-footnote font-semibold text-label-secondary flex items-center gap-1.5">
              <Clock size={14} className="text-gray-500" />
              Horario y fechas
            </span>
            
            {/* Modalidad todo el día (deshabilitada para cita médica según RF-02) */}
            {plantilla !== TipoPlantilla.CITA_MEDICA ? (
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={todoElDia}
                  onChange={(e) => setTodoElDia(e.target.checked)}
                  className="rounded text-terracotta focus:ring-terracotta"
                />
                Todo el día
              </label>
            ) : (
              <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Hora obligatoria para cita médica
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {plantilla === TipoPlantilla.TAREA ? 'Fecha / Vencimiento *' : 'Inicio *'}
              </label>
              <input
                type={todoElDia ? 'date' : 'datetime-local'}
                required
                value={fechaInicio}
                onChange={(e) => {
                  setFechaInicio(e.target.value);
                  if (!fechaFin || fechaFin < e.target.value) {
                    setFechaFin(e.target.value);
                  }
                }}
                className="w-full text-xs border border-gray-300 rounded-xl p-2.5 bg-white outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                {plantilla === TipoPlantilla.TAREA ? 'Límite Final (Opcional)' : 'Fin *'}
              </label>
              <input
                type={todoElDia ? 'date' : 'datetime-local'}
                required={plantilla !== TipoPlantilla.TAREA}
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-xl p-2.5 bg-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* ----------------- ASISTENTES / PARTICIPANTES GENERALES ----------------- */}
        {plantilla !== TipoPlantilla.MERCADO && (
          <div className="border-t pt-3">
            <label className="block apple-footnote font-semibold text-label-secondary mb-1.5 flex items-center gap-1.5">
              <Users size={14} className="text-gray-500" />
              {plantilla === TipoPlantilla.CUMPLEANOS 
                ? 'Otros participantes / organizadores' 
                : plantilla === TipoPlantilla.TAREA 
                ? 'Otros integrantes sumados' 
                : 'Asistentes / miembros involucrados'}
            </label>
            <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 border border-gray-200 rounded-xl">
              {usuarios
                .filter(u => {
                  if (plantilla === TipoPlantilla.CUMPLEANOS && agasajadoTipo === 'hogar' && u.id === agasajadoId) return false;
                  if (plantilla === TipoPlantilla.TAREA && u.id === responsableTareaId) return false;
                  if (plantilla === TipoPlantilla.CITA_MEDICA && u.id === pacienteId) return false;
                  return true;
                })
                .map(u => {
                  const sel = participantesSeleccionados.includes(u.id);
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => toggleParticipante(u.id, participantesSeleccionados, setParticipantesSeleccionados)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                        sel ? 'bg-terracotta border-terracotta text-white font-medium' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {u.nombre}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        {/* ----------------- DETALLES GENERALES (UBICACIÓN Y NOTAS) ----------------- */}
        <div className="border-t pt-3 flex flex-col gap-3">
          <div>
            <label className="block apple-footnote font-semibold text-label-secondary mb-1 flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-500" />
              Ubicación {plantilla === TipoPlantilla.CITA_MEDICA && '* (Obligatoria)'}
            </label>
            <input
              type="text"
              required={plantilla === TipoPlantilla.CITA_MEDICA}
              value={ubicacion}
              onChange={(e) => setUbicacion(e.target.value)}
              placeholder={plantilla === TipoPlantilla.CITA_MEDICA ? 'Ej. Clínica San Lucas, Consultorio 402' : 'Dirección, sala o lugar'}
              className="w-full text-xs border border-gray-300 rounded-xl px-3 py-2 bg-white outline-none"
            />
          </div>

          <div>
            <label className="block apple-footnote font-semibold text-label-secondary mb-1 flex items-center gap-1.5">
              <FileText size={14} className="text-gray-500" />
              Notas adicionales / descripción
            </label>
            <textarea
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Detalles, instrucciones o comentarios..."
              className="w-full text-xs border border-gray-300 rounded-xl p-2.5 bg-white outline-none resize-none"
            />
          </div>
        </div>

        {/* ----------------- RECORDATORIOS Y ALARMAS ----------------- */}
        <div className="border-t pt-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="apple-footnote font-semibold text-label-secondary flex items-center gap-1.5">
              <Bell size={14} className="text-gray-500" />
              Recordatorios y alarmas
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-gray-700">
              <input
                type="checkbox"
                checked={activarRecordatorio}
                onChange={(e) => setActivarRecordatorio(e.target.checked)}
                className="rounded text-terracotta focus:ring-terracotta"
              />
              Activar alerta
            </label>
          </div>

          {activarRecordatorio && (
            <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex flex-col gap-2.5">
              <div className="flex gap-4 text-xs">
                <span className="text-gray-500 font-medium">Canal:</span>
                <label className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                  <input
                    type="checkbox"
                    checked={canalPush}
                    onChange={(e) => setCanalPush(e.target.checked)}
                    className="rounded text-terracotta"
                  />
                  Alerta móvil (Push)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-gray-700">
                  <input
                    type="checkbox"
                    checked={canalEmail}
                    onChange={(e) => setCanalEmail(e.target.checked)}
                    className="rounded text-terracotta"
                  />
                  Correo electrónico
                </label>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tiempo de Anticipación</label>
                <select
                  value={minutosAnticipacion}
                  onChange={(e) => setMinutosAnticipacion(Number(e.target.value))}
                  className="w-full text-xs border border-gray-300 rounded-lg p-2 bg-white outline-none"
                >
                  <option value={15}>15 minutos antes</option>
                  <option value={30}>30 minutos antes</option>
                  <option value={60}>1 hora antes</option>
                  <option value={120}>2 horas antes</option>
                  <option value={1440}>1 día antes</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ----------------- CÓDIGO DE COLOR ----------------- */}
        <div className="border-t pt-3 flex items-center justify-between">
          <span className="apple-footnote font-semibold text-label-secondary flex items-center gap-1.5">
            <Tag size={14} className="text-gray-500" />
            Color identificador
          </span>
          <div className="flex items-center gap-2">
            {['#AA4B50', '#A13842', '#BD7471', '#B25D5D', '#6EB5A5', '#A13842', '#6B625E'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-gray-400' : 'hover:scale-110'}`}
                style={{ backgroundColor: c }}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-7 h-7 p-0 rounded-full border-0 cursor-pointer"
              title="Personalizado"
            />
          </div>
        </div>

        {/* Botón Guardar */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta hover:bg-terracotta-hover text-white py-3 rounded-xl font-semibold text-sm shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Guardando actividad...' : 'Guardar Actividad'}
          </button>
        </div>

      </form>
    </DrawerResponsivo>
  );
}
