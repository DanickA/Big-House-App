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
      {/* Botón Disparador del Menú (Apple HIG Touch Target) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        title={`Menú de ${user.nombre}`}
        className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-2xl bg-[#EEF2EA]/90 dark:bg-[#282C25]/90 hover:bg-[#E3EADc] dark:hover:bg-[#33382F] border border-[#DCE7D3] dark:border-[rgba(255,255,255,0.12)] transition cursor-pointer active:scale-95 shadow-2xs group"
      >
        <span className="w-7 h-7 rounded-xl bg-[#5F6F52] dark:bg-[#8FA37E] text-white dark:text-[#121411] text-xs font-black flex items-center justify-center shadow-xs">
          {user.nombre.charAt(0).toUpperCase()}
        </span>
        <span className="text-xs font-extrabold text-[#3A4630] dark:text-[#F5F2EB] max-w-[80px] sm:max-w-[120px] truncate">
          {user.nombre}
        </span>
        <ChevronDown
          size={13}
          strokeWidth={2.4}
          className={`text-[#736F68] dark:text-[#ABA69B] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Desplegable Glassmorphic (Apple HIG Pull-Down Menu) */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2.5 w-64 rounded-2xl bg-[#FDFBF7]/95 dark:bg-[#1C1F1A]/95 backdrop-blur-2xl border border-[rgba(232,224,210,0.9)] dark:border-[rgba(255,255,255,0.14)] shadow-2xl p-2 z-50 animate-fade-in-up">
          {/* Cabecera del Usuario */}
          <div className="p-3 bg-[#F4EFE6]/70 dark:bg-[#282C25]/70 rounded-xl mb-1 flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5F6F52] to-[#3A4630] dark:from-[#8FA37E] dark:to-[#5F6F52] text-white dark:text-[#121411] text-sm font-black flex items-center justify-center shrink-0 shadow-xs">
              {user.nombre.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-black text-[#3A4630] dark:text-[#F5F2EB] truncate">
                {user.nombre}
              </p>
              <p className="text-[11px] text-[#736F68] dark:text-[#ABA69B] truncate">
                {user.email}
              </p>
              <div className="inline-flex items-center gap-1 text-[10px] font-bold text-[#5F6F52] dark:text-[#8FA37E] mt-0.5">
                <ShieldCheck size={11} />
                <span>Sesión Activa</span>
              </div>
            </div>
          </div>

          <div className="space-y-0.5">
            {/* Ir a Gestión de Miembros */}
            <Link
              href="/usuarios"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-[#3A4630] dark:text-[#F5F2EB] hover:bg-[#EEF2EA] dark:hover:bg-[#282C25] rounded-xl transition cursor-pointer"
            >
              <Users size={14} className="text-[#5F6F52] dark:text-[#8FA37E]" />
              <span>Miembros del Hogar</span>
            </Link>

            {/* Cambiar de Usuario */}
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-[#736F68] dark:text-[#ABA69B] hover:text-[#3A4630] dark:hover:text-[#F5F2EB] hover:bg-[#EEF2EA] dark:hover:bg-[#282C25] rounded-xl transition cursor-pointer"
            >
              <RefreshCw size={14} />
              <span>Cambiar de Miembro</span>
            </Link>
          </div>

          {/* Separador de Sistema */}
          <div className="h-px bg-[#E8E0D2] dark:bg-[rgba(255,255,255,0.1)] my-1.5" />

          {/* Acción Destructiva: Cerrar Sesión */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-bold text-[#B84626] dark:text-[#E07D63] hover:bg-[#FAE2D8]/60 dark:hover:bg-[#3D201A]/60 rounded-xl transition cursor-pointer"
          >
            <LogOut size={14} strokeWidth={2.2} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      )}
    </div>
  );
}
