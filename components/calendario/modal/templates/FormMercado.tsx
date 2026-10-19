'use client';

import { Users } from 'lucide-react';
import ChecklistDinamica from '../atoms/ChecklistDinamica';
import { SubtareaItem } from '../types';

interface FormMercadoProps {
  miembros: { id: string; nombre: string; email?: string }[];
  encargadosMercadoIds: string[];
  onToggleEncargadoMercado: (id: string) => void;
  itemsMercado: SubtareaItem[];
  onAddItemMercado: (desc: string) => void;
  onAddMultipleItemsMercado?: (descs: string[]) => void;
  onClearAllMercado?: () => void;
  onToggleItemMercado: (id: string) => void;
  onRemoveItemMercado: (id: string) => void;
}

export default function FormMercado({
  miembros,
  encargadosMercadoIds,
  onToggleEncargadoMercado,
  itemsMercado,
  onAddItemMercado,
  onAddMultipleItemsMercado,
  onClearAllMercado,
  onToggleItemMercado,
  onRemoveItemMercado,
}: FormMercadoProps) {
  return (
    <div className="space-y-4 pt-1">
      {/* Encargados de ir al mercado */}
      {miembros.length > 0 && (
        <div className="space-y-2">
          <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
            <Users size={13} className="text-terracotta" />
            <span>Encargados de las compras</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {miembros.map((m) => {
              const isSelected = encargadosMercadoIds.includes(m.id);
              return (
                <label
                  key={m.id}
                  onClick={() => onToggleEncargadoMercado(m.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                    isSelected
                      ? 'bg-terracotta/15 border-terracotta text-label-primary font-semibold shadow-3xs'
                      : 'bg-tertiary border-separator/60 text-label-secondary hover:text-label-primary'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="rounded accent-terracotta cursor-pointer pointer-events-none"
                  />
                  <span className="truncate">{m.nombre}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Checklist de Productos / Mercado */}
      <ChecklistDinamica
        titulo="Lista de compras y víveres"
        placeholderNuevoItem="Ej. Huevos, café, detergente..."
        items={itemsMercado}
        onAddItem={onAddItemMercado}
        onAddMultipleItems={onAddMultipleItemsMercado}
        onClearAll={onClearAllMercado}
        onToggleItem={onToggleItemMercado}
        onRemoveItem={onRemoveItemMercado}
        tipoItemPlural="productos"
      />
    </div>
  );
}
