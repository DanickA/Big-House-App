'use client';

import React from 'react';
import { X, CheckCircle2, ShieldAlert, Award, Sparkles } from 'lucide-react';

interface AuditComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuditComparisonModal({
  isOpen,
  onClose,
}: AuditComparisonModalProps) {
  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in select-none">
      <div className="relative glass-modal w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl border border-separator max-h-[90vh] flex flex-col">
        {/* Encabezado */}
        <div className="px-5 py-4 border-b border-separator flex items-center justify-between gap-3 bg-secondary">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-terracotta text-white flex items-center justify-center">
              <Award size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-label-primary">
                Auditoría Comparativa · Emil Kowalski & Break-UI
              </h2>
              <p className="text-[11px] text-label-tertiary">
                Estándares aplicados conforme a las skills del sistema
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="touch-target w-8 h-8 rounded-full bg-tertiary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer active:scale-95"
          >
            <X size={15} />
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="p-5 overflow-y-auto space-y-6 text-xs text-label-secondary select-text">
          {/* TABLA EMIL KOWALSKI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-label-primary font-bold text-sm">
              <Sparkles size={16} className="text-mint" />
              <span>1. Tabla de Hallazgos de Craft (Emil Kowalski Review Format)</span>
            </div>
            <div className="overflow-x-auto border border-separator rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-tertiary/70 border-b border-separator text-label-primary font-bold">
                    <th className="p-3">Antes (Modo Actual)</th>
                    <th className="p-3">Después (Modo Apple Craft)</th>
                    <th className="p-3">Razón y Fundamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator/60">
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-mono text-[11px] text-red-600 dark:text-red-400">
                      Gaveta estática sin drag-to-dismiss ni salida simétrica
                    </td>
                    <td className="p-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      Manipulación directa 1:1 + inercia de Apple (`0.998`) + translateY(100%)
                    </td>
                    <td className="p-3 text-[11px]">
                      Consistencia espacial (Estándar 7): lo que entra por abajo debe salir por abajo con fluidez física.
                    </td>
                  </tr>
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-mono text-[11px] text-red-600 dark:text-red-400">
                      Popover flotante con `animate-fade-in-up` desanclado
                    </td>
                    <td className="p-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      `transform-origin: top right`, escala elástica desde el botón (0.94 -&gt; 1)
                    </td>
                    <td className="p-3 text-[11px]">
                      Origen físico (Estándar 5): los menús deben brotar desde su elemento disparador, nunca desde el centro.
                    </td>
                  </tr>
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-mono text-[11px] text-red-600 dark:text-red-400">
                      Feedback táctil ausente o simulado sin soporte real
                    </td>
                    <td className="p-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      Feedback cinestésico visual instantáneo (`:active scale-97`, sin 300ms delay)
                    </td>
                    <td className="p-3 text-[11px]">
                      Honestidad de plataforma: en web (WebKit/iOS Safari) el Taptic Engine no está expuesto por seguridad; el feedback real en web se logra con respuesta visual inmediata en pointerdown.
                    </td>
                  </tr>
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-mono text-[11px] text-red-600 dark:text-red-400">
                      Interruptor estándar con perilla rígida
                    </td>
                    <td className="p-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      Perilla elástica con *squash &amp; stretch* (27px -&gt; 33px durante el toque)
                    </td>

                    <td className="p-3 text-[11px]">
                      Física canónica de Apple HIG: simula masa y compresión natural en la dirección del movimiento.
                    </td>
                  </tr>
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-mono text-[11px] text-red-600 dark:text-red-400">
                      `setState` por frame en animaciones
                    </td>
                    <td className="p-3 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                      Mutación directa a `ref.style.transform` solo en capa GPU
                    </td>
                    <td className="p-3 text-[11px]">
                      Regla de rendimiento (120fps budget): no re-renderizar React durante el arrastre físico.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLA BREAK-UI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-label-primary font-bold text-sm">
              <ShieldAlert size={16} className="text-terracotta" />
              <span>2. Tabla de Roturas y Salvaguardas (`break-ui`)</span>
            </div>
            <div className="overflow-x-auto border border-separator rounded-2xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-tertiary/70 border-b border-separator text-label-primary font-bold">
                    <th className="p-3">Severidad</th>
                    <th className="p-3">Campo</th>
                    <th className="p-3">Valor de Estrés</th>
                    <th className="p-3">Qué se rompía</th>
                    <th className="p-3">Solución Definitiva</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-separator/60">
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-bold text-red-600 dark:text-red-400">Broken</td>
                    <td className="p-3 font-mono text-[11px]">email</td>
                    <td className="p-3 text-[11px]">bartholomew.fitzgerald@northwind...</td>
                    <td className="p-3 text-[11px]">Desbordaba la celda y empujaba el botón de acción fuera de vista</td>
                    <td className="p-3 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      `min-w-0` en contenedor + `break-all`/`overflow-wrap: anywhere`
                    </td>
                  </tr>
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-bold text-amber-600 dark:text-amber-400">Ugly</td>
                    <td className="p-3 font-mono text-[11px]">avatar</td>
                    <td className="p-3 text-[11px]">Texto largo adyacente</td>
                    <td className="p-3 text-[11px]">El flexbox aplastaba el avatar circular convirtiéndolo en un óvalo 20x40</td>
                    <td className="p-3 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      `shrink-0` (`flex-shrink: 0`) explícito en avatar
                    </td>
                  </tr>
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-bold text-amber-600 dark:text-amber-400">Ugly</td>
                    <td className="p-3 font-mono text-[11px]">count</td>
                    <td className="p-3 text-[11px]">1 habitante</td>
                    <td className="p-3 text-[11px]">Mostraba "1 miembros" (violación gramatical)</td>
                    <td className="p-3 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      `formatMemberCount` con discriminación singular/plural
                    </td>
                  </tr>
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-bold text-amber-600 dark:text-amber-400">Ugly</td>
                    <td className="p-3 font-mono text-[11px]">monto</td>
                    <td className="p-3 text-[11px]">$148.950.000 COP</td>
                    <td className="p-3 text-[11px]">Cifras con ancho variable desalineaban las columnas en la lista</td>
                    <td className="p-3 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      `tabular-nums` con `Intl.NumberFormat('es-CO')`
                    </td>
                  </tr>
                  <tr className="hover:bg-tertiary/30">
                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">Fragile</td>
                    <td className="p-3 font-mono text-[11px]">nombre</td>
                    <td className="p-3 text-[11px]">"🌱 Jo" (emoji prefijo)</td>
                    <td className="p-3 text-[11px]">Extracción ingenua generaba caracteres corruptos</td>
                    <td className="p-3 text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                      `getSafeInitials` con regex Unicode para emojis
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-separator bg-tertiary/40 flex justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="touch-target px-4 py-2 rounded-xl bg-terracotta text-white font-bold text-xs cursor-pointer active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
