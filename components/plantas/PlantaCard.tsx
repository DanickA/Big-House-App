'use client';

import { useState } from 'react';
import { Pencil, History, Trash2, MapPin, Droplets, MoreHorizontal, Loader2, Check } from 'lucide-react';
import WaterProgressRing from '@/components/ui/WaterProgressRing';
import PullDownMenu from '@/components/ui/PullDownMenu';
import { registrarCuidado } from '@/actions/plantas';

export type Planta = {
  id: string;
  nombre_comun: string;
  especie: string | null;
  ubicacion: string;
  foto_url: string | null;
  diasRestantes?: number | null;
  frecuencia_dias?: number | null;
};

interface PlantaCardProps {
  planta: Planta;
  onSelect: (planta: Planta) => void;
  onEdit: (planta: Planta) => void;
  onDelete: (planta: Planta) => void;
  onOpenHistorial: (planta: Planta) => void;
  onQuickWater?: (planta: Planta) => Promise<void> | void;
}

export default function PlantaCard({
  planta,
  onSelect,
  onEdit,
  onDelete,
  onOpenHistorial,
  onQuickWater,
}: PlantaCardProps) {
  const [regando, setRegando] = useState(false);
  const [regadoReciente, setRegadoReciente] = useState(false);

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
      setTimeout(() => setRegadoReciente(false), 2500);
    } finally {
      setRegando(false);
    }
  }

  // Grupos del Menú Desplegable (Apple HIG Pull-Down Menu)
  const menuGroups = [
    {
      items: [
        {
          id: 'regar',
          label: 'Regar ahora (1 toque)',
          icon: Droplets,
          onClick: () => handleQuickWater(),
        },
        {
          id: 'historial',
          label: 'Ver bitácora de cuidados...',
          icon: History,
          onClick: () => onOpenHistorial(planta),
        },
        {
          id: 'editar',
          label: 'Editar planta...',
          icon: Pencil,
          onClick: () => onEdit(planta),
        },
      ],
    },
    {
      items: [
        {
          id: 'eliminar',
          label: 'Eliminar planta',
          icon: Trash2,
          destructive: true,
          onClick: () => onDelete(planta),
        },
      ],
    },
  ];

  return (
    <div
      onClick={() => onSelect(planta)}
      className="group relative h-72 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-out cursor-pointer bg-[#c7e1d7]/40 border border-white/60 hover:-translate-y-1.5"
    >
      {/* Foto de fondo con zoom fluido */}
      {planta.foto_url ? (
        <img
          src={planta.foto_url}
          alt={planta.nombre_comun}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#c7e1d7]/40 to-[#6eb5a5]/25">
          <span className="font-bold text-3xl text-mint/60">
            {planta.nombre_comun.slice(0, 2).toUpperCase()}
          </span>
          <span className="apple-caption-2 font-semibold text-mint mt-1">
            Hogar
          </span>
        </div>
      )}

      {/* Gradientes Glassmorphic Multicapa */}
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />

      {/* Barra Superior: Menú Pull-Down HIG + Anillo de Riego */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
        <div onClick={(e) => e.stopPropagation()}>
          <PullDownMenu
            groups={menuGroups}
            align="left"
            ariaLabel={`Opciones de la planta ${planta.nombre_comun}`}
            trigger={
              <button
                type="button"
                aria-label={`Opciones de la planta ${planta.nombre_comun}`}
                className="w-11 h-11 rounded-full flex items-center justify-center text-white/90 hover:text-white bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 transition-all duration-150 cursor-pointer active:scale-92 shadow-xs"
              >
                <MoreHorizontal size={18} strokeWidth={2.2} />
              </button>
            }
          />
        </div>

        {/* Anillo de Progreso de Riego Interactivo (Quick Water 1 Toque) */}
        <div onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleQuickWater}
            disabled={regando}
            title={`Regar ahora en 1 toque: ${planta.nombre_comun}`}
            aria-label={`Regar ahora a ${planta.nombre_comun}`}
            className="group/water relative inline-flex items-center justify-center rounded-full cursor-pointer transition-transform duration-200 active:scale-90 hover:scale-108 focus:outline-none focus-visible:ring-2 focus-visible:ring-mint shadow-md hover:shadow-lg disabled:opacity-85"
          >
            {regando ? (
              <div className="w-11 h-11 rounded-full bg-mint/90 backdrop-blur-md flex items-center justify-center text-white shadow-inner animate-pulse">
                <Loader2 size={18} className="animate-spin" />
              </div>
            ) : regadoReciente ? (
              <div className="w-11 h-11 rounded-full bg-mint text-white flex items-center justify-center shadow-md animate-scale-in">
                <Check size={18} strokeWidth={2.8} />
              </div>
            ) : (
              <>
                <WaterProgressRing
                  diasRestantes={planta.diasRestantes}
                  frecuenciaDias={planta.frecuencia_dias}
                  size={44}
                  strokeWidth={3.5}
                />
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover/water:opacity-100 transition-opacity duration-150 pointer-events-none bg-black/85 text-white text-[9.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-xs border border-white/10 z-20">
                  Toca para regar
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Información Inferior de la Planta */}
      <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 text-white space-y-1.5 z-10">
        <div>
          <h2 className="apple-headline font-semibold text-white leading-snug drop-shadow-sm tracking-tight truncate">
            {planta.nombre_comun}
          </h2>
          {planta.especie && (
            <p className="apple-caption-2 text-stone-300 italic truncate font-normal">
              {planta.especie}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-1.5 pt-1 text-stone-200">
          <span className="flex items-center gap-1 bg-black/35 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border border-white/10 min-w-0 flex-1 max-w-fit apple-caption-2 font-normal">
            <MapPin size={11} className="text-khaki shrink-0" />
            <span className="truncate">{planta.ubicacion}</span>
          </span>

          {planta.frecuencia_dias ? (
            <span className="flex items-center gap-1 bg-black/35 backdrop-blur-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-xl border border-white/10 apple-caption-2 font-medium tabular-nums shrink-0">
              <Droplets size={11} className="text-mint shrink-0" />
              <span>{planta.frecuencia_dias}d</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}