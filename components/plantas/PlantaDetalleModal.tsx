'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Planta } from './PlantaCard';
import { getHistorialByPlanta, registrarCuidado } from '@/actions/plantas';
import { Droplets, Sparkles, Scissors, Leaf, History, X, MapPin, CheckCircle2, User } from 'lucide-react';
import WaterProgressRing from '@/components/ui/WaterProgressRing';

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
    setProcesando(true);

    const res = await registrarCuidado(planta.id, tipoTarea);
    setProcesando(false);

    if (res.success) {
      onSuccess(`¡${tipoTarea} registrado con éxito!`);
      await cargarHistorial();
      setPestanaActiva('historial');
    } else {
      alert(res.error || 'Error al registrar el cuidado');
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Clic fuera para cerrar */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative glass-modal w-full max-w-lg rounded-[2.5rem] overflow-hidden max-h-[calc(100vh-4rem)] flex flex-col shadow-2xl animate-fade-in-up my-auto border border-white/80">
        
        {/* Cabecera con Imagen / Gradiente */}
        <div className="h-48 relative bg-[#DCE7D3] shrink-0">
          {planta.foto_url ? (
            <img src={planta.foto_url} alt={planta.nombre_comun} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#E2EBDC] to-[#C9D9C0]">
              <span className="font-black text-5xl text-[#3A4630]/60">
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
              <h2 className="text-xl font-extrabold tracking-tight drop-shadow-sm truncate">
                {planta.nombre_comun}
              </h2>
              <p className="text-xs text-stone-200 flex items-center gap-1">
                <MapPin size={12} className="text-[#B7CBA9]" />
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

        {/* Selector de Pestañas Deslizante */}
        <div className="p-3 bg-[#F0EAE1]/60 backdrop-blur-xs flex gap-2 border-b border-[#E8E0D2] shrink-0">
          <button
            type="button"
            onClick={() => setPestanaActiva('acciones')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              pestanaActiva === 'acciones'
                ? 'bg-white text-[#3A4630] shadow-sm shadow-[#3A4630]/5 border border-white'
                : 'text-[#736F68] hover:text-[#3A4630]'
            }`}
          >
            <Sparkles size={14} className={pestanaActiva === 'acciones' ? 'text-[#5F6F52]' : ''} />
            <span>Acciones de Cuidado</span>
          </button>

          <button
            type="button"
            onClick={() => setPestanaActiva('historial')}
            className={`flex-1 py-2.5 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
              pestanaActiva === 'historial'
                ? 'bg-white text-[#3A4630] shadow-sm shadow-[#3A4630]/5 border border-white'
                : 'text-[#736F68] hover:text-[#3A4630]'
            }`}
          >
            <History size={14} className={pestanaActiva === 'historial' ? 'text-[#5F6F52]' : ''} />
            <span>Historial</span>
          </button>
        </div>

        {/* Contenido Modular con Scroll */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {pestanaActiva === 'acciones' ? (
            <div className="space-y-4">
              <p className="text-xs font-semibold text-[#736F68]">
                Selecciona la labor realizada hoy para actualizar el ciclo de cuidado:
              </p>

              <div className="grid grid-cols-2 gap-3.5">
                {[
                  { label: 'Regar', icon: Droplets, tipo: 'RIEGO', color: 'bg-[#EEF4FB] text-[#2B6CB0] border-[#C3DAFE]' },
                  { label: 'Abonar', icon: Sparkles, tipo: 'ABONO', color: 'bg-[#FEF9E7] text-[#975A16] border-[#FEEBC8]' },
                  { label: 'Podar', icon: Scissors, tipo: 'PODA', color: 'bg-[#FDF2EC] text-[#B84626] border-[#F2BAA5]' },
                  { label: 'Limpiar', icon: Leaf, tipo: 'LIMPIEZA', color: 'bg-[#EEF2EA] text-[#3A4630] border-[#DCE7D3]' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button 
                      key={item.tipo}
                      type="button"
                      disabled={procesando}
                      onClick={() => handleEjecutarCuidado(item.tipo)}
                      className={`p-4 rounded-2xl border ${item.color} flex flex-col items-center justify-center gap-2 font-bold text-xs transition-all duration-200 hover:scale-103 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xs`}
                    >
                      <Icon size={22} strokeWidth={2} />
                      <span className="tracking-wide uppercase text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-[#736F68]">Registro cronológico de cuidados realizados:</p>
              
              {cargandoHistorial ? (
                <div className="py-8 text-center text-xs text-[#736F68] animate-pulse">
                  Cargando historial de la planta...
                </div>
              ) : historial.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#736F68] italic bg-white/50 rounded-2xl border border-[#E8E0D2]">
                  Aún no hay cuidados registrados para esta planta.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {historial.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 bg-white/80 rounded-2xl border border-white flex items-start gap-3 shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-xl bg-[#EEF2EA] text-[#3A4630] flex items-center justify-center shrink-0">
                        <CheckCircle2 size={16} strokeWidth={2.2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-extrabold text-[#3A4630]">
                            {item.tareas_cuidado.tipo_tarea}
                          </span>
                          <span className="text-[10px] font-medium text-[#736F68]">
                            {new Date(item.fecha_realizada).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#736F68] flex items-center gap-1 mt-0.5">
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