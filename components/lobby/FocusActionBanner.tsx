'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Droplets, CheckCircle2, ChevronRight, ChevronLeft, Sparkles, Loader2, Undo2, AlertCircle } from 'lucide-react';
import { registrarCuidado, deshacerCuidado } from '@/actions/plantas';
import WaterProgressRing from '@/components/ui/WaterProgressRing';

export interface UrgentPlant {
  id: string;
  nombre_comun: string;
  ubicacion?: string;
  foto_url?: string | null;
  diasRestantes: number | null;
  frecuencia_dias: number;
  requiereRiego: boolean;
}

interface FocusActionBannerProps {
  initialPlantasUrgentes: UrgentPlant[];
  cuentasVencidasCount?: number;
}

export default function FocusActionBanner({
  initialPlantasUrgentes,
  cuentasVencidasCount = 0,
}: FocusActionBannerProps) {
  const [plantasUrgentes, setPlantasUrgentes] = useState<UrgentPlant[]>(initialPlantasUrgentes);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);
  const [regadasIds, setRegadasIds] = useState<Record<string, { historialId: string; nombre: string }>>({});
  const [undoSuccessMessage, setUndoSuccessMessage] = useState<string | null>(null);

  // Trigger feedback háptico si el dispositivo lo soporta
  const triggerHaptic = () => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([20, 50, 20]);
      } catch {
        // Ignorar si el navegador bloquea vibración sin interacción
      }
    }
  };

  const currentPlant = plantasUrgentes[currentIndex];

  const handleQuickWater = async (planta: UrgentPlant) => {
    if (procesandoId) return;
    triggerHaptic();
    setProcesandoId(planta.id);

    // Mutación optimista en 0ms: registramos estado localmente
    const fakeHistorialId = 'temp-' + Date.now();
    setRegadasIds((prev) => ({
      ...prev,
      [planta.id]: { historialId: fakeHistorialId, nombre: planta.nombre_comun },
    }));

    try {
      const res = await registrarCuidado(planta.id, 'RIEGO');
      if (res.success && res.data) {
        const meta = (res as any).meta;
        const realHistorialId = meta?.historialId || res.data.id;
        setRegadasIds((prev) => ({
          ...prev,
          [planta.id]: { historialId: realHistorialId, nombre: planta.nombre_comun },
        }));

        // Transcurridos 1.5s, remover suavemente de la cola urgente
        setTimeout(() => {
          setPlantasUrgentes((prev) => {
            const nextList = prev.filter((p) => p.id !== planta.id);
            if (currentIndex >= nextList.length) {
              setCurrentIndex(Math.max(0, nextList.length - 1));
            }
            return nextList;
          });
        }, 1500);
      } else {
        // Rollback si falló
        setRegadasIds((prev) => {
          const copy = { ...prev };
          delete copy[planta.id];
          return copy;
        });
      }
    } catch {
      // Rollback
      setRegadasIds((prev) => {
        const copy = { ...prev };
        delete copy[planta.id];
        return copy;
      });
    } finally {
      setProcesandoId(null);
    }
  };

  const handleUndo = async (plantaId: string) => {
    const regada = regadasIds[plantaId];
    if (!regada) return;

    triggerHaptic();
    try {
      if (!regada.historialId.startsWith('temp-')) {
        await deshacerCuidado(regada.historialId);
      }
      setRegadasIds((prev) => {
        const copy = { ...prev };
        delete copy[plantaId];
        return copy;
      });
      setUndoSuccessMessage(`Riego de ${regada.nombre} deshecho`);
      setTimeout(() => setUndoSuccessMessage(null), 3000);
    } catch {
      // Ignorar error al deshacer
    }
  };

  // Si no hay plantas pendientes de riego ni cuentas vencidas
  if (plantasUrgentes.length === 0 && cuentasVencidasCount === 0) {
    return (
      <div className="glass-card bg-secondary/80 border border-separator rounded-2xl p-4 flex items-center justify-between gap-3 shadow-xs animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-mint/15 text-mint border border-mint/30 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} strokeWidth={2.4} />
          </div>
          <div>
            <p className="apple-subhead font-semibold text-label-primary leading-tight">
              Todo al día en el hogar
            </p>
            <p className="apple-caption-1 text-label-secondary font-normal">
              Sin acciones urgentes pendientes por resolver hoy
            </p>
          </div>
        </div>
        <span className="apple-caption-2 px-2.5 py-1 rounded-full bg-mint/15 text-mint font-semibold border border-mint/25">
          100% al día
        </span>
      </div>
    );
  }

  // Si no hay plantas pendientes de riego pero SÍ hay cuentas por pagar o vencidas
  if (plantasUrgentes.length === 0 && cuentasVencidasCount > 0) {
    return (
      <div className="glass-card bg-gradient-to-r from-terracotta/15 via-secondary to-secondary border border-terracotta/35 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md animate-fade-in-up">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-terracotta/20 border border-terracotta/35 text-terracotta flex items-center justify-center shrink-0 shadow-2xs">
            <AlertCircle size={22} strokeWidth={2.2} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="apple-caption-2 px-2 py-0.5 rounded-md bg-terracotta/20 text-terracotta font-bold border border-terracotta/30 flex items-center gap-1 shrink-0 animate-pulse">
                <span>Atención requerida</span>
              </span>
            </div>
            <h3 className="apple-headline font-semibold text-label-primary tracking-tight pt-0.5">
              {cuentasVencidasCount === 1 ? '1 servicio pendiente de pago' : `${cuentasVencidasCount} servicios pendientes de pago`}
            </h3>
            <p className="apple-caption-1 text-label-secondary font-normal">
              Revisa los servicios con fecha de corte próxima o vencida para mantener el hogar al día.
            </p>
          </div>
        </div>

        <Link
          href="/finanzas"
          className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-terracotta hover:bg-terracotta-hover active:scale-95 transition-all text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm self-end sm:self-auto shrink-0 w-full sm:w-auto"
        >
          <span>Revisar cuentas</span>
          <ChevronRight size={15} />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2 animate-fade-in-up">
      {undoSuccessMessage && (
        <div className="apple-caption-1 px-3 py-1.5 rounded-xl bg-tertiary text-label-secondary border border-separator flex items-center gap-2">
          <CheckCircle2 size={13} className="text-mint" />
          <span>{undoSuccessMessage}</span>
        </div>
      )}

      {cuentasVencidasCount > 0 && (
        <div className="apple-caption-1 px-3.5 py-2 rounded-2xl bg-terracotta/10 border border-terracotta/25 text-terracotta flex items-center justify-between gap-2 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle size={14} className="shrink-0" />
            <span className="truncate font-semibold">
              {cuentasVencidasCount === 1 ? '1 servicio pendiente de pago' : `${cuentasVencidasCount} servicios pendientes de pago`}
            </span>
          </div>
          <Link href="/finanzas" className="font-bold underline text-xs shrink-0 flex items-center gap-0.5">
            <span>Ver cuentas</span>
            <ChevronRight size={12} />
          </Link>
        </div>
      )}

      {/* Focus Action Banner Card */}
      {currentPlant && (
        <div className="relative glass-card bg-gradient-to-r from-mint/15 via-secondary to-secondary border border-mint/40 dark:border-mint/30 rounded-3xl p-4 sm:p-5 shadow-md overflow-hidden">
          {/* Luz ambiental decorativa */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-radial from-mint/20 to-transparent pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Lado izquierdo: Identificación y estado */}
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="relative shrink-0">
                {currentPlant.foto_url ? (
                  <img
                    src={currentPlant.foto_url}
                    alt={currentPlant.nombre_comun}
                    className="w-13 h-13 rounded-2xl object-cover border border-mint/30 shadow-2xs"
                  />
                ) : (
                  <div className="w-13 h-13 rounded-2xl bg-mint/20 border border-mint/30 text-mint flex items-center justify-center font-bold text-lg shadow-2xs">
                    <Droplets size={24} strokeWidth={2.2} />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1">
                  <WaterProgressRing
                    diasRestantes={regadasIds[currentPlant.id] ? currentPlant.frecuencia_dias : currentPlant.diasRestantes}
                    frecuenciaDias={currentPlant.frecuencia_dias}
                    size={24}
                    strokeWidth={2.5}
                    darkText={true}
                  />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="apple-caption-2 px-2 py-0.5 rounded-md bg-terracotta/15 text-terracotta font-bold border border-terracotta/25 flex items-center gap-1 shrink-0 animate-pulse">
                    <Droplets size={10} />
                    <span>Riego Hoy</span>
                  </span>
                  {plantasUrgentes.length > 1 && (
                    <span className="apple-caption-2 text-label-tertiary font-medium">
                      {currentIndex + 1} de {plantasUrgentes.length}
                    </span>
                  )}
                </div>
                <h3 className="apple-headline font-semibold text-label-primary tracking-tight truncate pt-0.5">
                  {currentPlant.nombre_comun}
                </h3>
                <p className="apple-caption-1 text-label-secondary font-normal truncate">
                  {currentPlant.ubicacion ? `Ubicada en ${currentPlant.ubicacion}` : 'Requiere agua el día de hoy'}
                </p>
              </div>
            </div>

            {/* Lado derecho: Acción Directa en 1 Toque y Carrusel */}
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 w-full sm:w-auto">
              {plantasUrgentes.length > 1 && (
                <div className="flex items-center gap-1 mr-1">
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : plantasUrgentes.length - 1))}
                    aria-label="Planta anterior"
                    className="touch-target w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-tertiary hover:bg-tertiary-hover text-label-secondary flex items-center justify-center cursor-pointer active:scale-90 transition"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentIndex((prev) => (prev < plantasUrgentes.length - 1 ? prev + 1 : 0))}
                    aria-label="Planta siguiente"
                    className="touch-target w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-tertiary hover:bg-tertiary-hover text-label-secondary flex items-center justify-center cursor-pointer active:scale-90 transition"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}

              {/* Botón Disparador de 1 Toque con Mutación Optimista */}
              {regadasIds[currentPlant.id] ? (
                <div className="flex-1 sm:flex-initial flex items-center gap-2">
                  <span className="flex-1 sm:flex-initial min-h-[44px] px-4 py-2 rounded-2xl bg-mint text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm">
                    <CheckCircle2 size={16} strokeWidth={2.4} />
                    <span>¡Regada con éxito!</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUndo(currentPlant.id)}
                    className="touch-target min-h-[44px] px-3 rounded-2xl bg-tertiary text-label-secondary hover:text-label-primary text-xs font-semibold flex items-center gap-1 transition active:scale-95 cursor-pointer"
                    title="Deshacer riego"
                  >
                    <Undo2 size={13} />
                    <span>Deshacer</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={procesandoId === currentPlant.id}
                  onClick={() => handleQuickWater(currentPlant)}
                  className="flex-1 sm:flex-initial min-h-[44px] min-w-[130px] px-5 py-2.5 rounded-2xl bg-mint hover:bg-mint-hover active:scale-95 transition-all text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-75"
                >
                  {procesandoId === currentPlant.id ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Regando...</span>
                    </>
                  ) : (
                    <>
                      <Droplets size={16} strokeWidth={2.4} className="fill-white" />
                      <span>Regar ahora</span>
                    </>
                  )}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
