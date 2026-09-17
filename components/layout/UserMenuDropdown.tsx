'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { SessionPayload } from '@/lib/session';
import { Users, RefreshCw, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';

interface UserMenuDropdownProps {
  user: SessionPayload;
  onLogout: () => Promise<void> | void;
}

export default function UserMenuDropdown({ user, onLogout }: UserMenuDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botón Disparador del Menú (Apple HIG Touch Target >= 44pt) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Menú de ${user.nombre}`}
        className="min-h-[44px] flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl bg-tertiary/60 hover:bg-tertiary border border-separator transition cursor-pointer active:scale-[0.98] shadow-2xs group"
      >
        <span className="w-7 h-7 rounded-xl bg-terracotta text-white text-xs font-bold flex items-center justify-center shadow-xs">
          {user.nombre.charAt(0).toUpperCase()}
        </span>
        <span className="apple-footnote font-semibold text-label-primary max-w-[80px] sm:max-w-[120px] truncate">
          {user.nombre}
        </span>
        <ChevronDown
          size={13}
          strokeWidth={2.4}
          className={`text-label-secondary transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Desplegable Glassmorphic (Apple HIG Pull-Down Menu) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl bg-white/95 dark:bg-[#201C1A]/95 backdrop-blur-2xl border border-separator shadow-2xl p-2 z-50 animate-fade-in-up">
          {/* Cabecera del Usuario */}
          <div className="p-3 bg-tertiary rounded-xl mb-1 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-terracotta text-white text-sm font-bold flex items-center justify-center shrink-0 shadow-xs">
              {user.nombre.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="apple-footnote font-semibold text-label-primary truncate">
                {user.nombre}
              </p>
              <p className="apple-caption-1 text-label-secondary truncate">
                {user.email}
              </p>
              <div className="inline-flex items-center gap-1 apple-caption-2 font-semibold text-mint mt-0.5">
                <ShieldCheck size={11} />
                <span>Sesión activa</span>
              </div>
            </div>
          </div>

          <div className="space-y-0.5" role="group">
            {/* Ir a Gestión de Miembros */}
            <Link
              href="/usuarios"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] apple-footnote font-semibold text-label-primary hover:bg-tertiary rounded-xl transition cursor-pointer active:scale-[0.98]"
            >
              <Users size={15} className="text-terracotta shrink-0" />
              <span>Miembros del hogar</span>
            </Link>

            {/* Cambiar de Usuario */}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] apple-footnote font-medium text-label-secondary hover:text-label-primary hover:bg-tertiary rounded-xl transition cursor-pointer active:scale-[0.98]"
            >
              <RefreshCw size={15} className="shrink-0" />
              <span>Cambiar de miembro...</span>
            </Link>
          </div>

          {/* Separador de Sistema */}
          <div className="h-px bg-separator my-1.5" role="separator" />

          {/* Acción Destructiva: Cerrar Sesión */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] apple-footnote font-semibold text-terracotta hover:bg-[#ce9b8c]/20 hover:text-terracotta dark:hover:bg-terracotta/20 rounded-xl transition cursor-pointer active:scale-[0.98]"
          >
            <LogOut size={15} strokeWidth={2.2} className="shrink-0" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
