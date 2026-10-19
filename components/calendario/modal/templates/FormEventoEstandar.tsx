'use client';

import { User, Mail, Users } from 'lucide-react';

interface FormEventoEstandarProps {
  miembros: { id: string; nombre: string; email?: string }[];
  organizadorId: string;
  onChangeOrganizadorId: (id: string) => void;
  correoContacto: string;
  onChangeCorreoContacto: (correo: string) => void;
  asistentesIds: string[];
  onToggleAsistente: (id: string) => void;
}

export default function FormEventoEstandar({
  miembros,
  organizadorId,
  onChangeOrganizadorId,
  correoContacto,
  onChangeCorreoContacto,
  asistentesIds,
  onToggleAsistente,
}: FormEventoEstandarProps) {
  return (
    <div className="space-y-4 pt-1">
      {/* Organizador y Contacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
            <User size={13} className="text-terracotta" />
            <span>Organizador responsable</span>
          </label>
          <select
            value={organizadorId}
            onChange={(e) => onChangeOrganizadorId(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-tertiary border border-separator/80 text-label-primary focus:outline-none focus:border-terracotta cursor-pointer"
          >
            {miembros.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
            <Mail size={13} className="text-terracotta" />
            <span>Correo de contacto (opcional)</span>
          </label>
          <input
            type="email"
            value={correoContacto}
            onChange={(e) => onChangeCorreoContacto(e.target.value)}
            placeholder="ejemplo@correo.com"
            className="w-full px-3 py-2 text-xs rounded-xl bg-tertiary border border-separator/80 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-terracotta"
          />
        </div>
      </div>

      {/* Asistentes del hogar */}
      {miembros.length > 1 && (
        <div className="space-y-2">
          <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
            <Users size={13} className="text-terracotta" />
            <span>Otros miembros participantes</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {miembros
              .filter((m) => m.id !== organizadorId)
              .map((m) => {
                const isSelected = asistentesIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    onClick={() => onToggleAsistente(m.id)}
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
