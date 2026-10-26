'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  AlertCircle,
  FileText,
  Smartphone,
  Monitor,
  QrCode,
} from 'lucide-react';

export type PrototypeMode = 'actual' | 'apple-craft';
export type ViewportMode = 'fullscreen' | 'iphone';

interface PrototypeHeaderProps {
  currentMode: PrototypeMode;
  onModeChange: (mode: PrototypeMode) => void;
  viewportMode: ViewportMode;
  onViewportChange: (mode: ViewportMode) => void;
  onOpenAudit: () => void;
  onOpenMobileTesting: () => void;
}

export default function PrototypeHeader({
  currentMode,
  onModeChange,
  viewportMode,
  onViewportChange,
  onOpenAudit,
  onOpenMobileTesting,
}: PrototypeHeaderProps) {
  const handleSelectMode = (mode: PrototypeMode) => {
    onModeChange(mode);
  };

  const handleSelectViewport = (viewport: ViewportMode) => {
    onViewportChange(viewport);
  };

  return (
    <header className="space-y-4 pb-4 border-b border-separator">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="touch-target w-9 h-9 rounded-xl bg-tertiary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer active:scale-95 transition-transform"
            title="Volver al Lobby"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="apple-title-2 font-bold text-label-primary tracking-tight">
                Laboratorio Apple Design &amp; Craft
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-terracotta/15 text-terracotta border border-terracotta/25">
                Prototipo
              </span>
            </div>
            <p className="apple-footnote text-label-tertiary mt-0.5">
              Comparativa física en tiempo real: Actual vs Apple HIG + Emil Kowalski
            </p>
          </div>
        </div>

        {/* Acciones principales de cabecera */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Botón para abrir modal de pruebas en celular real */}
          <button
            type="button"
            onClick={onOpenMobileTesting}
            className="touch-target px-3 py-1.5 rounded-xl bg-terracotta text-white text-xs font-bold shadow-xs hover:bg-terracotta-hover flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <QrCode size={14} />
            <span>📱 Probar en Celular</span>
          </button>

          {/* Botón para abrir la auditoría */}
          <button
            type="button"
            onClick={onOpenAudit}
            className="touch-target px-3 py-1.5 rounded-xl bg-tertiary border border-separator text-xs font-semibold text-label-primary hover:bg-tertiary-hover flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform"
          >
            <FileText size={14} className="text-terracotta" />
            <span>Ver Tabla de Auditoría</span>
          </button>
        </div>
      </div>

      {/* Selectores de Modo y Viewport */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Selector de Modos (Segmented Control Apple HIG: Modo A vs Modo B) */}
        <div
          role="group"
          aria-label="Selector de modo del prototipo"
          className="grid grid-cols-2 p-1 rounded-2xl bg-tertiary/80 border border-separator flex-1 max-w-lg"
        >
          <button
            type="button"
            aria-pressed={currentMode === 'actual'}
            onClick={() => handleSelectMode('actual')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors select-none ${
              currentMode === 'actual'
                ? 'bg-secondary text-label-primary shadow-sm border border-separator'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            <AlertCircle size={14} className={currentMode === 'actual' ? 'text-amber-500' : ''} />
            <span>Modo A · Actual</span>
          </button>

          <button
            type="button"
            aria-pressed={currentMode === 'apple-craft'}
            onClick={() => handleSelectMode('apple-craft')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors select-none ${
              currentMode === 'apple-craft'
                ? 'bg-secondary text-label-primary shadow-sm border border-separator'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            <Sparkles size={14} className={currentMode === 'apple-craft' ? 'text-mint' : ''} />
            <span>Modo B · Apple Design + Craft</span>
          </button>
        </div>

        {/* Selector de Dispositivo (Segmented Control: Pantalla Completa vs iPhone 16 Pro) */}
        <div
          role="group"
          aria-label="Selector de visualización de dispositivo"
          className="grid grid-cols-2 p-1 rounded-2xl bg-tertiary/80 border border-separator md:w-80"
        >
          <button
            type="button"
            aria-pressed={viewportMode === 'fullscreen'}
            onClick={() => handleSelectViewport('fullscreen')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors select-none ${
              viewportMode === 'fullscreen'
                ? 'bg-secondary text-label-primary shadow-sm border border-separator'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            <Monitor size={14} />
            <span>Pantalla Completa</span>
          </button>

          <button
            type="button"
            aria-pressed={viewportMode === 'iphone'}
            onClick={() => handleSelectViewport('iphone')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors select-none ${
              viewportMode === 'iphone'
                ? 'bg-secondary text-label-primary shadow-sm border border-separator'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            <Smartphone size={14} className={viewportMode === 'iphone' ? 'text-mint' : ''} />
            <span>iPhone 16 Pro</span>
          </button>
        </div>
      </div>
    </header>
  );
}
