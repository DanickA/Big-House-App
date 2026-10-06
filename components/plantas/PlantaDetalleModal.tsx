'use client';

import { useState, useEffect, useOptimistic, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { Planta } from './PlantaCard';
import { getHistorialByPlanta, registrarCuidado, deshacerCuidado } from '@/actions/plantas';
import { Droplets, Sparkles, Scissors, Leaf, History, X, MapPin, CheckCircle2, User, AlertCircle, Undo2, Loader2 } from 'lucide-react';
import WaterProgressRing from '@/components/ui/WaterProgressRing';
import SegmentedControl from '@/components/ui/SegmentedControl';
import EmptyState from '@/components/ui/EmptyState';

interface PlantaDetalleModalProps {
  planta: Planta | null;
  pestanaInicial?: 'acciones' | 'historial';
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

type RegistroHistorial = {
  id: string;
  fecha_realizada: Date;
  observaciones: string | null;
  usuarios: { nombre: string };
  tareas_cuidado: { tipo_tarea: string };
};

type OptimisticAction =
  | { type: 'CUIDADO'; tipoTarea: string; diasRestantes?: number }
  | { type: 'DESHACER'; diasRestantes?: number | null };

type UltimoCuidado = {
  historialId: string;
  tipoTarea: string;
  plantaId: string;
  diasRestantesPrevios?: number | null;
};

export default function PlantaDetalleModal({
  planta,
  pestanaInicial = 'acciones',
  onClose,
  onSuccess,
}: PlantaDetalleModalProps) {
  const [mounted, setMounted] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<'acciones' | 'historial'>(pestanaInicial);
  const [plantaLocal, setPlantaLocal] = useState<Planta | null>(planta);
  const [historial, setHistorial] = useState<RegistroHistorial[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [deshaciendo, setDeshaciendo] = useState(false);
  const [ultimoCuidado, setUltimoCuidado] = useState<UltimoCuidado | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Hook nativo de React 19 para actualización instantánea (0ms) del temporizador y anillo
  const [optimisticPlanta, setOptimisticPlanta] = useOptimistic(
    plantaLocal || planta,
    (current: Planta | null, action: OptimisticAction): Planta | null => {
      if (!current) return current;
      if (action.type === 'CUIDADO' && action.tipoTarea === 'RIEGO') {
        return {
          ...current,
          diasRestantes: action.diasRestantes ?? current.frecuencia_dias ?? 7,
        };
      }
      if (action.type === 'DESHACER') {
        return {
          ...current,
          diasRestantes: action.diasRestantes !== undefined ? action.diasRestantes : null,
        };
      }
      return current;
    }
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPlantaLocal(planta);
  }, [planta]);

  useEffect(() => {
    setPestanaActiva(pestanaInicial);
  }, [pestanaInicial]);

  // Temporizador para auto-descartar el botón de deshacer tras 8 segundos
  useEffect(() => {
    if (ultimoCuidado) {
      const timer = setTimeout(() => {
        setUltimoCuidado(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [ultimoCuidado]);

  useEffect(() => {
    if (planta) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [planta]);

  async function cargarHistorial() {
    if (!planta) return;
    setCargandoHistorial(true);
    const res = await getHistorialByPlanta(planta.id);
    if (res.success && res.data) {
      setHistorial(res.data as unknown as RegistroHistorial[]);
    }
    setCargandoHistorial(false);
  }

  useEffect(() => {
    if (planta && pestanaActiva === 'historial') {
      cargarHistorial();
    }
  }, [planta, pestanaActiva]);

  if (!planta || !mounted) return null;

  const plantaActual = optimisticPlanta || plantaLocal || planta;

  function handleEjecutarCuidado(tipoTarea: string) {
    if (!planta) return;
    setErrorMsg(null);
    setProcesando(true);

    const diasPrevios = plantaLocal?.diasRestantes ?? planta.diasRestantes;

    startTransition(async () => {
      // 1. Estado optimista inmediato: el anillo y contador cambian en 0ms
      if (tipoTarea === 'RIEGO') {
        setOptimisticPlanta({
          type: 'CUIDADO',
          tipoTarea: 'RIEGO',
          diasRestantes: (plantaLocal || planta)?.frecuencia_dias ?? 7,
        });
      }

      try {
        const res = await registrarCuidado(planta.id, tipoTarea);
        if (res.success && res.data) {
          const meta = (res as any).meta;
          const nuevoHistorialId = meta?.historialId || res.data.id;

          // Habilitar mecanismo de reversión (Deshacer)
          setUltimoCuidado({
            historialId: nuevoHistorialId,
            tipoTarea,
            plantaId: planta.id,
            diasRestantesPrevios: diasPrevios,
          });

          // Confirmar estado local permanente
          if (tipoTarea === 'RIEGO') {
            setPlantaLocal((prev) =>
              prev
                ? {
                    ...prev,
                    diasRestantes: prev.frecuencia_dias ?? 7,
                  }
                : null
            );
          }
          onSuccess(`¡${tipoTarea} registrado con éxito!`);
          cargarHistorial();
        } else {
          setErrorMsg(res.error || 'Error al registrar el cuidado');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Error inesperado al registrar el cuidado');
      } finally {
        setProcesando(false);
      }
    });
  }

  function handleDeshacerCuidado() {
    if (!ultimoCuidado) return;
    const { historialId, diasRestantesPrevios, tipoTarea } = ultimoCuidado;
    setErrorMsg(null);
    setDeshaciendo(true);

    startTransition(async () => {
      // Reversión optimista inmediata en 0ms
      if (tipoTarea === 'RIEGO') {
        setOptimisticPlanta({
          type: 'DESHACER',
          diasRestantes: diasRestantesPrevios,
        });
      }

      try {
        const res = await deshacerCuidado(historialId);
        if (res.success) {
          if (tipoTarea === 'RIEGO') {
            setPlantaLocal((prev) =>
              prev
                ? {
                    ...prev,
                    diasRestantes: diasRestantesPrevios !== undefined ? diasRestantesPrevios : null,
                  }
                : null
            );
          }
          setUltimoCuidado(null);
          onSuccess('Acción de cuidado deshecha');
          cargarHistorial();
        } else {
          setErrorMsg(res.error || 'No se pudo deshacer la acción');
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Error al deshacer el cuidado');
      } finally {
        setDeshaciendo(false);
      }
    });
  }

  async function handleEliminarItemHistorial(item: RegistroHistorial) {
    setErrorMsg(null);
    setProcesando(true);
    try {
      const res = await deshacerCuidado(item.id);
      if (res.success) {
        onSuccess('Registro eliminado de la bitácora');
        await cargarHistorial();
        if (item.tareas_cuidado.tipo_tarea === 'RIEGO') {
          const nuevaProxima = res.data?.nuevaProximaFecha;
          if (nuevaProxima) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const prox = new Date(nuevaProxima);
            prox.setHours(0, 0, 0, 0);
            const dias = Math.round((prox.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));
            setPlantaLocal((prev) => (prev ? { ...prev, diasRestantes: dias } : null));
          } else {
            setPlantaLocal((prev) => (prev ? { ...prev, diasRestantes: 0 } : null));
          }
        }
      } else {
        setErrorMsg(res.error || 'No se pudo eliminar el registro');
      }
    } catch {
      setErrorMsg('Error al eliminar el registro');
    } finally {
      setProcesando(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Clic fuera para cerrar */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative glass-modal w-full max-w-lg rounded-[2.5rem] overflow-hidden max-h-[calc(100vh-4rem)] flex flex-col shadow-2xl animate-fade-in-up my-auto border border-white/80 dark:border-white/10">
        
        {/* Cabecera Compacta tipo Media Header (máximo 120px en móvil conforme a Apple HIG) */}
        <div className="h-[116px] sm:h-36 relative bg-mint/15 dark:bg-tertiary shrink-0 overflow-hidden">
          {plantaActual.foto_url ? (
            <img src={plantaActual.foto_url} alt={plantaActual.nombre_comun} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-mint/20 dark:bg-tertiary">
              <span className="font-bold text-3xl text-mint">
                {plantaActual.nombre_comun.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          
          <button 
            type="button"
            onClick={onClose}
            aria-label="Cerrar ficha"
            className="absolute top-3 right-3 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 transition flex items-center justify-center cursor-pointer border border-white/20 active:scale-90 z-10"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="absolute bottom-2.5 left-4 right-4 flex items-end justify-between text-white z-10">
            <div className="space-y-0.5 max-w-[240px] sm:max-w-[300px]">
              <h2 className="apple-headline font-semibold tracking-tight drop-shadow-sm truncate text-white">
                {plantaActual.nombre_comun}
              </h2>
              <p className="apple-caption-1 text-stone-200 flex items-center gap-1 font-normal truncate">
                <MapPin size={11} className="text-mint shrink-0" />
                <span className="truncate">{plantaActual.ubicacion}</span>
              </p>
            </div>

            <WaterProgressRing
              diasRestantes={plantaActual.diasRestantes}
              frecuenciaDias={plantaActual.frecuencia_dias}
              size={40}
              strokeWidth={3.5}
            />
          </div>
        </div>

        {/* Selector de Pestañas Segmentado Apple HIG */}
        <div className="p-3.5 border-b border-separator shrink-0">
          <SegmentedControl<'acciones' | 'historial'>
            options={[
              {
                value: 'acciones',
                label: (
                  <>
                    <span className="sm:hidden">Cuidados</span>
                    <span className="hidden sm:inline">Acciones de cuidado</span>
                  </>
                ),
                icon: Sparkles,
              },
              {
                value: 'historial',
                label: (
                  <>
                    <span className="sm:hidden">Historial</span>
                    <span className="hidden sm:inline">Historial de cuidados</span>
                  </>
                ),
                icon: History,
              },
            ]}
            value={pestanaActiva}
            onChange={(val) => setPestanaActiva(val)}
            ariaLabel="Pestañas de detalle de planta"
          />
        </div>

        {/* Contenido Modular con Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-terracotta/15 border border-terracotta/30 text-terracotta rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in-up">
              <AlertCircle size={16} strokeWidth={2.2} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Banner de Deshacer (Undo) Inmediato tras Registro */}
          {ultimoCuidado && (
            <div className="p-3 bg-mint/15 dark:bg-mint/10 border border-mint/35 text-mint rounded-2xl flex items-center justify-between gap-3 text-xs font-semibold animate-fade-in-up shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle2 size={16} className="shrink-0 text-mint" />
                <span className="truncate">
                  {ultimoCuidado.tipoTarea === 'RIEGO'
                    ? 'Riego registrado hoy'
                    : `${ultimoCuidado.tipoTarea} registrado`}
                </span>
              </div>
              <button
                type="button"
                disabled={deshaciendo}
                onClick={handleDeshacerCuidado}
                className="px-3.5 py-2 min-h-[44px] min-w-[44px] rounded-xl bg-mint text-white dark:bg-mint dark:text-black hover:opacity-90 active:scale-95 transition-all text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 cursor-pointer shadow-xs disabled:opacity-50"
              >
                {deshaciendo ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Deshaciendo...</span>
                  </>
                ) : (
                  <>
                    <Undo2 size={13} strokeWidth={2.4} />
                    <span>Deshacer</span>
                  </>
                )}
              </button>
            </div>
          )}

          {pestanaActiva === 'acciones' ? (
            <div className="space-y-3">
              <p className="apple-footnote font-normal text-label-secondary">
                Registra la labor realizada hoy en 1 toque (zona ergonómica del pulgar):
              </p>

              {/* 4 Acciones de Cuidado en Fila Horizontal Accesible en la Zona del Pulgar */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  {
                    label: 'Regar',
                    icon: Droplets,
                    tipo: 'RIEGO',
                    color: 'bg-mint/20 text-mint border-mint/40 hover:bg-mint/30 shadow-xs ring-1 ring-mint/25 font-bold',
                  },
                  {
                    label: 'Abonar',
                    icon: Sparkles,
                    tipo: 'ABONO',
                    color: 'bg-khaki/20 text-label-primary border-khaki/40 hover:bg-khaki/30 font-semibold',
                  },
                  {
                    label: 'Podar',
                    icon: Scissors,
                    tipo: 'PODA',
                    color: 'bg-[#ce9b8c]/20 text-terracotta border-terracotta/30 hover:bg-[#ce9b8c]/30 font-semibold',
                  },
                  {
                    label: 'Limpiar',
                    icon: Leaf,
                    tipo: 'LIMPIEZA',
                    color: 'bg-tertiary text-label-primary border-separator hover:bg-tertiary-hover font-semibold',
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button 
                      key={item.tipo}
                      type="button"
                      disabled={procesando || deshaciendo}
                      onClick={() => handleEjecutarCuidado(item.tipo)}
                      className={`min-h-[58px] py-2.5 px-1 rounded-2xl border ${item.color} flex flex-col items-center justify-center gap-1.5 text-[11px] transition-all duration-150 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs`}
                    >
                      <Icon size={19} strokeWidth={2.2} />
                      <span className="apple-caption-2 font-semibold truncate leading-none">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="apple-footnote font-normal text-label-secondary">Registro cronológico de cuidados realizados:</p>
              
              {cargandoHistorial ? (
                <div className="py-8 text-center text-xs text-label-secondary animate-pulse">
                  Cargando historial de la planta...
                </div>
              ) : historial.length === 0 ? (
                <EmptyState
                  icon={Droplets}
                  title="Sin cuidados registrados"
                  description="Aún no has registrado labores de riego, abono o poda para esta planta."
                  action={{
                    label: 'Registrar Riego',
                    onClick: () => {
                      setPestanaActiva('acciones');
                      handleEjecutarCuidado('RIEGO');
                    },
                    icon: Droplets,
                  }}
                  compact={true}
                />
              ) : (
                <div className="space-y-2.5">
                  {historial.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-secondary/80 dark:bg-tertiary/60 rounded-2xl border border-separator flex items-start gap-3 shadow-2xs group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-mint/15 text-mint flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="apple-footnote font-semibold text-label-primary">
                            {item.tareas_cuidado.tipo_tarea}
                          </span>
                          <span className="apple-caption-2 font-normal text-label-secondary tabular-nums">
                            {new Date(item.fecha_realizada).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="apple-caption-2 text-label-secondary flex items-center gap-1 mt-0.5 font-normal">
                          <User size={11} />
                          <span>Por {item.usuarios.nombre}</span>
                          {item.observaciones && <span className="italic">• {item.observaciones}</span>}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={procesando || deshaciendo}
                        onClick={() => handleEliminarItemHistorial(item)}
                        title="Deshacer este registro de cuidado"
                        aria-label="Deshacer registro de cuidado"
                        className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-terracotta/15 hover:text-terracotta text-label-tertiary transition flex items-center justify-center shrink-0 cursor-pointer opacity-70 group-hover:opacity-100 disabled:opacity-40"
                      >
                        <Undo2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>,
    document.body
  );
}