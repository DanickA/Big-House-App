'use client';

import { TipoPlantilla } from '@prisma/client';
import { AlertCircle, MapPin, FileText, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import { PLANTILLAS_CONFIG } from '../types';
import { useEventoForm } from '../hooks/useEventoForm';
import MiniDatePicker from '../atoms/MiniDatePicker';
import TimePicker12h from '../atoms/TimePicker12h';
import ColorPicker from '../atoms/ColorPicker';
import SeccionRecordatorios from '../atoms/SeccionRecordatorios';
import FormEventoEstandar from '../templates/FormEventoEstandar';
import FormCumpleanos from '../templates/FormCumpleanos';
import FormTarea from '../templates/FormTarea';
import FormCitaMedica from '../templates/FormCitaMedica';
import FormMercado from '../templates/FormMercado';
import RecurrenciaScopeSelector from '../dialogs/RecurrenciaModal';

interface EventoFormViewProps {
  form: ReturnType<typeof useEventoForm>;
  miembros: { id: string; nombre: string; email?: string }[];
  tieneEventosDelDia: boolean;
  onVolverAgenda: () => void;
}

export default function EventoFormView({
  form,
  miembros,
  tieneEventosDelDia,
  onVolverAgenda,
}: EventoFormViewProps) {
  const plantillaActualConfig =
    PLANTILLAS_CONFIG.find((p) => p.tipo === form.plantilla) || PLANTILLAS_CONFIG[0];

  return (
    <form onSubmit={form.handleSubmit} className="space-y-6 pt-1">
      {/* Botón para volver a ver agenda si hay eventos */}
      {tieneEventosDelDia && (
        <div className="flex justify-between items-center pb-2 border-b border-[#F0EAE1] dark:border-separator">
          <span className="text-xs font-bold text-label-secondary">
            {form.eventoAEditar ? 'Modificando Actividad' : 'Nueva Actividad'}
          </span>
          <button
            type="button"
            onClick={onVolverAgenda}
            className="text-xs font-semibold text-terracotta dark:text-olive hover:text-label-primary dark:hover:text-label-primary cursor-pointer"
          >
            Volver a la agenda
          </button>
        </div>
      )}

      {form.errorMsg && (
        <div className="p-3.5 bg-terracotta/15 dark:bg-terracotta/20 border border-terracotta/30 dark:border-terracotta/40 text-terracotta rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{form.errorMsg}</span>
        </div>
      )}

      {/* Selector de Plantillas Rápidas (RF-02) */}
      {!form.eventoAEditar && (
        <div className="space-y-2">
          <label className="apple-footnote text-label-secondary font-medium">
            Seleccionar tipo de actividad
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PLANTILLAS_CONFIG.map((p) => {
              const Icon = p.icon;
              const isSelected = form.plantilla === p.tipo;
              return (
                <button
                  key={p.tipo}
                  type="button"
                  onClick={() => form.cambiarPlantilla(p.tipo)}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-terracotta text-white border-terracotta shadow-xs'
                      : 'bg-tertiary border-separator/80 text-label-secondary hover:text-label-primary hover:bg-tertiary'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-secondary text-label-primary shadow-2xs'
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <span className="text-xs font-bold truncate leading-tight">{p.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Título de la Actividad */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="apple-footnote text-label-secondary font-medium">
            Título de la actividad *
          </label>
          {form.plantilla === TipoPlantilla.CUMPLEANOS && (
            <div>
              {!form.tituloEditadoManualmente ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-terracotta dark:text-olive bg-terracotta/10 dark:bg-olive/15 px-2 py-0.5 rounded-full border border-terracotta/20 dark:border-olive/30 animate-fade-in">
                  <Sparkles size={11} className="shrink-0" />
                  <span>Sincronizado con agasajado</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={form.regenerarTituloCumpleanos}
                  className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-terracotta hover:underline cursor-pointer transition-all"
                  title="Restaurar formato automático 'Cumpleaños de [Nombre]'"
                >
                  <RotateCcw size={10} className="shrink-0" />
                  <span>Restaurar formato estándar</span>
                </button>
              )}
            </div>
          )}
        </div>
        <input
          type="text"
          value={form.titulo}
          onChange={(e) => form.setTitulo(e.target.value)}
          placeholder={plantillaActualConfig.placeholder}
          required
          className="w-full px-4 py-2.5 rounded-2xl bg-tertiary border border-separator/80 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-terracotta text-sm font-semibold transition-colors shadow-2xs"
        />
      </div>

      {/* Selector de Fecha Puntual */}
      <MiniDatePicker
        fechaActividad={form.fechaActividad}
        onChangeFecha={form.setFechaActividad}
      />

      {/* Selector de Horario (12h AM/PM y Todo el día) */}
      <TimePicker12h
        todoElDia={form.todoElDia}
        onToggleTodoElDia={form.setTodoElDia}
        hora12={form.hora12}
        onChangeHora={form.setHora12}
        minutos={form.minutos}
        onChangeMinutos={form.setMinutos}
        periodo={form.periodo}
        onChangePeriodo={form.setPeriodo}
        deshabilitarTodoElDia={form.plantilla === TipoPlantilla.CITA_MEDICA}
        badgeDeshabilitado="Hora fija requerida"
      />

      {/* Selector de Color Identificador */}
      <ColorPicker
        colorSeleccionado={form.color}
        onSelectColor={form.setColor}
      />

      {/* Ubicación / Lugar */}
      <div className="space-y-1.5">
        <label className="apple-footnote text-label-secondary font-medium flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin size={13} className="text-terracotta" />
            <span>Ubicación o Lugar</span>
          </div>
          {form.plantilla === TipoPlantilla.CITA_MEDICA ? (
            <span className="text-[10px] uppercase font-bold tracking-wider text-terracotta bg-terracotta/10 px-1.5 py-0.5 rounded">
              Obligatorio
            </span>
          ) : (
            <span className="text-[11px] text-label-tertiary font-normal">(opcional)</span>
          )}
        </label>
        <input
          type="text"
          required={form.plantilla === TipoPlantilla.CITA_MEDICA}
          value={form.ubicacion}
          onChange={(e) => form.setUbicacion(e.target.value)}
          placeholder={
            form.plantilla === TipoPlantilla.CITA_MEDICA
              ? 'Ej. Consultorio 402, Clínica del Prado'
              : 'Ej. Sala principal, Terraza, Restaurante...'
          }
          className={`w-full px-3.5 py-2 text-xs rounded-xl bg-tertiary border text-label-primary placeholder:text-label-tertiary focus:outline-none transition-colors ${
            form.plantilla === TipoPlantilla.CITA_MEDICA && !form.ubicacion.trim()
              ? 'border-terracotta/60 focus:border-terracotta'
              : 'border-separator/80 focus:border-terracotta'
          }`}
        />
        {form.plantilla === TipoPlantilla.CITA_MEDICA && !form.ubicacion.trim() && (
          <p className="text-[11px] text-terracotta flex items-center gap-1 font-medium mt-1">
            <AlertCircle size={11} className="shrink-0" />
            <span>Indique la dirección, clínica o consultorio para la cita médica.</span>
          </p>
        )}
      </div>

      {/* Subformularios según la Plantilla Activa */}
      {form.plantilla === TipoPlantilla.EVENTO && (
        <FormEventoEstandar
          miembros={miembros}
          organizadorId={form.organizadorId}
          onChangeOrganizadorId={form.setOrganizadorId}
          correoContacto={form.correoContacto}
          onChangeCorreoContacto={form.setCorreoContacto}
          asistentesIds={form.asistentesIds}
          onToggleAsistente={form.toggleAsistente}
        />
      )}

      {form.plantilla === TipoPlantilla.CUMPLEANOS && (
        <FormCumpleanos
          miembros={miembros}
          recurrenciaAnual={form.recurrenciaAnual}
          onToggleRecurrenciaAnual={form.setRecurrenciaAnual}
          agasajadoTipo={form.agasajadoTipo}
          onChangeAgasajadoTipo={form.setAgasajadoTipo}
          agasajadoHogarId={form.agasajadoHogarId}
          onChangeAgasajadoHogarId={form.setAgasajadoHogarId}
          agasajadoExternoNombre={form.agasajadoExternoNombre}
          onChangeAgasajadoExternoNombre={form.setAgasajadoExternoNombre}
          agasajadoExternoContacto={form.agasajadoExternoContacto}
          onChangeAgasajadoExternoContacto={form.setAgasajadoExternoContacto}
          participantesCumpleIds={form.participantesCumpleIds}
          onToggleParticipanteCumple={form.toggleParticipanteCumple}
        />
      )}

      {form.plantilla === TipoPlantilla.TAREA && (
        <FormTarea
          miembros={miembros}
          responsableTareaId={form.responsableTareaId}
          onChangeResponsableTareaId={form.setResponsableTareaId}
          participantesTareaIds={form.participantesTareaIds}
          onToggleParticipanteTarea={form.toggleParticipanteTarea}
          estadoTarea={form.estadoTarea}
          onChangeEstadoTarea={form.setEstadoTarea}
          subtareas={form.subtareas}
          onAddSubtarea={form.addSubtarea}
          onAddMultipleSubtareas={form.addSubtareasBatch}
          onClearAllSubtareas={form.clearSubtareas}
          onToggleSubtarea={form.toggleSubtarea}
          onRemoveSubtarea={form.removeSubtarea}
          usuarioActualId={form.usuarioActualId}
        />
      )}

      {form.plantilla === TipoPlantilla.CITA_MEDICA && (
        <FormCitaMedica
          miembros={miembros}
          pacienteId={form.pacienteId}
          onChangePacienteId={form.setPacienteId}
          especialista={form.especialista}
          onChangeEspecialista={form.setEspecialista}
          especialidad={form.especialidad}
          onChangeEspecialidad={form.setEspecialidad}
          acompanantesIds={form.acompanantesIds}
          onToggleAcompanante={form.toggleAcompanante}
          usuarioActualId={form.usuarioActualId}
        />
      )}

      {form.plantilla === TipoPlantilla.MERCADO && (
        <FormMercado
          miembros={miembros}
          encargadosMercadoIds={form.encargadosMercadoIds}
          onToggleEncargadoMercado={form.toggleEncargadoMercado}
          itemsMercado={form.itemsMercado}
          onAddItemMercado={form.addItemMercado}
          onAddMultipleItemsMercado={form.addItemsMercadoBatch}
          onClearAllMercado={form.clearItemsMercado}
          onToggleItemMercado={form.toggleItemMercado}
          onRemoveItemMercado={form.removeItemMercado}
        />
      )}

      {/* Descripción / Notas Adicionales */}
      <div className="space-y-1.5">
        <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
          <FileText size={13} className="text-terracotta" />
          <span>Notas o detalles adicionales</span>
        </label>
        <textarea
          rows={2}
          value={form.descripcion}
          onChange={(e) => form.setDescripcion(e.target.value)}
          placeholder="Información relevante o instrucciones..."
          className="w-full px-3.5 py-2 text-xs rounded-xl bg-tertiary border border-separator/80 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-terracotta resize-none"
        />
      </div>

      {/* Recordatorios y Alarma */}
      <SeccionRecordatorios
        activarAlarma={form.activarAlarma}
        onToggleAlarma={form.setActivarAlarma}
        canalPush={form.canalPush}
        onTogglePush={form.setCanalPush}
        canalEmail={form.canalEmail}
        onToggleEmail={form.setCanalEmail}
        minutosAnticipacion={form.minutosAnticipacion}
        onChangeMinutosAnticipacion={form.setMinutosAnticipacion}
      />

      {/* Selector de Alcance para Series Recurrentes (Integrado en el Formulario) */}
      {form.eventoAEditar && form.eventoAEditar.recurrencia && (
        <RecurrenciaScopeSelector
          value={form.opcionRecurrenciaEdicion}
          onChange={form.setOpcionRecurrenciaEdicion}
        />
      )}

      {/* Botones de Acción */}
      <div className="flex items-center justify-end gap-3 pt-3 border-t border-separator/80">
        {tieneEventosDelDia && (
          <button
            type="button"
            onClick={onVolverAgenda}
            disabled={form.procesando}
            className="btn-apple-secondary px-5 text-xs font-semibold cursor-pointer"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={form.procesando}
          className="btn-apple-filled px-6 text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
        >
          {form.procesando && <Loader2 size={13} className="animate-spin" />}
          <span>
            {form.eventoAEditar
              ? form.eventoAEditar.recurrencia
                ? form.opcionRecurrenciaEdicion === 'SOLO_ESTE'
                  ? 'Guardar en esta fecha'
                  : 'Guardar en toda la serie'
                : 'Guardar Cambios'
              : 'Agendar Actividad'}
          </span>
        </button>
      </div>
    </form>
  );
}
