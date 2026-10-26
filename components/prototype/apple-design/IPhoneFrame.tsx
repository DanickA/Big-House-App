'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Sparkles } from 'lucide-react';
import { SimulatorPortalProvider } from './SimulatorPortalContext';

interface IPhoneFrameProps {
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function IPhoneFrame({ children, footer }: IPhoneFrameProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState('9:41');
  const [islandExpanded, setIslandExpanded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<'100' | '90' | '80'>('90');

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleIsland = () => {
    setIslandExpanded((prev) => !prev);
  };

  const scaleClass = {
    '100': 'scale-100',
    '90': 'scale-90 -my-6',
    '80': 'scale-80 -my-14',
  }[zoomLevel];

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Controles del simulador de dispositivo */}
      <div className="flex items-center gap-3 mb-4 p-2 rounded-2xl bg-tertiary/70 border border-separator text-xs select-none">
        <span className="font-bold text-label-secondary flex items-center gap-1.5 pl-2">
          <span>iPhone 16 Pro (393 × 852)</span>
        </span>

        <div className="flex items-center gap-1 bg-secondary p-1 rounded-xl border border-separator">
          <button
            type="button"
            onClick={() => setZoomLevel('80')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
              zoomLevel === '80'
                ? 'bg-terracotta text-white shadow-xs'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            80%
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel('90')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
              zoomLevel === '90'
                ? 'bg-terracotta text-white shadow-xs'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            90%
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel('100')}
            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
              zoomLevel === '100'
                ? 'bg-terracotta text-white shadow-xs'
                : 'text-label-tertiary hover:text-label-primary'
            }`}
          >
            100%
          </button>
        </div>
      </div>

      {/* Chasis exterior del iPhone 16 Pro */}
      <div
        className={`transition-transform duration-300 origin-top ${scaleClass}`}
      >
        <div className="relative w-[415px] h-[874px] p-[11px] rounded-[56px] bg-[#1f1e22] shadow-[0_35px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.15)] border-[3.5px] border-[#3c3b40] select-none">
          {/* Botón de Acción (Izquierda) */}
          <div className="absolute -left-[5.5px] top-[115px] w-[3px] h-[28px] bg-[#3a393e] rounded-l-md" />
          {/* Botón Volumen + (Izquierda) */}
          <div className="absolute -left-[5.5px] top-[160px] w-[3px] h-[52px] bg-[#3a393e] rounded-l-md" />
          {/* Botón Volumen - (Izquierda) */}
          <div className="absolute -left-[5.5px] top-[224px] w-[3px] h-[52px] bg-[#3a393e] rounded-l-md" />
          {/* Botón Lateral / Encendido (Derecha) */}
          <div className="absolute -right-[5.5px] top-[175px] w-[3px] h-[78px] bg-[#3a393e] rounded-r-md" />

          {/* Pantalla OLED interior del iPhone */}
          <div
            id="iphone-screen-root"
            ref={screenRef}
            className="w-full h-full rounded-[46px] overflow-hidden bg-system relative flex flex-col shadow-inner"
          >
            {/* Barra de Estado iOS 18 (Status Bar) */}
            <div className="shrink-0 h-[48px] px-7 pt-2 flex items-center justify-between text-[13px] font-semibold text-label-primary z-40 select-none relative">
              {/* Hora en vivo */}
              <span className="tabular-nums tracking-tight font-medium pl-0.5">
                {currentTime}
              </span>

              {/* Dynamic Island interactiva */}
              <div
                onClick={toggleIsland}
                className={`absolute top-[10px] left-1/2 -translate-x-1/2 bg-black rounded-full cursor-pointer transition-all duration-300 ease-out flex items-center justify-between shadow-md z-50 text-white ${
                  islandExpanded
                    ? 'w-[220px] h-[38px] px-3'
                    : 'w-[116px] h-[30px] px-2.5'
                }`}
                title="Toca para interactuar con la Dynamic Island"
              >
                {islandExpanded ? (
                  <div className="w-full flex items-center justify-between text-[11px] font-medium animate-fade-in">
                    <span className="flex items-center gap-1.5 text-mint">
                      <Sparkles size={12} />
                      <span>BigHouse App</span>
                    </span>
                    <span className="text-[10px] text-white/70">iOS 18</span>
                  </div>
                ) : (
                  <>
                    {/* Lente de la cámara frontal */}
                    <div className="w-3 h-3 rounded-full bg-[#111] border border-white/10 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1a2035]/80" />
                    </div>
                    {/* Sensor TrueDepth / micrófonos */}
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-emerald-400" />
                    </div>
                  </>
                )}
              </div>

              {/* Indicadores: Señal celular, Wi-Fi y Batería */}
              <div className="flex items-center gap-2 pr-0.5 text-label-primary">
                <Signal size={13} className="text-label-primary" />
                <Wifi size={13} className="text-label-primary" />
                <div className="flex items-center gap-0.5">
                  <span className="text-[11px] font-bold tabular-nums">100</span>
                  <BatteryMedium size={15} className="text-label-primary" />
                </div>
              </div>
            </div>

            {/* Contenedor de la aplicación con scroll nativo iOS */}
            <div className="flex-1 overflow-y-auto overscroll-y-contain relative px-3 py-2 scrollbar-none">
              <SimulatorPortalProvider
                value={{
                  portalContainer: mounted ? screenRef.current : null,
                  isInsidePhone: true,
                }}
              >
                {children}
              </SimulatorPortalProvider>
            </div>

            {/* Pinned Bottom Tab Bar slot */}
            {footer}

            {/* iOS Home Indicator Bar */}
            <div className="shrink-0 h-[22px] flex items-center justify-center pb-1 pointer-events-none z-40 bg-system/70 backdrop-blur-xs">
              <div className="w-[134px] h-[5px] bg-label-primary/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
