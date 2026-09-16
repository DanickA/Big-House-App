'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Trash2, AlertTriangle, AlertCircle, HelpCircle, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText,
  cancelText = 'Cancelar',
  variant = 'danger',
  isLoading: propLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = 'unset';
        window.removeEventListener('keydown', handleKeyDown);
      };
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  const isBusy = propLoading || localLoading;

  async function handleConfirmClick() {
    try {
      setLocalLoading(true);
      await onConfirm();
    } finally {
      setLocalLoading(false);
    }
  }

  // Estilos y elementos según la variante
  const variantConfig = {
    danger: {
      icon: Trash2,
      iconContainer: 'bg-[#C86242]/15 dark:bg-[#E07D63]/20 text-[#C86242] dark:text-[#E07D63] border border-[#C86242]/30',
      confirmBtn: 'bg-[#C86242] dark:bg-[#E07D63] hover:bg-[#B05336] dark:hover:bg-[#E8917A] text-white dark:text-[#121411] shadow-[#C86242]/20',
      defaultConfirmText: 'Eliminar',
    },
    warning: {
      icon: AlertTriangle,
      iconContainer: 'bg-[#D97706]/15 dark:bg-[#F59E0B]/20 text-[#D97706] dark:text-[#F59E0B] border border-[#D97706]/30',
      confirmBtn: 'bg-[#D97706] dark:bg-[#F59E0B] hover:bg-[#B45309] dark:hover:bg-[#FBBF24] text-white dark:text-[#121411] shadow-[#D97706]/20',
      defaultConfirmText: 'Continuar',
    },
    info: {
      icon: AlertCircle,
      iconContainer: 'bg-[#5F6F52]/15 dark:bg-[#8FA37E]/20 text-[#5F6F52] dark:text-[#8FA37E] border border-[#5F6F52]/30',
      confirmBtn: 'bg-[#5F6F52] dark:bg-[#8FA37E] hover:bg-[#4E5D43] dark:hover:bg-[#A2B591] text-white dark:text-[#121411] shadow-[#5F6F52]/20',
      defaultConfirmText: 'Aceptar',
    },
  }[variant];

  const IconComponent = variantConfig.icon;
  const textoBotonConfirmar = confirmText || variantConfig.defaultConfirmText;

  return createPortal(
    <div className="fixed inset-0 z-[10000] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Fondo clicable para cerrar */}
      <div className="fixed inset-0 -z-10" onClick={!isBusy ? onClose : undefined} />

      {/* Contenedor del Modal Squircle */}
      <div className="relative glass-modal w-full max-w-md rounded-[2.5rem] p-6 sm:p-7 shadow-2xl animate-fade-in-up space-y-5 text-center my-auto">
        {/* Icono de Cabecera en cápsula squircle */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-xs ${variantConfig.iconContainer}`}
        >
          <IconComponent size={26} strokeWidth={2.3} />
        </div>

        {/* Título y Descripción */}
        <div className="space-y-2">
          <h3 className="text-xl font-black text-label-primary tracking-tight">{title}</h3>
          <p className="text-sm text-label-secondary font-medium leading-relaxed px-1">
            {description}
          </p>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 py-3 px-4 rounded-2xl border border-separator bg-white/70 dark:bg-[#1C1F1A] hover:bg-[#EEF2EA] dark:hover:bg-[#282C25] text-label-secondary hover:text-label-primary font-bold text-sm transition cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isBusy}
            className={`flex-1 py-3 px-4 rounded-2xl font-black text-sm transition cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-2 disabled:opacity-50 ${variantConfig.confirmBtn}`}
          >
            {isBusy ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Procesando...</span>
              </>
            ) : (
              <span>{textoBotonConfirmar}</span>
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
