'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Plus } from 'lucide-react';
import { EventoUnificado } from '@/actions/eventos';
import { cancelarEventoLogico, eliminarEventoFisico } from '@/actions/calendario';
import ConfirmModal from '@/components/ui/ConfirmModal';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { EventoContextModalProps, TipoPlantilla } from './types';
import { useEventoForm } from './hooks/useEventoForm';
import AgendaDiaView from './views/AgendaDiaView';
import EventoFormView from './views/EventoFormView';

export default function EventoContextModal({
  isOpen,
  selectedDate,
  eventosDelDia,
  miembros,
  usuarioActualId,
  modoInicial,
  onClose,
  onSuccess,
}: EventoContextModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  // Modales anidados de confirmación
  const [idEventoAEliminar, setIdEventoAEliminar] = useState<string | null>(null);
  const [idEventoACancelar, setIdEventoACancelar] = useState<{ id: string; titulo: string } | null>(null);

  const form = useEventoForm({
    miembros,
    usuarioActualId,
    selectedDate,
    onSuccess,
    onClose,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Bloquear scroll de la ventana al abrir y determinar modo inicial intencional
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (modoInicial === 'formulario') {
        setMostrarFormulario(true);
      } else if (modoInicial === 'agenda') {
        setMostrarFormulario(false);
      } else {
        setMostrarFormulario(eventosDelDia.length === 0);
      }
      form.resetFormulario(TipoPlantilla.EVENTO);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, selectedDate, eventosDelDia.length, modoInicial]);

  if (!isOpen || !mounted || !selectedDate) return null;

  // Fecha para la cabecera
  const fechaActividadObj = form.fechaActividad
    ? (() => {
        const [y, m, d] = form.fechaActividad.split('-').map(Number);
        return new Date(y, (m || 1) - 1, d || 1);
      })()
    : selectedDate;

  const fechaFormateada = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(fechaActividadObj);

  function handleEditar(ev: EventoUnificado) {
    form.cargarEventoParaEdicion(ev);
    setMostrarFormulario(true);
  }

  function handleVolverAgenda() {
    form.resetFormulario(TipoPlantilla.EVENTO);
    setMostrarFormulario(false);
  }

  async function confirmarCancelarEvento() {
    if (!idEventoACancelar) return;
    const res = await cancelarEventoLogico(idEventoACancelar.id);
    if (res.success) {
      onSuccess(`Actividad "${idEventoACancelar.titulo}" cancelada. Permanecerá archivada en el historial.`);
      setIdEventoACancelar(null);
      onClose();
    } else {
      form.setErrorMsg(res.error || 'No se pudo cancelar la actividad');
      setIdEventoACancelar(null);
    }
  }

  async function confirmarEliminarEvento() {
    if (!idEventoAEliminar) return;
    const res = await eliminarEventoFisico(idEventoAEliminar);
    if (res.success) {
      onSuccess('Actividad eliminada definitivamente de la base de datos');
      setIdEventoAEliminar(null);
      onClose();
    } else {
      form.setErrorMsg(res.error || 'No se pudo eliminar el evento');
      setIdEventoAEliminar(null);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative glass-modal w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col my-auto max-h-[calc(100vh-3.5rem)] border border-white/80 dark:border-white/10 animate-fade-in-up">
        
        {/* Encabezado del Día */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-4.5 border-b border-separator/80 dark:border-separator bg-white/85 dark:bg-[#1C1F1A]/85 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint/15 dark:bg-[#282C25] border border-separator/60 dark:border-separator text-label-primary dark:text-olive flex items-center justify-center shadow-2xs font-bold text-sm tabular-nums">
              {fechaActividadObj.getDate()}
            </div>
            <div>
              <h2 className="apple-headline font-bold text-label-primary capitalize leading-tight">
                {fechaFormateada}
              </h2>
              <p className="apple-caption-1 text-label-secondary">
                {eventosDelDia.length} {eventosDelDia.length === 1 ? 'actividad agendada' : 'actividades agendadas'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-label-secondary hover:text-label-primary transition cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Selector de Modo Segmentado Apple HIG (Agenda vs Nueva Actividad) */}
        {eventosDelDia.length > 0 && !form.eventoAEditar && (
          <div className="px-6 sm:px-8 pt-3 pb-1 border-b border-separator/40 shrink-0">
            <SegmentedControl<'agenda' | 'formulario'>
              options={[
                {
                  value: 'agenda',
                  label: `Agenda (${eventosDelDia.length})`,
                  icon: Calendar,
                },
                {
                  value: 'formulario',
                  label: '+ Nueva Actividad',
                  icon: Plus,
                },
              ]}
              value={mostrarFormulario ? 'formulario' : 'agenda'}
              onChange={(val) => {
                if (val === 'formulario') {
                  form.resetFormulario(TipoPlantilla.EVENTO);
                  setMostrarFormulario(true);
                } else {
                  setMostrarFormulario(false);
                }
              }}
              size="sm"
              ariaLabel="Alternar entre lista de actividades y agendamiento"
            />
          </div>
        )}

        {/* Cuerpo Contextual Scrollable */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 pr-5 sm:pr-7">
          {eventosDelDia.length > 0 && !mostrarFormulario ? (
            <AgendaDiaView
              eventosDelDia={eventosDelDia}
              onAgregarEvento={() => {
                form.resetFormulario(TipoPlantilla.EVENTO);
                setMostrarFormulario(true);
              }}
              onEditar={handleEditar}
              onCancelarClick={(ev) => setIdEventoACancelar({ id: ev.id, titulo: ev.titulo })}
              onEliminarClick={(id) => setIdEventoAEliminar(id)}
            />
          ) : (
            <EventoFormView
              form={form}
              miembros={miembros}
              tieneEventosDelDia={eventosDelDia.length > 0}
              onVolverAgenda={handleVolverAgenda}
            />
          )}
        </div>

      </div>

      {/* Diálogo de Confirmación para Cancelar Actividad */}
      <ConfirmModal
        isOpen={!!idEventoACancelar}
        title="¿Cancelar actividad?"
        description={`¿Deseas marcar como cancelada la actividad "${idEventoACancelar?.titulo}"? Permanecerá tachada en el calendario para conservar la trazabilidad histórica.`}
        confirmText="Sí, cancelar actividad"
        variant="warning"
        onConfirm={confirmarCancelarEvento}
        onClose={() => setIdEventoACancelar(null)}
      />

      {/* Diálogo de Confirmación para Eliminar Físicamente */}
      <ConfirmModal
        isOpen={!!idEventoAEliminar}
        title="¿Eliminar definitivamente?"
        description="Esta acción eliminará por completo el evento de la base de datos y no se podrá recuperar en el historial."
        confirmText="Eliminar evento"
        variant="danger"
        onConfirm={confirmarEliminarEvento}
        onClose={() => setIdEventoAEliminar(null)}
      />
    </div>,
    document.body
  );
}
