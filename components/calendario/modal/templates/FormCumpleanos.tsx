'use client';

import { HeartHandshake, Repeat, Users, User, Info, ShieldCheck } from 'lucide-react';
import AppleSwitch from '@/components/ui/AppleSwitch';

interface FormCumpleanosProps {
  miembros: { id: string; nombre: string; email?: string }[];
  recurrenciaAnual: boolean;
  onToggleRecurrenciaAnual: (val: boolean) => void;
  agasajadoTipo: 'hogar' | 'externo';
  onChangeAgasajadoTipo: (tipo: 'hogar' | 'externo') => void;
  agasajadoHogarId: string;
  onChangeAgasajadoHogarId: (id: string) => void;
  agasajadoExternoNombre: string;
  onChangeAgasajadoExternoNombre: (nombre: string) => void;
  agasajadoExternoContacto: string;
  onChangeAgasajadoExternoContacto: (contacto: string) => void;
  participantesCumpleIds: string[];
  onToggleParticipanteCumple: (id: string) => void;
}

export default function FormCumpleanos({
  miembros,
  recurrenciaAnual,
  onToggleRecurrenciaAnual,
  agasajadoTipo,
  onChangeAgasajadoTipo,
  agasajadoHogarId,
  onChangeAgasajadoHogarId,
  agasajadoExternoNombre,
  onChangeAgasajadoExternoNombre,
  agasajadoExternoContacto,
  onChangeAgasajadoExternoContacto,
  participantesCumpleIds,
  onToggleParticipanteCumple,
}: FormCumpleanosProps) {
  return (
    <div className="space-y-4 pt-1">
      {/* Switch de Recurrencia Anual */}
      <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-tertiary/40 rounded-2xl border border-separator/80">
        <div className="flex items-center gap-2">
          <Repeat size={14} className="text-terracotta" />
          <div>
            <span className="apple-footnote font-semibold text-label-primary block">Repetir cada año</span>
            <span className="apple-caption-2 text-label-tertiary">Agendar automáticamente en los años siguientes</span>
          </div>
        </div>
        <AppleSwitch
          checked={recurrenciaAnual}
          onChange={(checked) => onToggleRecurrenciaAnual(checked)}
        />
      </div>

      {/* Tipo de Agasajado (Hogar vs Externo) */}
      <div className="space-y-2">
        <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
          <HeartHandshake size={13} className="text-terracotta" />
          <span>¿Quién cumple años?</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onChangeAgasajadoTipo('hogar')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              agasajadoTipo === 'hogar'
                ? 'bg-terracotta text-white border-terracotta shadow-2xs'
                : 'bg-white/50 dark:bg-tertiary/40 border-separator/80 text-label-secondary hover:text-label-primary'
            }`}
          >
            <User size={13} />
            <span>Miembro del Hogar</span>
          </button>
          <button
            type="button"
            onClick={() => onChangeAgasajadoTipo('externo')}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              agasajadoTipo === 'externo'
                ? 'bg-terracotta text-white border-terracotta shadow-2xs'
                : 'bg-white/50 dark:bg-tertiary/40 border-separator/80 text-label-secondary hover:text-label-primary'
            }`}
          >
            <Users size={13} />
            <span>Familiar / Amigo Externo</span>
          </button>
        </div>
      </div>

      {/* Selector o Inputs según el tipo */}
      {agasajadoTipo === 'hogar' ? (
        <div className="space-y-2 animate-fade-in-up">
          <div className="space-y-1.5">
            <label className="apple-caption-1 text-label-secondary font-medium">Seleccionar habitante agasajado:</label>
            <select
              value={agasajadoHogarId}
              onChange={(e) => onChangeAgasajadoHogarId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-tertiary/70 border border-separator/80 text-label-primary focus:outline-none focus:border-terracotta cursor-pointer"
            >
              {miembros.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-2 bg-mint/10 dark:bg-mint/15 rounded-xl border border-mint/20 text-[11px] text-moss dark:text-mint">
            <ShieldCheck size={13} className="shrink-0" />
            <span>Habitante registrado del hogar. El título se sincroniza automáticamente con su perfil y calendario.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5 animate-fade-in-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="apple-caption-1 text-label-secondary font-medium">Nombre completo:</label>
              <input
                type="text"
                value={agasajadoExternoNombre}
                onChange={(e) => onChangeAgasajadoExternoNombre(e.target.value)}
                placeholder="Ej. Tía Gloria, Amigo Carlos..."
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-tertiary/70 border border-separator/80 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-terracotta"
              />
              <p className="text-[10px] text-label-tertiary">Sincroniza el título en tiempo real al escribir.</p>
            </div>
            <div className="space-y-1.5">
              <label className="apple-caption-1 text-label-secondary font-medium">Contacto / Teléfono (opcional):</label>
              <input
                type="text"
                value={agasajadoExternoContacto}
                onChange={(e) => onChangeAgasajadoExternoContacto(e.target.value)}
                placeholder="+57 300 123 4567"
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-tertiary/70 border border-separator/80 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-terracotta"
              />
            </div>
          </div>

          {/* Advertencia de Entidad Externa vs Tabla usuarios (AUD-03) */}
          <div className="p-3 bg-terracotta/10 dark:bg-terracotta/15 rounded-2xl border border-terracotta/25 flex items-start gap-2.5 text-xs text-label-secondary">
            <Info size={15} className="text-terracotta shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-label-primary">Contacto externo (Sin cuenta en el hogar)</p>
              <p className="text-[11px] text-label-secondary leading-relaxed">
                Este agasajado se registrará en la bitácora del evento como contacto externo. No se vinculará a la tabla de usuarios del hogar (<code className="text-[10px] bg-terracotta/15 px-1 py-0.5 rounded">usuarios</code>) ni dispondrá de credenciales de acceso o notificaciones en la app.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Participantes organizadores del festejo */}
      {miembros.length > 1 && (
        <div className="space-y-2">
          <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
            <Users size={13} className="text-terracotta" />
            <span>Participantes en la celebración</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {miembros
              .filter((m) => agasajadoTipo !== 'hogar' || m.id !== agasajadoHogarId)
              .map((m) => {
                const isSelected = participantesCumpleIds.includes(m.id);
                return (
                  <label
                    key={m.id}
                    onClick={() => onToggleParticipanteCumple(m.id)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                      isSelected
                        ? 'bg-terracotta/15 border-terracotta text-label-primary font-semibold shadow-3xs'
                        : 'bg-white/40 dark:bg-tertiary/40 border-separator/60 text-label-secondary hover:text-label-primary'
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
