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
      iconContainer: 'bg-terracotta/15 dark:bg-terracotta/20 text-terracotta border border-terracotta/30',
      confirmBtn: 'bg-terracotta hover:bg-terracotta-hover text-white shadow-terracotta/20',
      defaultConfirmText: 'Eliminar',
    },
    warning: {
      icon: AlertTriangle,
      iconContainer: 'bg-[#ce9b8c]/25 dark:bg-clay/20 text-label-primary dark:text-clay border border-[#aa4b50]/30',
      confirmBtn: 'bg-brand-deep hover:bg-terracotta text-white shadow-brand-deep/20',
      defaultConfirmText: 'Continuar',
    },
    info: {
      icon: AlertCircle,
      iconContainer: 'bg-mint/15 dark:bg-mint/20 text-mint border border-mint/30',
      confirmBtn: 'bg-mint hover:bg-mint-hover text-white shadow-mint/20',
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
          <h3 className="apple-title-3 font-semibold text-label-primary">{title}</h3>
          <p className="apple-subhead text-label-secondary px-1">
            {description}
          </p>
        </div>

        {/* Botones de Acción Simétricos (Apple HIG Dialog / Action Sheet) */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex-1 btn-apple-gray text-sm font-semibold justify-center"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={isBusy}
            className={`flex-1 ${
              variant === 'info' ? 'btn-apple-filled-mint' : 'btn-apple-filled'
            } text-sm font-semibold justify-center gap-2`}
          >
            {isBusy ? (
              <>
                <Loader2 size={16} className="animate-spin shrink-0" />
                <span>{variant === 'danger' ? 'Eliminando...' : 'Procesando...'}</span>
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
