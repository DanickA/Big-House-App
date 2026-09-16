import React from 'react';

export default function CalendarioLoading() {
  return (
    <div className="relative min-h-screen bg-system text-label-primary p-4 sm:p-6 md:p-10 overflow-hidden select-none">
      <div className="ambient-glow-olive top-[-50px] right-[-50px] opacity-40" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px] opacity-30" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* Enlace de regreso */}
        <div className="w-24 h-4 rounded-full bg-[#736F68]/20 dark:bg-white/10 animate-pulse" />

        {/* Encabezado del Calendario */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="w-48 h-8 rounded-2xl bg-[#5F6F52]/20 dark:bg-white/10 animate-pulse" />
            <div className="w-64 h-3.5 rounded-full bg-[#736F68]/15 dark:bg-white/10 animate-pulse" />
          </div>
          <div className="w-36 h-10 rounded-2xl bg-[#5F6F52]/30 dark:bg-white/10 animate-pulse" />
        </div>

        {/* Controles y Filtros */}
        <div className="glass-card rounded-2xl p-3 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#736F68]/15 dark:bg-white/10" />
            <div className="w-32 h-6 rounded-lg bg-[#736F68]/15 dark:bg-white/10" />
            <div className="w-8 h-8 rounded-xl bg-[#736F68]/15 dark:bg-white/10" />
          </div>
          <div className="w-24 h-8 rounded-xl bg-[#736F68]/15 dark:bg-white/10" />
        </div>

        {/* Grid Calendario Skeleton */}
        <div className="glass-card rounded-3xl p-4 sm:p-6 space-y-4 animate-pulse">
          <div className="grid grid-cols-7 gap-2 pb-2 border-b border-[rgba(115,111,104,0.1)]">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-4 rounded bg-[#736F68]/15 dark:bg-white/10 mx-auto w-8" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {[...Array(35)].map((_, i) => (
              <div key={i} className="h-16 sm:h-24 rounded-2xl bg-[#736F68]/10 dark:bg-white/5 p-2 flex flex-col justify-between">
                <div className="w-4 h-4 rounded-full bg-[#736F68]/20 dark:bg-white/10" />
                {i % 4 === 0 && (
                  <div className="w-full h-3 rounded-md bg-[#5F6F52]/25 dark:bg-white/10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
