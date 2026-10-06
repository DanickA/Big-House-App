'use client';

import { useState, useRef } from 'react';
import { Plus, CheckSquare, Square, Trash2, ListTodo, ClipboardList, Sparkles, X, Check } from 'lucide-react';
import { SubtareaItem } from '../types';

export function parsearListaTexto(texto: string): string[] {
  if (!texto) return [];

  // Si contiene saltos de línea (listas de WhatsApp, Keep, Notas)
  if (texto.includes('\n') || texto.includes('\r')) {
    return texto
      .split(/\r?\n/)
      .map((line) => line.replace(/^[\s*\-•\d.)\]>]+/, '').trim())
      .filter((line) => line.length > 0);
  }

  // Si es una sola línea con separadores de comas o punto y coma (ej. "Huevos, café, leche, pan")
  if (texto.includes(',') || texto.includes(';')) {
    const separador = texto.includes(';') ? ';' : ',';
    const partes = texto
      .split(separador)
      .map((item) => item.replace(/^[\s*\-•\d.)\]>]+/, '').trim())
      .filter((item) => item.length > 0);
    if (partes.length > 1) {
      return partes;
    }
  }

  const limpio = texto.replace(/^[\s*\-•\d.)\]>]+/, '').trim();
  return limpio ? [limpio] : [];
}

interface ChecklistDinamicaProps {
  titulo: string;
  placeholderNuevoItem: string;
  items: SubtareaItem[];
  onAddItem: (descripcion: string) => void;
  onAddMultipleItems?: (descripciones: string[]) => void;
  onToggleItem: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearAll?: () => void;
  tipoItemPlural?: string;
}

export default function ChecklistDinamica({
  titulo,
  placeholderNuevoItem,
  items,
  onAddItem,
  onAddMultipleItems,
  onToggleItem,
  onRemoveItem,
  onClearAll,
  tipoItemPlural = 'elementos',
}: ChecklistDinamicaProps) {
  const [nuevoTexto, setNuevoTexto] = useState('');
  const [modoPegadoMasivo, setModoPegadoMasivo] = useState(false);
  const [textoMasivo, setTextoMasivo] = useState('');
  const [mensajeFeedback, setMensajeFeedback] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  function mostrarFeedback(msg: string) {
    setMensajeFeedback(msg);
    setTimeout(() => {
      setMensajeFeedback(null);
    }, 3500);
  }

  function handleAgregar() {
    if (!nuevoTexto.trim()) return;

    const itemsParseados = parsearListaTexto(nuevoTexto);
    if (itemsParseados.length > 1) {
      if (onAddMultipleItems) {
        onAddMultipleItems(itemsParseados);
      } else {
        itemsParseados.forEach((item) => onAddItem(item));
      }
      mostrarFeedback(`✨ Se agregaron ${itemsParseados.length} ${tipoItemPlural}`);
    } else if (itemsParseados.length === 1) {
      onAddItem(itemsParseados[0]);
    }

    setNuevoTexto('');

    // Retener el foco deterministamente en navegadores móviles y desktop
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const textoPegado = e.clipboardData.getData('text');
    const itemsDetectados = parsearListaTexto(textoPegado);

    if (itemsDetectados.length > 1) {
      e.preventDefault();
      if (onAddMultipleItems) {
        onAddMultipleItems(itemsDetectados);
      } else {
        itemsDetectados.forEach((item) => onAddItem(item));
      }
      setNuevoTexto('');
      mostrarFeedback(`✨ Se importaron ${itemsDetectados.length} ${tipoItemPlural}`);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

  function handleImportarMasivo() {
    if (!textoMasivo.trim()) return;
    const itemsDetectados = parsearListaTexto(textoMasivo);
    if (itemsDetectados.length > 0) {
      if (onAddMultipleItems) {
        onAddMultipleItems(itemsDetectados);
      } else {
        itemsDetectados.forEach((item) => onAddItem(item));
      }
      setTextoMasivo('');
      setModoPegadoMasivo(false);
      mostrarFeedback(`✨ Se importaron ${itemsDetectados.length} ${tipoItemPlural}`);
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }

  const itemsDetectadosEnTextoMasivo = parsearListaTexto(textoMasivo);

  return (
    <div className="space-y-2">
      {/* Encabezado con Contador y Acciones Rápidas */}
      <div className="flex items-center justify-between">
        <label className="apple-footnote text-label-secondary font-medium flex items-center gap-1.5">
          <ListTodo size={13} className="text-terracotta" />
          <span>
            {titulo} {items.length > 0 && <span className="text-terracotta font-semibold">({items.length})</span>}
          </span>
        </label>

        <div className="flex items-center gap-2">
          {items.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              className="text-[10.5px] text-label-tertiary hover:text-red-500 transition-colors cursor-pointer"
              title="Vaciar lista completa"
            >
              Vaciar
            </button>
          )}

          <button
            type="button"
            onClick={() => setModoPegadoMasivo(!modoPegadoMasivo)}
            className={`text-[10.5px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
              modoPegadoMasivo
                ? 'bg-terracotta text-white border-terracotta shadow-3xs'
                : 'bg-white/50 dark:bg-tertiary/40 border-separator/80 text-label-secondary hover:text-terracotta'
            }`}
          >
            <ClipboardList size={11} />
            <span>{modoPegadoMasivo ? 'Cerrar pegado' : 'Pegar lista'}</span>
          </button>
        </div>
      </div>

      {/* Feedback de Importación en Lote */}
      {mensajeFeedback && (
        <div className="px-3 py-1.5 rounded-xl bg-terracotta/10 dark:bg-olive/15 border border-terracotta/20 dark:border-olive/30 text-[11px] font-semibold text-terracotta dark:text-olive flex items-center gap-1.5 animate-fade-in">
          <Sparkles size={12} className="shrink-0" />
          <span>{mensajeFeedback}</span>
        </div>
      )}

      {/* Panel Desplegable de Pegado Masivo (WhatsApp / Notas) */}
      {modoPegadoMasivo ? (
        <div className="p-3 rounded-2xl bg-white/70 dark:bg-tertiary/60 border border-separator/80 space-y-2 animate-fade-in-up">
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-semibold text-label-primary">
              Pegar texto multilínea (WhatsApp, Notas...)
            </span>
            {itemsDetectadosEnTextoMasivo.length > 0 && (
              <span className="text-[10px] font-bold text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">
                {itemsDetectadosEnTextoMasivo.length} {tipoItemPlural} detectados
              </span>
            )}
          </div>
          <textarea
            rows={4}
            value={textoMasivo}
            onChange={(e) => setTextoMasivo(e.target.value)}
            placeholder={'Ejemplo:\n- Leche entera\n- Huevos campesinos\n- Café en grano\n- Pan integral'}
            className="w-full p-2.5 text-xs rounded-xl bg-white/90 dark:bg-secondary/70 border border-separator/80 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-terracotta resize-none font-mono"
          />
          <div className="flex justify-end items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setModoPegadoMasivo(false);
                setTextoMasivo('');
              }}
              className="px-2.5 py-1 text-xs text-label-secondary hover:text-label-primary cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={itemsDetectadosEnTextoMasivo.length === 0}
              onClick={handleImportarMasivo}
              className="btn-apple-filled px-3 py-1 text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Check size={12} />
              <span>Importar {itemsDetectadosEnTextoMasivo.length > 0 ? itemsDetectadosEnTextoMasivo.length : ''} {tipoItemPlural}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Input para agregar item uno a uno (con retención de foco determinista) */
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={nuevoTexto}
            onChange={(e) => setNuevoTexto(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAgregar();
              }
            }}
            placeholder={placeholderNuevoItem}
            className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-white/70 dark:bg-tertiary/70 border border-separator/80 text-label-primary placeholder:text-label-tertiary focus:outline-none focus:border-terracotta"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleAgregar}
            className="btn-apple-filled px-3 py-2 text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
            title="Agregar producto"
          >
            <Plus size={13} strokeWidth={2.5} />
            <span>Agregar</span>
          </button>
        </div>
      )}

      {/* Lista interactiva */}
      {items.length > 0 && (
        <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-2 rounded-xl bg-white/50 dark:bg-secondary/40 border border-separator/50 text-xs transition-colors hover:bg-white/80 dark:hover:bg-secondary/70"
            >
              <button
                type="button"
                onClick={() => onToggleItem(item.id)}
                className="flex items-center gap-2 flex-1 text-left cursor-pointer group min-w-0"
              >
                {item.completado ? (
                  <CheckSquare size={14} className="text-mint shrink-0" />
                ) : (
                  <Square size={14} className="text-label-tertiary group-hover:text-label-primary shrink-0" />
                )}
                <span
                  className={`truncate ${
                    item.completado ? 'line-through text-label-tertiary' : 'text-label-primary font-medium'
                  }`}
                >
                  {item.descripcion}
                </span>
              </button>
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                className="text-label-tertiary hover:text-red-500 p-1 transition cursor-pointer shrink-0 ml-1"
                title="Eliminar elemento"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
