'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EventoUnificado } from '@/actions/eventos';
import {
  Plus,
  Sprout,
  Receipt,
  Repeat,
  Pencil,
  XCircle,
  Trash2,
  ArrowUpRight,
  ExternalLink,
  Info,
} from 'lucide-react';
import PullDownMenu from '@/components/ui/PullDownMenu';

interface AgendaDiaViewProps {
  eventosDelDia: EventoUnificado[];
  onAgregarEvento: () => void;
  onEditar: (ev: EventoUnificado) => void;
  onCancelarClick: (ev: EventoUnificado) => void;
  onEliminarClick: (id: string) => void;
}

export default function AgendaDiaView({
  eventosDelDia,
  onAgregarEvento,
  onEditar,
  onCancelarClick,
  onEliminarClick,
}: AgendaDiaViewProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="apple-footnote font-semibold text-label-primary">
          Actividades para este día:
        </span>
        <button
          type="button"
          onClick={onAgregarEvento}
          className="btn-apple-tinted px-3 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} strokeWidth={2.4} />
          <span>Agregar evento</span>
        </button>
      </div>

      <div className="space-y-2.5">
        {eventosDelDia.map((ev) => {
          const esCancelado = ev.estado === 'CANCELADO';
          const esSintetico = ev.origen !== 'MANUAL';
          const destinoSintetico = ev.origen === 'PLANTA' ? '/plantas' : '/finanzas';
          const etiquetaDestino = ev.origen === 'PLANTA' ? 'Jardín Botánico' : 'Finanzas';
          const accionDestino = ev.origen === 'PLANTA' ? 'Ver en Jardín' : 'Ver en Finanzas';

          return (
            <div
              key={ev.id}
              className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                esCancelado
                  ? 'bg-white/50 dark:bg-tertiary/30 border-gray-200/80 dark:border-separator opacity-60'
                  : 'bg-white/85 dark:bg-tertiary/60 border-white dark:border-white/10 shadow-2xs hover:border-separator/80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: ev.color }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="apple-headline font-semibold text-label-primary dark:text-label-primary truncate flex items-center gap-1.5">
                        {ev.origen === 'PLANTA' && <Sprout size={13} className="text-olive shrink-0" />}
                        {ev.origen === 'SERVICIO' && <Receipt size={13} className="text-terracotta shrink-0" />}
                        <span className={esCancelado ? 'line-through text-label-tertiary' : ''}>{ev.titulo}</span>
                      </p>
                      {esCancelado && (
                        <span className="text-[10px] uppercase font-bold bg-tertiary dark:bg-tertiary text-label-secondary px-1.5 py-0.5 rounded-md">
                          Cancelado
                        </span>
                      )}
                      {ev.recurrencia && (
                        <span className="text-[10px] font-bold bg-[#F3E8FF] dark:bg-purple-950/40 text-brand-deep dark:text-purple-300 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                          <Repeat size={10} />
                          <span>{ev.recurrencia}</span>
                        </span>
                      )}
                      {ev.origen === 'PLANTA' && (
                        <span className="text-[10px] font-semibold bg-olive/15 dark:bg-olive/25 text-olive dark:text-mint px-2 py-0.5 rounded-full border border-olive/30 flex items-center gap-1 shrink-0">
                          <Sprout size={10} />
                          <span>Jardín Botánico</span>
                        </span>
                      )}
                      {ev.origen === 'SERVICIO' && (
                        <span className="text-[10px] font-semibold bg-terracotta/15 dark:bg-terracotta/25 text-terracotta dark:text-[#E08A6F] px-2 py-0.5 rounded-full border border-terracotta/30 flex items-center gap-1 shrink-0">
                          <Receipt size={10} />
                          <span>Finanzas</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-label-secondary font-medium mt-0.5">
                      {ev.todo_el_dia
                        ? 'Todo el día'
                        : new Date(ev.fecha_inicio).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      {ev.ubicacion ? ` • ${ev.ubicacion}` : ''}
                      {ev.creador ? ` • Por ${ev.creador.nombre}` : ''}
                    </p>
                  </div>
                </div>

                {ev.origen === 'MANUAL' ? (
                  <PullDownMenu
                    ariaLabel={`Opciones de ${ev.titulo}`}
                    groups={[
                      {
                        items: [
                          {
                            id: 'editar',
                            label: 'Editar actividad...',
                            icon: Pencil,
                            onClick: () => onEditar(ev),
                          },
                          ...(!esCancelado
                            ? [
                                {
                                  id: 'cancelar',
                                  label: 'Cancelar actividad',
                                  icon: XCircle,
                                  onClick: () => onCancelarClick(ev),
                                },
                              ]
                            : []),
                        ],
                      },
                      {
                        items: [
                          {
                            id: 'eliminar',
                            label: 'Eliminar definitivamente',
                            icon: Trash2,
                            destructive: true,
                            onClick: () => onEliminarClick(ev.id),
                          },
                        ],
                      },
                    ]}
                  />
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Link
                      href={destinoSintetico}
                      className="btn-apple-tinted px-2.5 py-1 text-[11px] font-semibold flex items-center gap-1 transition-all hover:scale-102 cursor-pointer shadow-3xs"
                    >
                      <span>{accionDestino}</span>
                      <ArrowUpRight size={12} strokeWidth={2.4} />
                    </Link>
                    <PullDownMenu
                      ariaLabel={`Opciones de ${ev.titulo}`}
                      groups={[
                        {
                          items: [
                            {
                              id: `navegar-${ev.id}`,
                              label: `Ir a ${etiquetaDestino}...`,
                              icon: ExternalLink,
                              onClick: () => router.push(destinoSintetico),
                            },
                          ],
                        },
                      ]}
                    />
                  </div>
                )}
              </div>

              {/* Banner / Nota contextual para eventos sintéticos */}
              {esSintetico && (
                <div className="pt-2 border-t border-[#F0EAE1] dark:border-separator flex items-center justify-between text-[11px] text-label-secondary">
                  <div className="flex items-center gap-1.5">
                    <Info size={12} className={ev.origen === 'PLANTA' ? 'text-olive shrink-0' : 'text-terracotta shrink-0'} />
                    <span>
                      {ev.origen === 'PLANTA'
                        ? 'Generado automáticamente por el ciclo de riego.'
                        : ev.descripcion
                        ? `${ev.descripcion} • Fecha límite de pago.`
                        : 'Vencimiento programado en Finanzas.'}
                    </span>
                  </div>
                  <Link
                    href={destinoSintetico}
                    className={`font-semibold hover:underline flex items-center gap-0.5 shrink-0 ${
                      ev.origen === 'PLANTA' ? 'text-olive dark:text-mint' : 'text-terracotta dark:text-[#E08A6F]'
                    }`}
                  >
                    <span>{ev.origen === 'PLANTA' ? 'Ver planta' : 'Pagar'}</span>
                    <ArrowUpRight size={10} />
                  </Link>
                </div>
              )}

              {/* Vista previa de subtareas si existen */}
              {ev.subtareas && ev.subtareas.length > 0 && (
                <div className="pt-2 border-t border-[#F0EAE1] dark:border-separator pl-6 space-y-1">
                  {ev.subtareas.map((st) => (
                    <div key={st.id} className="text-xs text-[#524D45] dark:text-label-secondary flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-label-tertiary" />
                      <span className={st.completado ? 'line-through text-label-quaternary' : ''}>
                        {st.descripcion}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
