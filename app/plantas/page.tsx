'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPlantas, deletePlanta } from '@/actions/plantas';
import PlantaCard, { Planta } from '@/components/plantas/PlantaCard';
import PlantaFormModal from '@/components/plantas/PlantaFormModal';
import PlantaDetalleModal from '@/components/plantas/PlantaDetalleModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { ArrowLeft, Plus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function PlantasPage() {
  const [plantas, setPlantas] = useState<Planta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [plantaAEliminar, setPlantaAEliminar] = useState<Planta | null>(null);

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

  function notificarError(mensaje: string) {
    setMensajeError(mensaje);
    setTimeout(() => setMensajeError(null), 4000);
  }

  function handleEliminar(planta: Planta) {
    setPlantaAEliminar(planta);
  }

  async function confirmarEliminarPlanta() {
    if (!plantaAEliminar) return;
    const res = await deletePlanta(plantaAEliminar.id);
    if (res.success) {
      notificarExito('Planta eliminada correctamente');
      setPlantaAEliminar(null);
      await cargarLista();
    } else {
      notificarError(res.error || 'No se pudo eliminar la planta');
      setPlantaAEliminar(null);
    }
  }

  return (
    <div className="relative min-h-screen bg-system text-label-primary p-6 md:p-10">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-mint top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
        
        {/* Notificación Flotante Glassmorphic */}
        {mensajeExito && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-[#c7e1d7]/95 dark:bg-mint/20 border border-[#6eb5a5]/40 text-mint px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <CheckCircle2 size={18} className="text-mint" />
            <span>{mensajeExito}</span>
          </div>
        )}
        {mensajeError && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-[#ce9b8c]/30 dark:bg-terracotta/20 border border-[#aa4b50]/40 text-terracotta px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <AlertCircle size={18} className="text-terracotta" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Encabezado */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="apple-footnote font-medium text-label-secondary hover:text-label-primary transition flex items-center gap-1.5 mb-1"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>Volver al Lobby</span>
            </Link>
            <h1 className="apple-large-title text-label-primary tracking-tight">
              Nuestras Plantas
            </h1>
            <p className="apple-subhead text-label-secondary font-normal">
              {plantas.length} {plantas.length === 1 ? 'planta registrada' : 'plantas registradas'} en el hogar
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlantaAEditar(null);
              setIsFormOpen(true);
            }}
            className="btn-apple-filled-mint px-5 text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Agregar planta</span>
          </button>
        </header>

        {/* Cuadrícula Bento de Plantas */}
        {cargando ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-72 rounded-[2rem] bg-white/40 dark:bg-tertiary/40 border border-white/60 dark:border-white/10 animate-pulse" />
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
              className="h-72 rounded-[2rem] border-2 border-dashed border-mint/40 dark:border-separator bg-white/40 dark:bg-tertiary/30 hover:bg-white/70 dark:hover:bg-tertiary/60 backdrop-blur-xs transition-all duration-300 flex flex-col items-center justify-center p-6 text-center group cursor-pointer shadow-xs hover:shadow-md hover:-translate-y-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#c7e1d7]/50 dark:bg-mint/15 border border-[#6eb5a5]/30 flex items-center justify-center text-mint group-hover:scale-110 transition shadow-2xs">
                <Plus size={24} strokeWidth={2.5} />
              </div>
              <span className="mt-4 apple-headline font-semibold text-label-primary">Agregar nueva planta</span>
              <span className="apple-subhead text-label-secondary mt-1 font-normal">Registrar especie y ciclo</span>
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

      <ConfirmModal
        isOpen={!!plantaAEliminar}
        title="¿Eliminar planta?"
        description={`¿Estás seguro de que deseas eliminar a "${plantaAEliminar?.nombre_comun}" del jardín botánico del hogar? Esta acción borrará sus tareas y registros.`}
        confirmText="Eliminar planta"
        variant="danger"
        onConfirm={confirmarEliminarPlanta}
        onClose={() => setPlantaAEliminar(null)}
      />
    </div>
  );
}