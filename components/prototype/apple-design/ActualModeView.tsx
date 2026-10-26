'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  MiembroPrototype,
  BreakUiMode,
  formatCOP,
} from './fixtures';
import { MoreHorizontal, Plus, X, AlertTriangle, User } from 'lucide-react';
import { useSimulatorPortal } from './SimulatorPortalContext';

interface ActualModeViewProps {
  members: MiembroPrototype[];
  breakMode: BreakUiMode;
  onSheetOpenChange?: (open: boolean) => void;
}

export default function ActualModeView({
  members,
  breakMode,
  onSheetOpenChange,
}: ActualModeViewProps) {
  const [mounted, setMounted] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState(true);

  const setSheetOpenState = (open: boolean) => {
    setIsSheetOpen(open);
    onSheetOpenChange?.(open);
  };

  const { portalContainer, isInsidePhone } = useSimulatorPortal();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pluralización defectuosa típica de código anterior (hardcodeada o ingenua)
  const memberLabel = `${members.length} miembros`; // En caso de 1 miembro mostrará "1 miembros"

  return (
    <div className="space-y-6">
      {/* Banner de explicación del Modo Actual */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3 text-xs">
        <AlertTriangle size={18} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-800 dark:text-amber-200">
            Modo A · Comportamiento Actual del Sistema
          </p>
          <p className="text-amber-700/90 dark:text-amber-300/80 leading-relaxed">
            Gaveta rígida que desaparece de golpe sin animación de salida, popover flotante no anclado (`animate-fade-in-up`), interruptores estáticos sin háptica, y vulnerabilidad a datos extralargos (el correo desplaza los botones y el avatar se deforma).
          </p>
        </div>
      </div>

      {/* Tarjeta de gestión de miembros (Versión Actual) */}
      <div className="glass-card rounded-3xl p-5 sm:p-6 space-y-5 border border-separator">
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-separator">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-label-primary">Habitantes del Hogar</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-tertiary text-label-secondary">
                {memberLabel}
              </span>
            </div>
            <p className="text-xs text-label-tertiary mt-0.5">
              Lista base sin protección estricta de flex-shrink ni anclaje
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Popover Actual: Desconectado del disparador */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="w-9 h-9 rounded-xl bg-tertiary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer"
                title="Opciones generales"
              >
                <MoreHorizontal size={16} />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-secondary border border-separator shadow-xl p-2 z-30 animate-fade-in-up">
                  <p className="px-3 py-1.5 text-[11px] font-bold text-label-tertiary uppercase">
                    Acciones de lista
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-label-primary hover:bg-tertiary"
                  >
                    Exportar reporte
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-label-primary hover:bg-tertiary"
                  >
                    Actualizar cuotas
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSheetOpenState(true)}
              className="px-3.5 py-2 rounded-xl bg-terracotta text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Nuevo habitante</span>
            </button>
          </div>
        </div>

        {/* Interruptor Actual (Sin squash & stretch ni hápticos) */}
        <div className="p-3.5 rounded-2xl bg-tertiary flex items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-label-primary block">
              Notificaciones de cobro automáticas
            </span>
            <span className="text-[11px] text-label-tertiary block mt-0.5">
              Control nativo con transición CSS estándar sin deformación de resorte
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={notificaciones}
            onClick={() => setNotificaciones(!notificaciones)}
            className={`w-[48px] h-[28px] rounded-full p-[2px] transition-colors cursor-pointer ${
              notificaciones ? 'bg-terracotta' : 'bg-gray-400'
            }`}
          >
            <div
              className={`w-[24px] h-[24px] rounded-full bg-white shadow-sm transition-transform ${
                notificaciones ? 'translate-x-[20px]' : 'translate-x-[0px]'
              }`}
            />
          </button>
        </div>

        {/* Lista de Miembros (Modo Actual sin salvaguardas Break-UI) */}
        {members.length === 0 ? (
          <div className="py-8 text-center text-xs text-label-tertiary">
            No hay registros.
          </div>
        ) : (
          <div className="divide-y divide-separator/60">
            {members.map((m) => (
              <div
                key={m.id}
                className="py-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  {/* Vulnerabilidad Break-UI: Sin flex-shrink: 0, el avatar se aplasta si el texto es muy largo */}
                  <div
                    className={`w-10 h-10 rounded-2xl ${
                      m.avatarBgColor || 'bg-terracotta text-white'
                    } flex items-center justify-center font-bold text-xs`}
                  >
                    {m.iniciales}
                  </div>
                  <div>
                    {/* Vulnerabilidad Break-UI: sin truncado ni overflow-wrap */}
                    <p className="text-xs font-bold text-label-primary">
                      {m.nombre}
                    </p>
                    <p className="text-[11px] text-label-secondary">
                      {m.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Vulnerabilidad Break-UI: cifras sin tabular-nums se desalinean */}
                  <span className="text-xs font-semibold text-label-primary whitespace-nowrap">
                    {formatCOP(m.cuotaCOP)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSheetOpenState(true)}
                    className="p-1.5 rounded-lg bg-tertiary text-label-secondary hover:text-label-primary"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* GAVETA ACTUAL: Desmontaje abrupto en React (Sin salida simétrica ni drag-to-dismiss) */}
      {isSheetOpen && mounted &&
        createPortal(
          <div
            className={
              isInsidePhone
                ? 'absolute inset-0 z-50 bg-black/50 flex items-end justify-center p-0'
                : 'fixed inset-0 z-[100000] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4'
            }
            onClick={() => setSheetOpenState(false)} // Cierra instantáneamente al clic de fondo
          >
            <div
              role="dialog"
              aria-modal="true"
              onClick={(e) => e.stopPropagation()}
              className="glass-modal w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] max-h-[85dvh] flex flex-col overflow-hidden animate-fade-in-up my-0 sm:my-auto"
            >
              {/* Manija decorativa inerte */}
              <div className="p-4 border-b border-separator flex items-center justify-between">
                <div>
                  <div className="w-10 h-1 bg-separator rounded-full mx-auto mb-2 sm:hidden" />
                  <h3 className="text-sm font-bold text-label-primary">Detalle de Habitante</h3>
                  <p className="text-[11px] text-label-tertiary">
                    Arrastrar hacia abajo NO funciona aquí.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSheetOpenState(false)}
                  className="w-8 h-8 rounded-full bg-tertiary flex items-center justify-center text-label-secondary"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs overflow-y-auto max-h-[55vh]">
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300">
                  <strong>Comportamiento observado:</strong> Si haces clic en la <strong>X</strong> o en el fondo oscuro, la gaveta se desmonta de golpe en React. No existe animación de salida simétrica ni manipulación táctil directa.
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-label-secondary">Nombre</label>
                  <input
                    readOnly
                    value="Aleksandra Wiśniewska-Kowalczyk"
                    className="w-full p-2.5 rounded-xl bg-tertiary border border-separator text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-label-secondary">Correo</label>
                  <input
                    readOnly
                    value="bartholomew.fitzgerald@northwind-industries-holdings.example.com"
                    className="w-full p-2.5 rounded-xl bg-tertiary border border-separator text-xs"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-separator bg-tertiary/40 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSheetOpenState(false)}
                  className="px-4 py-2 rounded-xl bg-terracotta text-white font-bold text-xs"
                >
                  Cerrar (Desmontaje instantáneo)
                </button>
              </div>
            </div>
          </div>,
          (isInsidePhone && portalContainer) || document.body
        )}
    </div>
  );
}
