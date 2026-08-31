'use client';

import { Edit2, History, Trash2, MapPin, Droplets } from 'lucide-react';
import WaterProgressRing from '@/components/ui/WaterProgressRing';

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
  return (
    <div
      onClick={() => onSelect(planta)}
      className="group relative h-72 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ease-out cursor-pointer bg-[#DCE7D3] border border-white/60 hover:-translate-y-1.5"
    >
      {/* Foto de fondo con zoom fluido */}
      {planta.foto_url ? (
        <img
          src={planta.foto_url}
          alt={planta.nombre_comun}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-[#E2EBDC] to-[#C9D9C0]">
          <span className="font-black text-4xl text-[#3A4630]/60 tracking-wider">
            {planta.nombre_comun.slice(0, 2).toUpperCase()}
          </span>
          <span className="text-[11px] font-bold text-[#5F6F52] mt-1 tracking-widest uppercase">
            Hogar
          </span>
        </div>
      )}

      {/* Gradiente Glassmorphic Multicapa */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/10 pointer-events-none" />

      {/* Barra Superior: Acciones Rápidas Glassmorphic */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md p-1 rounded-full border border-white/20 shadow-xs">
          <button
            type="button"
            title="Editar planta"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(planta);
            }}
            className="w-7 h-7 rounded-full text-white/90 hover:text-white hover:bg-white/20 transition flex items-center justify-center cursor-pointer active:scale-90"
          >
            <Edit2 size={13} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            title="Ver historial de cuidados"
            onClick={(e) => {
              e.stopPropagation();
              onOpenHistorial(planta);
            }}
            className="w-7 h-7 rounded-full text-white/90 hover:text-white hover:bg-white/20 transition flex items-center justify-center cursor-pointer active:scale-90"
          >
            <History size={13} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            title="Eliminar planta"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(planta);
            }}
            className="w-7 h-7 rounded-full text-white/90 hover:text-[#FFA48D] hover:bg-[#B84626]/40 transition flex items-center justify-center cursor-pointer active:scale-90"
          >
            <Trash2 size={13} strokeWidth={2.2} />
          </button>
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
          <h2 className="text-base font-extrabold leading-snug drop-shadow-sm tracking-tight truncate">
            {planta.nombre_comun}
          </h2>
          {planta.especie && (
            <p className="text-[11px] text-stone-300 italic truncate font-medium">
              {planta.especie}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1 text-[11px] text-stone-200">
          <span className="flex items-center gap-1 bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/10 truncate max-w-[140px]">
            <MapPin size={11} className="text-[#B7CBA9] shrink-0" />
            <span className="truncate">{planta.ubicacion}</span>
          </span>

          {planta.frecuencia_dias ? (
            <span className="flex items-center gap-1 bg-black/35 backdrop-blur-xs px-2.5 py-1 rounded-xl border border-white/10 font-semibold shrink-0">
              <Droplets size={11} className="text-[#89B3D9] shrink-0" />
              <span>{planta.frecuencia_dias}d</span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}