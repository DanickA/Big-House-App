'use client';

import React from 'react';
import { BreakUiMode } from './fixtures';
import { Bug, Sparkles, User, Inbox } from 'lucide-react';

interface BreakUiToolbarProps {
  currentMode: BreakUiMode;
  onModeChange: (mode: BreakUiMode) => void;
  isHidden?: boolean;
}

export default function BreakUiToolbar({
  currentMode,
  onModeChange,
  isHidden = false,
}: BreakUiToolbarProps) {
  const options: { id: BreakUiMode; label: string; icon: React.ReactNode; tag: string }[] = [
    { id: 'demo', label: 'Demo data', icon: <Sparkles size={13} />, tag: 'Estándar' },
    { id: 'worst', label: 'Worst-case', icon: <Bug size={13} />, tag: 'Estrés' },
    { id: 'single', label: '1 miembro', icon: <User size={13} />, tag: 'Plural' },
    { id: 'empty', label: 'Lista vacía', icon: <Inbox size={13} />, tag: 'Zero' },
  ];

  const handleSelect = (mode: BreakUiMode) => {
    onModeChange(mode);
  };

  return (
    <aside
      aria-label="Selector de datos break-ui"
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-[96vw] transition-all duration-300 ease-out ${
        isHidden
          ? 'opacity-0 pointer-events-none translate-y-6 scale-95'
          : 'opacity-100 pointer-events-auto translate-y-0 scale-100'
      }`}
    >
      <div className="bg-[#1c1c1e]/90 text-white dark:bg-black/85 backdrop-blur-xl px-2 py-1.5 rounded-full shadow-2xl border border-white/15 flex items-center gap-1">
        <div className="hidden sm:flex items-center gap-1.5 px-2 text-[11px] font-semibold text-white/50 border-r border-white/10 mr-1">
          <span>/break-ui</span>
        </div>

        {options.map((opt) => {
          const isActive = currentMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleSelect(opt.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer select-none active:scale-95 ${
                isActive
                  ? 'bg-white text-black shadow-sm'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              }`}
            >
              {opt.icon}
              <span className="whitespace-nowrap">{opt.label}</span>
            </button>

          );
        })}
      </div>
    </aside>
  );
}
