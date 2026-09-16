import React from 'react';

export default function Loading() {
  return (
    <div className="relative min-h-[80vh] p-4 sm:p-6 md:p-10 overflow-hidden select-none">
      {/* Luces Ambientales Suaves */}
      <div className="ambient-glow-olive top-[-40px] left-[-40px] opacity-50" />
      <div className="ambient-glow-terracotta bottom-[20%] right-[-40px] opacity-40" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6">
        {/* Skeleton Header */}
        <div className="space-y-2">
          <div className="w-28 h-3.5 rounded-full bg-[#736F68]/15 dark:bg-white/10 animate-pulse" />
          <div className="w-48 sm:w-64 h-8 rounded-2xl bg-[#5F6F52]/20 dark:bg-white/10 animate-pulse" />
          <div className="w-36 h-3 rounded-full bg-[#736F68]/15 dark:bg-white/10 animate-pulse" />
        </div>

        {/* Skeleton Bento Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-2">
          <div className="glass-card rounded-3xl p-6 h-48 flex flex-col justify-between animate-pulse">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#5F6F52]/20 dark:bg-white/10" />
              <div className="w-16 h-4 rounded-full bg-[#736F68]/15 dark:bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="w-3/4 h-5 rounded-xl bg-[#736F68]/20 dark:bg-white/10" />
              <div className="w-1/2 h-3.5 rounded-full bg-[#736F68]/15 dark:bg-white/10" />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 h-48 flex flex-col justify-between animate-pulse">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#C86242]/20 dark:bg-white/10" />
              <div className="w-16 h-4 rounded-full bg-[#736F68]/15 dark:bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="w-3/4 h-5 rounded-xl bg-[#736F68]/20 dark:bg-white/10" />
              <div className="w-1/2 h-3.5 rounded-full bg-[#736F68]/15 dark:bg-white/10" />
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 h-48 sm:col-span-2 lg:col-span-1 flex flex-col justify-between animate-pulse">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-[#D97706]/20 dark:bg-white/10" />
              <div className="w-16 h-4 rounded-full bg-[#736F68]/15 dark:bg-white/10" />
            </div>
            <div className="space-y-2">
              <div className="w-3/4 h-5 rounded-xl bg-[#736F68]/20 dark:bg-white/10" />
              <div className="w-1/2 h-3.5 rounded-full bg-[#736F68]/15 dark:bg-white/10" />
            </div>
          </div>
        </div>

        {/* Skeleton Lista / Bloque Inferior */}
        <div className="glass-card rounded-3xl p-6 h-64 space-y-4 animate-pulse">
          <div className="w-40 h-5 rounded-xl bg-[#736F68]/20 dark:bg-white/10" />
          <div className="space-y-3 pt-2">
            <div className="w-full h-12 rounded-2xl bg-[#736F68]/10 dark:bg-white/5" />
            <div className="w-full h-12 rounded-2xl bg-[#736F68]/10 dark:bg-white/5" />
            <div className="w-full h-12 rounded-2xl bg-[#736F68]/10 dark:bg-white/5" />
          </div>
        </div>
      </div>
    </div>
  );
}
