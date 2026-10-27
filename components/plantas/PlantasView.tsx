'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { getPlantas, deletePlanta, registrarCuidado, deshacerCuidado } from '@/actions/plantas';
import dynamic from 'next/dynamic';
import PlantaCard, { Planta } from '@/components/plantas/PlantaCard';
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  AlertCircle,
  Undo2,
  Loader2,
  Sprout,
  Droplets,
} from 'lucide-react';

const PlantaFormModal = dynamic(() => import('@/components/plantas/PlantaFormModal'), { ssr: false });
const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal'), { ssr: false });

interface PlantasViewProps {
  initialPlantas: Planta[];
}

type UndoQuickWater = {
  historialId: string;
  plantaId: string;
  plantaNombre: string;
};

export default function PlantasView({ initialPlantas }: PlantasViewProps) {
  const { data: plantas = initialPlantas, mutate } = useSWR<Planta[]>(
    'plantas-list',
    async () => {
      const res = await getPlantas();
      return res.success ? res.data : initialPlantas;
    },
    {
      fallbackData: initialPlantas,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  );

  // Filtro único en cabecera (Signpost)
  const [filtroSignpost, setFiltroSignpost] = useState<'todas' | 'hoy'>('todas');

  // Control del acordeón desplegable (una cápsula abierta a la vez para baja densidad visual)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);
  const [undoQuickWater, setUndoQuickWater] = useState<UndoQuickWater | null>(null);
  const [deshaciendoQuickWater, setDeshaciendoQuickWater] = useState(false);
  const [plantaAEliminar, setPlantaAEliminar] = useState<Planta | null>(null);

  // Estados de control del modal de formulario
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [plantaAEditar, setPlantaAEditar] = useState<Planta | null>(null);

  // Ordenar dinámicamente por urgencia de riego
  const plantasOrdenadas = useMemo(() => {
    return [...plantas].sort((a, b) => (a.diasRestantes ?? 99) - (b.diasRestantes ?? 99));
  }, [plantas]);

  const urgentesHoy = useMemo(
    () => plantasOrdenadas.filter((p) => (p.diasRestantes ?? 0) <= 0),
    [plantasOrdenadas]
  );

  const listaActiva =
    filtroSignpost === 'hoy' && urgentesHoy.length > 0 ? urgentesHoy : plantasOrdenadas;

  function notificarExito(mensaje: string, duracion = 5000) {
    setMensajeExito(mensaje);
    setTimeout(() => {
      setMensajeExito(null);
      setUndoQuickWater(null);
    }, duracion);
  }

  function notificarError(mensaje: string) {
    setMensajeError(mensaje);
    setTimeout(() => setMensajeError(null), 4000);
  }

  async function handleQuickWater(planta: Planta) {
    // Mutación optimista inmediata en 0ms
    mutate(
      (prev) =>
        prev?.map((p) =>
          p.id === planta.id ? { ...p, diasRestantes: p.frecuencia_dias ?? 7 } : p
        ),
      false
    );

    try {
      const res = await registrarCuidado(planta.id, 'RIEGO');
      if (res.success && res.data) {
        const meta = (res as any).meta;
        const historialId = meta?.historialId || res.data.id;
        setUndoQuickWater({
          historialId,
          plantaId: planta.id,
          plantaNombre: planta.nombre_comun,
        });
        notificarExito(`¡${planta.nombre_comun} hidratada!`, 7000);
        await mutate();
      } else {
        await mutate();
        notificarError(res.error || 'No se pudo registrar el riego');
      }
    } catch {
      await mutate();
      notificarError('Error inesperado al regar la planta');
    }
  }

  async function handleUndoQuickWater() {
    if (!undoQuickWater) return;
    setDeshaciendoQuickWater(true);
    try {
      const res = await deshacerCuidado(undoQuickWater.historialId);
      if (res.success) {
        const nombre = undoQuickWater.plantaNombre;
        setUndoQuickWater(null);
        notificarExito(`Riego de ${nombre} deshecho`, 4000);
        await mutate();
      } else {
        notificarError(res.error || 'No se pudo deshacer el riego');
      }
    } catch {
      notificarError('Error al deshacer el riego');
    } finally {
      setDeshaciendoQuickWater(false);
    }
  }

  function handleEliminar(planta: Planta) {
    setPlantaAEliminar(planta);
  }

  async function confirmarEliminarPlanta() {
    if (!plantaAEliminar) return;
    const res = await deletePlanta(plantaAEliminar.id);
    if (res.success) {
      notificarExito('Planta eliminada correctamente');
      if (expandedId === plantaAEliminar.id) {
        setExpandedId(null);
      }
      setPlantaAEliminar(null);
      await mutate();
    } else {
      notificarError(res.error || 'No se pudo eliminar la planta');
      setPlantaAEliminar(null);
    }
  }

  return (
    <div className="relative min-h-screen bg-system text-label-primary p-5 sm:p-6 md:p-10 overflow-hidden">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-mint top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
        {/* Notificación Flotante Glassmorphic */}
        {mensajeExito && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-mint/20 border border-mint/40 text-label-primary px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <CheckCircle2 size={18} className="text-mint shrink-0" />
            <span>{mensajeExito}</span>
            {undoQuickWater && (
              <button
                type="button"
                disabled={deshaciendoQuickWater}
                onClick={handleUndoQuickWater}
                className="ml-2 px-3.5 py-2 min-h-[40px] bg-terracotta text-white rounded-xl text-xs font-bold hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
              >
                {deshaciendoQuickWater ? (
                  <>
                    <Loader2 size={12} className="animate-spin" />
                    <span>Deshaciendo...</span>
                  </>
                ) : (
                  <>
                    <Undo2 size={12} strokeWidth={2.5} />
                    <span>Deshacer</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
        {mensajeError && (
          <div className="fixed top-20 right-6 z-60 glass-card bg-terracotta/20 border border-terracotta/40 text-label-primary px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 font-bold text-sm animate-fade-in-up">
            <AlertCircle size={18} className="text-terracotta" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Cabecera Única sin duplicidad de datos */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <Link
              href="/"
              className="apple-footnote font-medium text-label-secondary hover:text-label-primary transition inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={13} strokeWidth={2.5} />
              <span>Volver al Lobby</span>
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="apple-large-title text-label-primary tracking-tight">
                Nuestras Plantas
              </h1>

              {/* Píldora de Señal Direccional Única (Todas vs Por regar) */}
              <div className="inline-flex items-center p-1 rounded-full glass-card border border-separator/80 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setFiltroSignpost('todas')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroSignpost === 'todas'
                      ? 'bg-mint text-white dark:text-black shadow-2xs'
                      : 'text-label-secondary hover:text-label-primary'
                  }`}
                >
                  <Sprout size={13} />
                  <span>Todas ({plantas.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFiltroSignpost(filtroSignpost === 'hoy' ? 'todas' : 'hoy')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filtroSignpost === 'hoy'
                      ? 'bg-terracotta text-white shadow-2xs'
                      : urgentesHoy.length > 0
                      ? 'text-terracotta hover:bg-terracotta/10'
                      : 'text-label-tertiary'
                  }`}
                >
                  <Droplets size={13} />
                  <span>Por regar ({urgentesHoy.length})</span>
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setPlantaAEditar(null);
              setIsFormOpen(true);
            }}
            className="btn-apple-filled-mint px-5 min-h-[44px] text-sm font-semibold flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus size={16} strokeWidth={2.4} />
            <span>Agregar planta</span>
          </button>
        </header>

        {/* Lista de Cápsulas con Acordeón In-Place (3B) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 items-start">
          {listaActiva.map((planta) => (
            <PlantaCard
              key={planta.id}
              planta={planta}
              isExpanded={expandedId === planta.id}
              onToggleExpand={(p) =>
                setExpandedId((prev) => (prev === p.id ? null : p.id))
              }
              onEdit={(p) => {
                setPlantaAEditar(p);
                setIsFormOpen(true);
              }}
              onDelete={handleEliminar}
              onQuickWater={handleQuickWater}
              onCareRegistered={(msg) => {
                notificarExito(msg);
                mutate();
              }}
            />
          ))}
        </div>
      </div>

      {/* Modal de Formulario con Guía de Cuidado */}
      <PlantaFormModal
        isOpen={isFormOpen}
        plantaAEditar={plantaAEditar}
        onClose={() => setIsFormOpen(false)}
        onSuccess={(msg) => {
          notificarExito(msg);
          mutate();
        }}
      />

      {/* Confirmación de Eliminación */}
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
