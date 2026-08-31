'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPlantas, deletePlanta } from '@/actions/plantas';
import PlantaCard, { Planta } from '@/components/plantas/PlantaCard';
import PlantaFormModal from '@/components/plantas/PlantaFormModal';
import PlantaDetalleModal from '@/components/plantas/PlantaDetalleModal';
import { ArrowLeft, Plus, CheckCircle2 } from 'lucide-react';

export default function PlantasPage() {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Estados de control de modales
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [plantaAEditar, setPlantaAEditar] = useState<Planta | null>(null);
  const [plantaSeleccionada, setPlantaSeleccionada] = useState<Planta | null>(null);
  const [pestanaModal, setPestanaModal] = useState<'acciones' | 'historial'>('acciones');

  async function cargarLista() {
    setCargando(true);
    const res = await getPlantas();
    if (res.success && res.data) {
      setPlantas(res.data);
    }
    setCargando(false);
  }

  useEffect(() => {
    cargarLista();
  }, []);

  function notificarExito(mensaje: string) {
    setMensajeExito(mensaje);
    setTimeout(() => setMensajeExito(null), 3500);
  }

  async function handleEliminar(planta: Planta) {
    if (!window.confirm(`¿Deseas eliminar a "${planta.nombre_comun}"?`)) return;
    const res = await deletePlanta(planta.id);
    if (res.success) {
      notificarExito('Planta eliminada correctamente');
      await cargarLista();
    } else {
      alert(res.error || 'No se pudo eliminar la planta');
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F4EFE6] text-[#2E2B27] p-6 md:p-10">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-olive top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Notificación Flotante Glassmorphic */}
        {mensajeExito && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-[#EEF2EA]/90 border border-[#B7CBA9] text-[#2D3E24] px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <CheckCircle2 size={18} className="text-[#5F6F52]" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {/* Encabezado */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#736F68] hover:text-[#3A4630] transition uppercase tracking-wider mb-1"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>Volver al Lobby</span>
            </Link>
            <h1 className="text-3xl md:text-4xl font-extrabold text-[#3A4630] tracking-tight">
              Nuestras Plantas
            </h1>
            <p className="text-[#736F68] text-xs font-medium">
              {plantas.length} {plantas.length === 1 ? 'planta registrada' : 'plantas registradas'} en el hogar
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlantaAEditar(null);
              setIsFormOpen(true);
            }}
            className="px-5 py-3 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-2xl text-xs font-bold transition shadow-md shadow-[#5F6F52]/20 flex items-center gap-2 cursor-pointer active:scale-95 self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Agregar Planta</span>
          </button>
        </header>

        {/* Cuadrícula Bento de Plantas */}
        {cargando ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 rounded-[2rem] bg-white/40 border border-white/60 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            
            {/* Tarjeta para Agregar Planta */}
            <button 
              type="button"
              onClick={() => {
                setPlantaAEditar(null);
                setIsFormOpen(true);
              }}
              className="h-72 rounded-[2rem] border-2 border-dashed border-[#B7CBA9]/80 bg-white/40 hover:bg-white/70 backdrop-blur-xs transition-all duration-300 flex flex-col items-center justify-center p-6 text-center group cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#EEF2EA] border border-[#DCE7D3] flex items-center justify-center text-[#3A4630] group-hover:scale-110 transition shadow-2xs">
                <Plus size={24} strokeWidth={2.5} />
              </div>
              <span className="mt-4 text-sm font-extrabold text-[#3A4630]">Agregar nueva planta</span>
              <span className="text-xs text-[#736F68] mt-1 font-medium">Registrar especie y ciclo</span>
            </button>

            {plantas.map((planta) => (
              <PlantaCard
                key={planta.id}
                planta={planta}
                onSelect={(p) => {
                  setPlantaSeleccionada(p);
                  setPestanaModal('acciones');
                }}
                onEdit={(p) => {
                  setPlantaAEditar(p);
                  setIsFormOpen(true);
                }}
                onDelete={handleEliminar}
                onOpenHistorial={(p) => {
                  setPlantaSeleccionada(p);
                  setPestanaModal('historial');
                }}
              />
            ))}
          </div>
        )}

      </div>

      {/* Modales modulares globales */}
      <PlantaFormModal
        isOpen={isFormOpen}
        plantaAEditar={plantaAEditar}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          notificarExito(msg);
          cargarLista();
        }}
      />

      <PlantaDetalleModal
        planta={plantaSeleccionada}
        pestanaInicial={pestanaModal}
        onClose={() => setPlantaSeleccionada(null)}
        onSuccess={(msg) => {
          notificarExito(msg);
          cargarLista();
        }}
      />
    </div>
  );
}