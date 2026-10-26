'use client';

import React, { useState } from 'react';
import {
  MiembroPrototype,
  BreakUiMode,
  formatMemberCount,
  formatCOP,
  getSafeInitials,
} from './fixtures';
import FluidBottomSheet from './FluidBottomSheet';
import AnchoredPopover from './AnchoredPopover';
import SquashStretchSwitch from './SquashStretchSwitch';
import {
  Sparkles,
  Plus,
  MoreHorizontal,
  Mail,
  User,
  ShieldCheck,
  Download,
  RefreshCw,
  Inbox,
  ArrowDownCircle,
} from 'lucide-react';

interface AppleCraftModeViewProps {
  members: MiembroPrototype[];
  breakMode: BreakUiMode;
  onSheetOpenChange?: (open: boolean) => void;
}

export default function AppleCraftModeView({
  members,
  breakMode,
  onSheetOpenChange,
}: AppleCraftModeViewProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MiembroPrototype | null>(null);
  const [squashStretch, setSquashStretch] = useState(true);
  const [springPhysics, setSpringPhysics] = useState(true);

  const setSheetOpenState = (open: boolean) => {
    setIsSheetOpen(open);
    onSheetOpenChange?.(open);
  };

  // Pluralización canónica mediante helper robusto
  const countLabel = formatMemberCount(members.length);

  // Total presupuestado con alineación tabular
  const totalCOP = members.reduce((acc, m) => acc + m.cuotaCOP, 0);

  const handleOpenSheet = (member?: MiembroPrototype) => {
    setSelectedMember(member || null);
    setSheetOpenState(true);
  };

  const handleAction = (label: string) => {
    alert(`Acción ejecutada con estándares Apple: ${label}`);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Craft & Estándares Apple */}
      <div className="p-4 rounded-2xl bg-mint/10 border border-mint/30 flex items-start gap-3 text-xs">
        <Sparkles size={18} className="text-mint shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-label-primary">
            Modo B · Estándares Apple HIG + Emil Kowalski Craft
          </p>
          <p className="text-label-secondary leading-relaxed">
            Gaveta con manipulación directa 1:1 (`setPointerCapture`), inercia proyectada (`project(velocity, 0.998)`), resistencia elástica (*rubber-banding*), salida simétrica asegurada, popover con origen anclado, switch con *squash & stretch* y prevención total de roturas (`break-ui`).
          </p>
        </div>
      </div>

      {/* Tarjeta de gestión de miembros (Modo Apple Craft) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-5 border border-separator shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-separator">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="apple-title-3 font-bold text-label-primary">Habitantes del Hogar</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-mint/15 text-mint border border-mint/25">
                {countLabel}
              </span>
            </div>
            <p className="apple-footnote text-label-tertiary mt-0.5">
              Protección de celdas con flex-shrink: 0, overflow-wrap y cifras con tabular-nums
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Popover Anclado Apple HIG */}
            <AnchoredPopover
              trigger={({ isOpen, toggle }) => (
                <button
                  type="button"
                  onClick={toggle}
                  aria-expanded={isOpen}
                  aria-label="Opciones avanzadas"
                  className="touch-target w-9 h-9 rounded-xl bg-tertiary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer active:scale-95 transition-transform"
                >
                  <MoreHorizontal size={16} />
                </button>
              )}
            >
              {({ close }) => (
                <div className="py-1 space-y-1 text-xs">
                  <p className="px-3 py-1 text-[10px] font-bold text-label-tertiary uppercase tracking-wider">
                    Herramientas de Craft
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      handleAction('Exportar informe');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-label-primary hover:bg-tertiary flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <Download size={14} className="text-terracotta" />
                    <span>Exportar informe PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      handleAction('Recalcular cuotas');
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-label-primary hover:bg-tertiary flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <RefreshCw size={14} className="text-mint" />
                    <span>Recalcular cuotas con amortización</span>
                  </button>
                </div>
              )}
            </AnchoredPopover>

            {/* Botón principal con respuesta de presión táctil */}
            <button
              type="button"
              onClick={() => handleOpenSheet()}
              className="touch-target px-4 py-2 rounded-xl bg-terracotta text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-terracotta-hover active:scale-97 cursor-pointer transition-transform"
            >
              <Plus size={15} />
              <span>Nuevo habitante</span>
            </button>
          </div>
        </div>

        {/* Interruptores con Física y Estándares Apple */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SquashStretchSwitch
            checked={squashStretch}
            onChange={setSquashStretch}
            label="Física Squash &amp; Stretch"
            description="La perilla se deforma elásticamente (27px -> 33px) en la pulsación"
          />
          <SquashStretchSwitch
            checked={springPhysics}
            onChange={setSpringPhysics}
            label="Manipulación Directa 1:1"
            description="Resorte inercial continuo con resistencia elástica (rubber-banding)"
          />
        </div>


        {/* Resumen presupuestario con tabular-nums */}
        {members.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-tertiary/70 border border-separator flex items-center justify-between text-xs">
            <span className="font-semibold text-label-secondary">
              Total proyectado ({countLabel}):
            </span>
            <span className="font-bold text-sm text-label-primary tabular-nums tracking-tight">
              {formatCOP(totalCOP)}
            </span>
          </div>
        )}

        {/* Lista de Miembros con salvaguardas totales Break-UI */}
        {members.length === 0 ? (
          <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-separator space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-tertiary text-label-tertiary flex items-center justify-center mx-auto">
              <Inbox size={22} />
            </div>
            <div>
              <p className="apple-subhead font-bold text-label-primary">
                No hay habitantes registrados
              </p>
              <p className="apple-footnote text-label-tertiary max-w-sm mx-auto mt-1">
                Comienza agregando el primer perfil para gestionar accesos, tareas de aseo y distribución de cuentas.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleOpenSheet()}
              className="touch-target px-4 py-2 rounded-xl bg-tertiary border border-separator text-label-primary font-bold text-xs inline-flex items-center gap-1.5 hover:bg-tertiary-hover active:scale-97 cursor-pointer transition-transform"
            >
              <Plus size={14} />
              <span>Registrar primer habitante</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-separator/60">
            {members.map((m) => {
              const initials = getSafeInitials(m.nombre);
              return (
                <div
                  key={m.id}
                  className="py-3.5 flex items-center justify-between gap-3 group transition-colors"
                >
                  {/* Contenedor flexible con min-w-0 para evitar desbordamientos */}
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* AVATAR con flex-shrink: 0 para evitar aplastamiento o deformación oval */}
                    <div
                      className={`w-10 h-10 rounded-2xl ${
                        m.avatarBgColor || 'bg-terracotta text-white'
                      } flex items-center justify-center font-bold text-xs shrink-0 shadow-xs`}
                    >
                      {initials}
                    </div>

                    {/* Información textual con overflow-wrap: anywhere y min-w-0 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-xs font-bold text-label-primary leading-tight">
                          {m.nombre}
                        </p>
                        {m.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-tertiary text-label-secondary border border-separator/70 shrink-0">
                            {m.badge}
                          </span>
                        )}
                      </div>

                      {/* Correo continuo: wrap inteligente en vez de desbordar */}
                      <p className="text-[11px] text-label-tertiary leading-snug [overflow-wrap:anywhere] break-words mt-0.5">
                        {m.email}
                      </p>


                      {/* Rol opcional: si no existe, no deja guion huérfano */}
                      {m.rol && (
                        <p className="text-[10px] font-medium text-label-quaternary mt-0.5 truncate">
                          {m.rol}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Acciones y cuota con cifras tabulares estables */}
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs font-bold text-label-primary tabular-nums tracking-tight">
                      {formatCOP(m.cuotaCOP)}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleOpenSheet(m)}
                      aria-label={`Detalles de ${m.nombre}`}
                      className="touch-target w-8 h-8 rounded-xl bg-tertiary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary active:scale-95 cursor-pointer transition-transform shrink-0"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GAVETA INFERIOR FLUIDA (Modo B · Apple HIG) */}
      <FluidBottomSheet
        isOpen={isSheetOpen}
        onClose={() => setSheetOpenState(false)}
        title={selectedMember ? `Habitante: ${selectedMember.nombre}` : 'Nuevo habitante'}
        subtitle="Arrastra hacia abajo para descartar (Física inercial 1:1)"
        footer={
          <div className="flex items-center justify-between gap-3">
            <span className="apple-footnote text-label-tertiary flex items-center gap-1.5">
              <Sparkles size={13} className="text-mint" />
              <span>Manipulación física 1:1 activa</span>
            </span>
            <button
              type="button"
              onClick={() => setSheetOpenState(false)}
              className="touch-target px-5 py-2.5 rounded-xl bg-terracotta text-white font-bold text-xs shadow-sm active:scale-97 cursor-pointer transition-transform"
            >
              Guardar cambios
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-2xl bg-mint/15 border border-mint/30 flex items-start gap-2.5 text-xs text-label-secondary">
            <ArrowDownCircle size={17} className="text-mint shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-label-primary">Pruébalo en vivo con tu dedo o mouse:</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[11px]">
                <li><strong>Arrastre 1:1:</strong> La gaveta sigue tu puntero con cero latencia sin setState.</li>
                <li><strong>Rubber-band:</strong> Arrastra hacia arriba y siente la resistencia elástica.</li>
                <li><strong>Inercia:</strong> Un flick rápido hacia abajo la descarta automáticamente.</li>
                <li><strong>Salida simétrica:</strong> Si haces clic en la X o en el fondo, desciende fluidamente.</li>
              </ul>
            </div>
          </div>

          <div key={selectedMember ? selectedMember.id : 'new-habitante'} className="space-y-3">

            <div className="space-y-1.5">
              <label className="block apple-caption-1 font-bold text-label-secondary">
                Nombre completo
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-tertiary border border-separator">
                <User size={15} className="text-terracotta shrink-0" />
                <input
                  type="text"
                  defaultValue={selectedMember ? selectedMember.nombre : ''}
                  className="w-full bg-transparent text-xs text-label-primary outline-none"
                  placeholder="Nombre y apellidos"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block apple-caption-1 font-bold text-label-secondary">
                Correo electrónico institucional o personal
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-tertiary border border-separator">
                <Mail size={15} className="text-terracotta shrink-0" />
                <input
                  type="email"
                  defaultValue={selectedMember ? selectedMember.email : ''}
                  className="w-full bg-transparent text-xs text-label-primary outline-none"
                  placeholder="ejemplo@dominio.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block apple-caption-1 font-bold text-label-secondary">
                Cuota mensual asignada (COP)
              </label>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-tertiary border border-separator">
                <ShieldCheck size={15} className="text-mint shrink-0" />
                <input
                  type="text"
                  defaultValue={selectedMember ? String(selectedMember.cuotaCOP) : '0'}
                  className="w-full bg-transparent text-xs text-label-primary tabular-nums font-semibold outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </FluidBottomSheet>

    </div>
  );
}
