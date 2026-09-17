'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Planta } from './PlantaCard';
import { getHistorialByPlanta, registrarCuidado } from '@/actions/plantas';
import { Droplets, Sparkles, Scissors, Leaf, History, X, MapPin, CheckCircle2, User, AlertCircle } from 'lucide-react';
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

export default function PlantaDetalleModal({
  planta,
  pestanaInicial = 'acciones',
  onClose,
  onSuccess,
}: PlantaDetalleModalProps) {
  const [mounted, setMounted] = useState(false);
  const [pestanaActiva, setPestanaActiva] = useState<'acciones' | 'historial'>(pestanaInicial);
  const [historial, setHistorial] = useState<RegistroHistorial[]>([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setPestanaActiva(pestanaInicial);
  }, [pestanaInicial]);

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

  async function handleEjecutarCuidado(tipoTarea: string) {
    if (!planta) return;
    setErrorMsg(null);
    setProcesando(true);

    const res = await registrarCuidado(planta.id, tipoTarea);
    setProcesando(false);

    if (res.success) {
      onSuccess(`¡${tipoTarea} registrado con éxito!`);
      await cargarHistorial();
      setPestanaActiva('historial');
    } else {
      setErrorMsg(res.error || 'Error al registrar el cuidado');
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Clic fuera para cerrar */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative glass-modal w-full max-w-lg rounded-[2.5rem] overflow-hidden max-h-[calc(100vh-4rem)] flex flex-col shadow-2xl animate-fade-in-up my-auto border border-white/80 dark:border-white/10">
        
        {/* Cabecera con Imagen / Gradiente */}
        <div className="h-48 relative bg-mint/15 dark:bg-tertiary shrink-0">
          {planta.foto_url ? (
            <img src={planta.foto_url} alt={planta.nombre_comun} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-mint/20 dark:bg-tertiary">
              <span className="font-bold text-4xl text-mint">
                {planta.nombre_comun.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
          
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white/90 hover:text-white hover:bg-black/60 transition flex items-center justify-center cursor-pointer border border-white/20 active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between text-white">
            <div className="space-y-0.5 max-w-[280px]">
              <h2 className="apple-title-3 font-semibold tracking-tight drop-shadow-sm truncate">
                {planta.nombre_comun}
              </h2>
              <p className="apple-subhead text-stone-200 flex items-center gap-1 font-normal">
                <MapPin size={12} className="text-mint" />
                <span>{planta.ubicacion}</span>
              </p>
            </div>

            <WaterProgressRing
              diasRestantes={planta.diasRestantes}
              frecuenciaDias={planta.frecuencia_dias}
              size={50}
              strokeWidth={4}
            />
          </div>
        </div>

        {/* Selector de Pestañas Segmentado Apple HIG */}
        <div className="p-3.5 border-b border-separator shrink-0">
          <SegmentedControl<'acciones' | 'historial'>
            options={[
              { value: 'acciones', label: 'Acciones de cuidado', icon: Sparkles },
              { value: 'historial', label: 'Historial de registros', icon: History },
            ]}
            value={pestanaActiva}
            onChange={(val) => setPestanaActiva(val)}
            ariaLabel="Pestañas de detalle de planta"
          />
        </div>

        {/* Contenido Modular con Scroll */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-terracotta/15 border border-terracotta/30 text-terracotta rounded-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in-up">
              <AlertCircle size={16} strokeWidth={2.2} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {pestanaActiva === 'acciones' ? (
            <div className="space-y-4">
              <p className="apple-footnote font-normal text-label-secondary">
                Selecciona la labor realizada hoy para actualizar el ciclo de cuidado:
              </p>

              <div className="grid grid-cols-2 gap-3.5">
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
                      disabled={procesando}
                      onClick={() => handleEjecutarCuidado(item.tipo)}
                      className={`min-h-[72px] p-4 rounded-2xl border ${item.color} flex flex-col items-center justify-center gap-2 text-xs transition-all duration-150 active:scale-[0.98] disabled:opacity-50 cursor-pointer shadow-2xs`}
                    >
                      <Icon size={22} strokeWidth={2.2} />
                      <span className="apple-caption-1">{item.label}</span>
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
                      className="p-3.5 bg-secondary/80 dark:bg-tertiary/60 rounded-2xl border border-separator flex items-start gap-3 shadow-2xs"
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