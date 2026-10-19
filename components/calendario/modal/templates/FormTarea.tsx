'use client';

import { User, Users, CheckCircle2 } from 'lucide-react';
import { EstadoEvento } from '@prisma/client';
import ChecklistDinamica from '../atoms/ChecklistDinamica';
import { SubtareaItem } from '../types';

interface FormTareaProps {
  miembros: { id: string; nombre: string; email?: string }[];
  responsableTareaId: string;
  onChangeResponsableTareaId: (id: string) => void;
  participantesTareaIds: string[];
  onToggleParticipanteTarea: (id: string) => void;
  estadoTarea: EstadoEvento;
  onChangeEstadoTarea: (estado: EstadoEvento) => void;
  subtareas: SubtareaItem[];
  onAddSubtarea: (desc: string) => void;
  onAddMultipleSubtareas?: (descs: string[]) => void;
  onClearAllSubtareas?: () => void;
  onToggleSubtarea: (id: string) => void;
  onRemoveSubtarea: (id: string) => void;
  usuarioActualId?: string;
}

export default function FormTarea({
  miembros,
  responsableTareaId,
  onChangeResponsableTareaId,
  participantesTareaIds,
  onToggleParticipanteTarea,
  estadoTarea,
  onChangeEstadoTarea,
  subtareas,
  onAddSubtarea,
  onAddMultipleSubtareas,
  onClearAllSubtareas,
  onToggleSubtarea,
  onRemoveSubtarea,
  usuarioActualId,
}: FormTareaProps) {
  return (
    <div className="space-y-4 pt-1">
      {/* Responsable Principal y Estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
              <User size={13} className="text-terracotta" />
              <span>Responsable principal</span>
            </label>
            {usuarioActualId && responsableTareaId !== usuarioActualId && (
              <button
                type="button"
                onClick={() => onChangeResponsableTareaId(usuarioActualId)}
                className="text-[10.5px] font-semibold text-terracotta dark:text-olive hover:underline cursor-pointer"
              >
                Asignarme a mí (Tú)
              </button>
            )}
          </div>
          <select
            value={responsableTareaId}
            onChange={(e) => onChangeResponsableTareaId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-tertiary border border-separator/80 text-label-primary focus:outline-none focus:border-terracotta cursor-pointer"
          >
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} {m.id === usuarioActualId ? '(Tú)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-terracotta" />
            <span>Estado de la tarea</span>
          </label>
          <select
            value={estadoTarea}
            onChange={(e) => onChangeEstadoTarea(e.target.value as EstadoEvento)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-tertiary border border-separator/80 text-label-primary focus:outline-none focus:border-terracotta cursor-pointer"
          >
            <option value={EstadoEvento.ACTIVO}>Pendiente / En curso</option>
            <option value={EstadoEvento.COMPLETADO}>Completada</option>
            <option value={EstadoEvento.CANCELADO}>Cancelada</option>
          </select>
        </div>
      </div>

      {/* Participantes adicionales */}
      {miembros.length > 1 && (
        <div className="space-y-2">
          <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
            <Users size={13} className="text-terracotta" />
            <span>Colaboradores asignados</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {miembros
              .filter((m) => m.id !== responsableTareaId)
              .map((m) => {
                const isSelected = participantesTareaIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    onClick={() => onToggleParticipanteTarea(m.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'bg-terracotta/15 border-terracotta text-label-primary font-semibold shadow-3xs'
                        : 'bg-tertiary border-separator/60 text-label-secondary hover:text-label-primary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded accent-terracotta cursor-pointer pointer-events-none"
                    />
                    <span className="truncate">
                      {m.nombre} {m.id === usuarioActualId ? '(Tú)' : ''}
                    </span>
                  </label>
                );
              })}
          </div>
        </div>
      )}

      {/* Subtareas Dinámicas */}
      <ChecklistDinamica
        titulo="Subtareas y pasos específicos"
        placeholderNuevoItem="Ej. Comprar repuesto, barrer hojas..."
        items={subtareas}
        onAddItem={onAddSubtarea}
        onAddMultipleItems={onAddMultipleSubtareas}
        onClearAll={onClearAllSubtareas}
        onToggleItem={onToggleSubtarea}
        onRemoveItem={onRemoveSubtarea}
        tipoItemPlural="subtareas"
      />
    </div>
  );
}
