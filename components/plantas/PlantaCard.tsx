'use client';

import { Pencil, History, Trash2, MapPin, Droplets, MoreHorizontal } from 'lucide-react';
import WaterProgressRing from '@/components/ui/WaterProgressRing';
import PullDownMenu from '@/components/ui/PullDownMenu';

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
}

export default function PlantaCard({
  planta,
  onSelect,
  onEdit,
  onDelete,
  onOpenHistorial,
}: PlantaCardProps) {
  // Grupos del Menú Desplegable (Apple HIG Pull-Down Menu)
  const menuGroups = [
    {
      items: [
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

      {/* Gradiente Glassmorphic Multicapa */}
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

        {/* Anillo de Progreso de Riego Interactivo */}
        <WaterProgressRing
          diasRestantes={planta.diasRestantes}
          frecuenciaDias={planta.frecuencia_dias}
          size={44}
          strokeWidth={3.5}
        />
      </div>

      {/* Información Inferior de la Planta */}
      <div className="absolute bottom-4 left-4 right-4 text-white space-y-1.5 z-10">
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

        <div className="flex items-center justify-between pt-1 text-stone-200">
          <span className="flex items-center gap-1 bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/10 truncate max-w-[140px] apple-caption-2 font-normal">
            <MapPin size={11} className="text-khaki shrink-0" />
            <span className="truncate">{planta.ubicacion}</span>
          </span>

          {planta.frecuencia_dias ? (
            <span className="flex items-center gap-1 bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/10 apple-caption-2 font-medium tabular-nums shrink-0">
              <Droplets size={11} className="text-mint shrink-0" />
              <span>{planta.frecuencia_dias}d</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}