'use client';

import { User, Users, Stethoscope, FileText } from 'lucide-react';

interface FormCitaMedicaProps {
  miembros: { id: string; nombre: string; email?: string }[];
  pacienteId: string;
  onChangePacienteId: (id: string) => void;
  especialista: string;
  onChangeEspecialista: (val: string) => void;
  especialidad: string;
  onChangeEspecialidad: (val: string) => void;
  acompanantesIds: string[];
  onToggleAcompanante: (id: string) => void;
  usuarioActualId?: string;
}

export default function FormCitaMedica({
  miembros,
  pacienteId,
  onChangePacienteId,
  especialista,
  onChangeEspecialista,
  especialidad,
  onChangeEspecialidad,
  acompanantesIds,
  onToggleAcompanante,
  usuarioActualId,
}: FormCitaMedicaProps) {
  return (
    <div className="space-y-4 pt-1">
      {/* Paciente y Especialidad */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
              <User size={13} className="text-terracotta" />
              <span>Paciente del hogar *</span>
            </label>
            {usuarioActualId && pacienteId !== usuarioActualId && (
              <button
                type="button"
                onClick={() => onChangePacienteId(usuarioActualId)}
                className="text-[10.5px] font-semibold text-terracotta dark:text-olive hover:underline cursor-pointer"
              >
                Asignarme a mí (Tú)
              </button>
            )}
          </div>
          <select
            required
            value={pacienteId}
            onChange={(e) => onChangePacienteId(e.target.value)}
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
            <Stethoscope size={13} className="text-terracotta" />
            <span>Especialidad médica</span>
          </label>
          <input
            type="text"
            value={especialidad}
            onChange={(e) => onChangeEspecialidad(e.target.value)}
            placeholder="Ej. Odontología, Pediatría, Oftalmología..."
            className="w-full px-3 py-2 text-xs rounded-xl bg-tertiary border border-separator/80 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-terracotta"
          />
        </div>
      </div>

      {/* Nombre del Especialista o Doctor */}
      <div className="space-y-1.5">
        <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
          <FileText size={13} className="text-terracotta" />
          <span>Doctor o Profesional tratante (opcional)</span>
        </label>
        <input
          type="text"
          value={especialista}
          onChange={(e) => onChangeEspecialista(e.target.value)}
          placeholder="Ej. Dr. Mario Ruiz"
          className="w-full px-3 py-2 text-xs rounded-xl bg-tertiary border border-separator/80 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-terracotta"
        />
      </div>

      {/* Acompañantes del hogar */}
      {miembros.length > 1 && (
        <div className="space-y-2">
          <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
            <Users size={13} className="text-terracotta" />
            <span>Acompañantes del hogar</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {miembros
              .filter((m) => m.id !== pacienteId)
              .map((m) => {
                const isSelected = acompanantesIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    onClick={() => onToggleAcompanante(m.id)}
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
                    <span className="truncate">{m.nombre}</span>
                  </label>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
