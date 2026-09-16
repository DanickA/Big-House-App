'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { DrawerResponsivo } from './DrawerResponsivo';
import { toggleEstadoSubtarea, cancelarEventoLogico, eliminarEventoFisico } from '@/actions/calendario';
import ConfirmModal from '@/components/ui/ConfirmModal';
import EmptyState from '@/components/ui/EmptyState';
import { CheckSquare, Square, Trash2, XCircle, MapPin, Plus, User, Stethoscope, Pencil, Calendar } from 'lucide-react';

interface AgendaDiaProps {
  isOpen: boolean;
  onClose: () => void;
  fecha: Date;
  eventos: any[];
  onEventModified: () => void;
  onCrearEnFecha?: (fecha: Date) => void;
  onEditarEvento?: (evento: any) => void;
}

export function AgendaDia({ isOpen, onClose, fecha, eventos, onEventModified, onCrearEnFecha, onEditarEvento }: AgendaDiaProps) {
  const [accionConfirmar, setAccionConfirmar] = useState<{
    id: string;
    titulo: string;
    tipo: 'cancelar' | 'eliminar';
  } | null>(null);
  
  const handleToggleSubtarea = async (id: string, actual: boolean) => {
    await toggleEstadoSubtarea(id, !actual);
    onEventModified();
  };

  const handleCancelarClick = (id: string, titulo: string) => {
    setAccionConfirmar({ id, titulo, tipo: 'cancelar' });
  };

  const handleEliminarClick = (id: string, titulo: string) => {
    setAccionConfirmar({ id, titulo, tipo: 'eliminar' });
  };

  const handleConfirmarAccion = async () => {
    if (!accionConfirmar) return;
    if (accionConfirmar.tipo === 'cancelar') {
      await cancelarEventoLogico(accionConfirmar.id);
    } else {
      await eliminarEventoFisico(accionConfirmar.id);
    }
    setAccionConfirmar(null);
    onEventModified();
  };

  const titulo = format(fecha, "EEEE d 'de' MMMM", { locale: es });
  const tituloCapitalizado = titulo.charAt(0).toUpperCase() + titulo.slice(1);

  return (
    <DrawerResponsivo isOpen={isOpen} onClose={onClose} title={tituloCapitalizado}>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Actividades ({eventos.length})
        </span>
        {onCrearEnFecha && (
          <button
            onClick={() => {
              onClose();
              onCrearEnFecha(fecha);
            }}
            className="flex items-center gap-1 text-xs font-semibold text-[#5F6F52] hover:text-[#4E5C43] bg-[#EEF2EA] px-2.5 py-1 rounded-lg transition"
          >
            <Plus size={13} />
            <span>Agregar actividad</span>
          </button>
        )}
      </div>

      {eventos.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Día Despejado"
          description="No hay actividades ni compromisos programados para esta fecha."
          action={
            onCrearEnFecha
              ? {
                  label: 'Agregar actividad',
                  onClick: () => {
                    onClose();
                    onCrearEnFecha(fecha);
                  },
                  icon: Plus,
                }
              : undefined
          }
          compact={true}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {eventos.map(evento => {
             const esCancelado = evento.estado === 'CANCELADO';
             const detalles = evento.detalles || {};
             return (
               <div key={evento.id} className={`border rounded-xl p-3.5 transition-all ${esCancelado ? 'opacity-60 bg-gray-50 dark:bg-tertiary/40 border-gray-200 dark:border-separator' : 'bg-white dark:bg-secondary border-gray-200 dark:border-separator shadow-2xs'}`}>
                 <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2">
                     <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: evento.color }} />
                     <h3 className={`text-sm font-bold ${esCancelado ? 'line-through text-label-tertiary' : 'text-label-primary'}`}>
                       {evento.titulo}
                     </h3>
                   </div>
                    <div className="flex gap-1.5 shrink-0">
                      {onEditarEvento && (
                        <button
                          type="button"
                          onClick={() => onEditarEvento(evento)}
                          className="text-[#5F6F52] dark:text-olive hover:bg-[#EEF2EA] dark:hover:bg-tertiary p-1.5 rounded-lg transition cursor-pointer active:scale-90"
                          title="Editar Actividad"
                          aria-label="Editar Actividad"
                        >
                          <Pencil size={15} strokeWidth={2.2} />
                        </button>
                      )}
                      {!esCancelado && (
                        <button
                          type="button"
                          onClick={() => handleCancelarClick(evento.id, evento.titulo)}
                          className="text-amber-600 dark:text-amber hover:bg-amber-50 dark:hover:bg-amber/10 p-1.5 rounded-lg transition cursor-pointer active:scale-90"
                          title="Cancelar Evento"
                          aria-label="Cancelar Evento"
                        >
                          <XCircle size={15} strokeWidth={2.2} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleEliminarClick(evento.id, evento.titulo)}
                        className="text-terracotta hover:bg-[#FAE2D8] dark:hover:bg-terracotta/20 p-1.5 rounded-lg transition cursor-pointer active:scale-90"
                        title="Eliminar Definitivamente"
                        aria-label="Eliminar Definitivamente"
                      >
                        <Trash2 size={15} strokeWidth={2.2} />
                      </button>
                    </div>
                 </div>
                 
                 <div className="text-xs text-gray-600 flex flex-col gap-1 mb-2">
                   <div>
                     {evento.todo_el_dia 
                       ? 'Todo el día' 
                       : `${format(new Date(evento.fecha_inicio), 'p')} - ${format(new Date(evento.fecha_fin), 'p')}`
                     }
                   </div>
                   {evento.ubicacion && (
                     <div className="flex items-center gap-1 text-gray-500">
                       <MapPin size={12} className="shrink-0" />
                       <span>{evento.ubicacion}</span>
                     </div>
                   )}
                   {detalles.especialista && (
                     <div className="flex items-center gap-1 text-gray-500">
                       <Stethoscope size={12} className="shrink-0" />
                       <span>{detalles.especialista} {detalles.especialidad ? `(${detalles.especialidad})` : ''}</span>
                     </div>
                   )}
                   {evento.descripcion && (
                     <p className="text-gray-500 italic mt-0.5">{evento.descripcion}</p>
                   )}
                 </div>

                 {evento.subtareas && evento.subtareas.length > 0 && (
                   <div className="mt-3 border-t pt-2">
                     <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Lista de Tareas</h4>
                     <div className="flex flex-col gap-1">
                       {evento.subtareas.map((sub: any) => (
                         <div 
                           key={sub.id} 
                           className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                           onClick={() => handleToggleSubtarea(sub.id, sub.completado)}
                         >
                           {sub.completado ? <CheckSquare size={16} className="text-green-500" /> : <Square size={16} className="text-gray-400" />}
                           <span className={`text-sm ${sub.completado ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                             {sub.descripcion}
                           </span>
                         </div>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
             )
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!accionConfirmar}
        title={
          accionConfirmar?.tipo === 'cancelar'
            ? '¿Cancelar evento?'
            : '¿Eliminar evento definitivamente?'
        }
        description={
          accionConfirmar?.tipo === 'cancelar'
            ? `¿Deseas marcar como cancelado el evento "${accionConfirmar?.titulo}"? Se mantendrá en el historial pero se mostrará tachado.`
            : `¿Estás seguro de eliminar "${accionConfirmar?.titulo}" de la agenda? Esta acción borrará el evento de forma permanente.`
        }
        confirmText={
          accionConfirmar?.tipo === 'cancelar'
            ? 'Sí, cancelar evento'
            : 'Eliminar definitivamente'
        }
        variant={accionConfirmar?.tipo === 'cancelar' ? 'warning' : 'danger'}
        onConfirm={handleConfirmarAccion}
        onClose={() => setAccionConfirmar(null)}
      />
    </DrawerResponsivo>
  );
}
