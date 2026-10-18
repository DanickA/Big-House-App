'use client';

import { useState, useEffect } from 'react';
import {
  Pencil,
  Trash2,
  MapPin,
  Droplets,
  Loader2,
  Check,
  Sparkles,
  Scissors,
  Leaf,
  ChevronDown,
  Sun,
  CloudSun,
  Cloud,
  Undo2,
} from 'lucide-react';
import WaterProgressRing from '@/components/ui/WaterProgressRing';
import { registrarCuidado, getHistorialByPlanta, deshacerCuidado } from '@/actions/plantas';

export type Planta = {
  id: string;
  nombre_comun: string;
  especie: string | null;
  ubicacion: string;
  foto_url: string | null;
  diasRestantes?: number | null;
  frecuencia_dias?: number | null;
  nivel_luz?: string | null;
  nivel_agua?: string | null;
  estado_salud?: string | null;
  notas_cuidado?: string | null;
};

interface PlantaCardProps {
  planta: Planta;
  isExpanded?: boolean;
  onToggleExpand?: (planta: Planta) => void;
  onSelect?: (planta: Planta) => void;
  onEdit: (planta: Planta) => void;
  onDelete: (planta: Planta) => void;
  onOpenHistorial?: (planta: Planta) => void;
  onQuickWater?: (planta: Planta) => Promise<void> | void;
  onCareRegistered?: (mensaje: string) => void;
}

function LuzLabel({ nivel }: { nivel?: string | null }) {
  if (nivel === 'DIRECTA') {
    return (
      <span className="inline-flex items-center gap-1">
        <Sun size={13} className="text-khaki shrink-0" />
        <span>Sol directo</span>
      </span>
    );
  }
  if (nivel === 'SOMBRA') {
    return (
      <span className="inline-flex items-center gap-1">
        <Cloud size={13} className="text-label-tertiary shrink-0" />
        <span>Sombra</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1">
      <CloudSun size={13} className="text-khaki shrink-0" />
      <span>Luz indirecta</span>
    </span>
  );
}

function AguaLabel({ nivel }: { nivel?: string | null }) {
  const texto =
    nivel === 'ABUNDANTE'
      ? 'Agua abundante'
      : nivel === 'POCA'
      ? 'Poca agua'
      : 'Agua moderada';
  return (
    <span className="inline-flex items-center gap-1">
      <Droplets size={13} className="text-mint shrink-0" />
      <span>{texto}</span>
    </span>
  );
}

export default function PlantaCard({
  planta,
  isExpanded: controlledExpanded,
  onToggleExpand,
  onSelect,
  onEdit,
  onDelete,
  onOpenHistorial,
  onQuickWater,
  onCareRegistered,
}: PlantaCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;

  const [inlineTab, setInlineTab] = useState<'cuidar' | 'bitacora'>('cuidar');
  const [regando, setRegando] = useState(false);
  const [regadoReciente, setRegadoReciente] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const urgent = (planta.diasRestantes ?? 0) <= 0;

  async function cargarHistorial() {
    setCargandoHistorial(true);
    try {
      const res = await getHistorialByPlanta(planta.id);
      if (res && res.success && res.data) {
        setHistorial(res.data as any[]);
      }
    } finally {
      setCargandoHistorial(false);
    }
  }

  useEffect(() => {
    if (isExpanded && inlineTab === 'bitacora') {
      cargarHistorial();
    }
  }, [isExpanded, inlineTab, planta.id]);

  function handleToggleCard() {
    if (onToggleExpand) {
      onToggleExpand(planta);
    } else {
      setInternalExpanded((prev) => !prev);
    }
    if (onSelect && !isExpanded) {
      onSelect(planta);
    }
  }

  async function handleQuickWater(e?: React.MouseEvent) {
    if (e) e.stopPropagation();
    if (regando) return;

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 40, 20]);
      } catch {}
    }

    setRegando(true);
    try {
      if (onQuickWater) {
        await onQuickWater(planta);
      } else {
        await registrarCuidado(planta.id, 'RIEGO');
      }
      setRegadoReciente(true);
      setTimeout(() => setRegadoReciente(false), 2000);
      if (isExpanded && inlineTab === 'bitacora') {
        await cargarHistorial();
      }
    } finally {
      setRegando(false);
    }
  }

  async function handleInlineCare(tipoTarea: 'RIEGO' | 'ABONO' | 'PODA' | 'LIMPIEZA') {
    if (tipoTarea === 'RIEGO') {
      await handleQuickWater();
      return;
    }
    if (procesandoAccion) return;
    setProcesandoAccion(true);
    try {
      const res = await registrarCuidado(planta.id, tipoTarea);
      if (res?.success) {
        onCareRegistered?.(`¡${tipoTarea} registrado en ${planta.nombre_comun}!`);
        if (inlineTab === 'bitacora') {
          await cargarHistorial();
        }
      }
    } finally {
      setProcesandoAccion(false);
    }
  }

  async function handleDeshacerItemHistorial(historialId: string) {
    if (procesandoAccion) return;
    setProcesandoAccion(true);
    try {
      const res = await deshacerCuidado(historialId);
      if (res?.success) {
        onCareRegistered?.('Registro revertido de la bitácora');
        await cargarHistorial();
      }
    } finally {
      setProcesandoAccion(false);
    }
  }

  return (
    <div
      className={`glass-card rounded-[1.75rem] border transition-all duration-300 overflow-hidden ${
        isExpanded
          ? 'border-mint/60 shadow-lg ring-1 ring-mint/25'
          : regadoReciente
          ? 'border-mint ring-2 ring-mint/40'
          : urgent
          ? 'border-terracotta/45 bg-[#ce9b8c]/10 dark:bg-terracotta/10 shadow-xs'
          : 'border-separator/80 hover:shadow-md'
      }`}
    >
      {/* Fila Principal de la Cápsula (Cero duplicidad: Foto + Identidad + Anillo Único) */}
      <div
        onClick={handleToggleCard}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`Opciones de la planta ${planta.nombre_comun}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleToggleCard();
          }
        }}
        className="p-3 sm:p-3.5 flex items-center justify-between gap-3.5 cursor-pointer"
      >
        {/* 1. Fotografía cuadrada con bordes orgánicos */}
        <div className="relative w-18 h-18 rounded-2xl overflow-hidden bg-[#c7e1d7]/40 shrink-0 shadow-2xs">
          {planta.foto_url ? (
            <img
              src={planta.foto_url}
              alt={planta.nombre_comun}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-bold text-xl text-mint">
              {planta.nombre_comun.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>

        {/* 2. Identidad (Nombre + Ubicación) */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="apple-headline font-bold text-label-primary truncate">
              {planta.nombre_comun}
            </h2>
            {planta.estado_salud === 'EN_OBSERVACION' && (
              <span
                className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                title="En observación"
              />
            )}
          </div>
          <p className="apple-caption-1 text-label-secondary flex items-center gap-1 truncate">
            <MapPin size={12} className="text-mint shrink-0" />
            <span className="truncate">{planta.ubicacion}</span>
          </p>
        </div>

        {/* 3. Anillo Único de Estado y Riego Rápido en Zona del Pulgar */}
        <div
          className="shrink-0 flex items-center gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleQuickWater}
            disabled={regando}
            title={`Regar ahora en 1 toque: ${planta.nombre_comun}`}
            aria-label={`Regar ahora a ${planta.nombre_comun}`}
            className="rounded-full transition-transform active:scale-90 hover:scale-105 cursor-pointer"
          >
            {regando ? (
              <div className="w-11 h-11 rounded-full bg-mint/90 flex items-center justify-center text-white">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : regadoReciente ? (
              <div className="w-11 h-11 rounded-full bg-mint text-white flex items-center justify-center shadow-sm">
                <Check size={18} strokeWidth={2.8} />
              </div>
            ) : (
              <WaterProgressRing
                diasRestantes={planta.diasRestantes}
                frecuenciaDias={planta.frecuencia_dias}
                size={46}
                strokeWidth={3.5}
                darkText={true}
              />
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleCard}
            aria-label={`Desplegar detalles de ${planta.nombre_comun}`}
            className="p-1 text-label-tertiary hover:text-label-primary transition-colors cursor-pointer"
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-300 ${
                isExpanded ? 'rotate-180 text-mint' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Acordeón Desplegable In-Place (Divulgación Progresiva: sólo datos nuevos) */}
      {isExpanded && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="px-4 pb-4 pt-2.5 border-t border-separator/60 bg-white/40 dark:bg-tertiary/30 space-y-3 animate-fade-in-up"
        >
          {/* Barra superior del acordeón: Cuidar | Bitácora + Editar / Eliminar */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex p-0.5 rounded-xl bg-secondary/80 border border-separator text-xs">
              <button
                type="button"
                onClick={() => setInlineTab('cuidar')}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  inlineTab === 'cuidar'
                    ? 'bg-white dark:bg-tertiary text-label-primary shadow-2xs'
                    : 'text-label-secondary'
                }`}
              >
                Cuidar
              </button>
              <button
                type="button"
                onClick={() => {
                  setInlineTab('bitacora');
                  onOpenHistorial?.(planta);
                }}
                className={`px-3 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  inlineTab === 'bitacora'
                    ? 'bg-white dark:bg-tertiary text-label-primary shadow-2xs'
                    : 'text-label-secondary'
                }`}
              >
                Bitácora
              </button>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(planta)}
                aria-label="Editar planta..."
                title="Editar planta..."
                className="p-1.5 rounded-lg text-label-secondary hover:text-label-primary hover:bg-secondary/80 transition cursor-pointer"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(planta)}
                aria-label="Eliminar planta"
                title="Eliminar planta"
                className="p-1.5 rounded-lg text-label-secondary hover:text-terracotta hover:bg-terracotta/10 transition cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          {inlineTab === 'cuidar' ? (
            <div className="space-y-3">
              {/* Guía de Cuidado en 1 línea limpia */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-label-secondary">
                <LuzLabel nivel={planta.nivel_luz} />
                <span>·</span>
                <AguaLabel nivel={planta.nivel_agua} />
                {planta.especie && (
                  <>
                    <span>·</span>
                    <span className="italic">{planta.especie}</span>
                  </>
                )}
              </div>

              {planta.notas_cuidado && (
                <p className="text-xs text-label-secondary leading-relaxed">
                  {planta.notas_cuidado}
                </p>
              )}

              {/* 4 Botones de Acción en 1 Toque */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    label: 'Regar',
                    icon: Droplets,
                    tipo: 'RIEGO' as const,
                    cls: 'bg-mint/20 text-mint border-mint/40 font-bold',
                  },
                  {
                    label: 'Abonar',
                    icon: Sparkles,
                    tipo: 'ABONO' as const,
                    cls: 'bg-khaki/20 text-label-primary border-khaki/40 font-semibold',
                  },
                  {
                    label: 'Podar',
                    icon: Scissors,
                    tipo: 'PODA' as const,
                    cls: 'bg-[#ce9b8c]/20 text-terracotta border-terracotta/30 font-semibold',
                  },
                  {
                    label: 'Limpiar',
                    icon: Leaf,
                    tipo: 'LIMPIEZA' as const,
                    cls: 'bg-secondary text-label-primary border-separator font-semibold',
                  },
                ].map((btn) => {
                  const Icon = btn.icon;
                  return (
                    <button
                      key={btn.tipo}
                      type="button"
                      disabled={procesandoAccion || regando}
                      onClick={() => handleInlineCare(btn.tipo)}
                      className={`py-2 px-1 rounded-xl border ${btn.cls} flex flex-col items-center justify-center gap-1 text-[11px] active:scale-95 transition cursor-pointer disabled:opacity-50`}
                    >
                      <Icon size={16} />
                      <span>{btn.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {cargandoHistorial ? (
                <p className="text-xs text-label-secondary py-3 text-center animate-pulse">
                  Cargando bitácora...
                </p>
              ) : historial.length === 0 ? (
                <p className="text-xs text-label-secondary py-3 text-center">
                  Sin registros recientes en la bitácora.
                </p>
              ) : (
                historial.slice(0, 6).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-secondary/70 border border-separator/60 text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-label-primary">
                        {item.tareas_cuidado?.tipo_tarea}{' '}
                        <span className="font-normal text-label-secondary">
                          · {item.usuarios?.nombre}
                        </span>
                      </span>
                      {item.observaciones && (
                        <p className="text-[11px] text-label-secondary truncate italic">
                          {item.observaciones}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] text-label-secondary tabular-nums">
                        {new Date(item.fecha_realizada).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeshacerItemHistorial(item.id)}
                        title="Revertir este registro"
                        aria-label="Revertir registro"
                        className="p-1 rounded-lg hover:bg-terracotta/15 text-label-tertiary hover:text-terracotta transition cursor-pointer"
                      >
                        <Undo2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}