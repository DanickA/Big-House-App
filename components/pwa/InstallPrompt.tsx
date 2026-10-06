'use client';

import { useState, useEffect, useSyncExternalStore } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function subscribeStandalone(callback: () => void) {
  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getStandaloneSnapshot() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getStandaloneServerSnapshot() {
  return false;
}

export default function InstallPrompt() {
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot
  );
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    // Verificar si el usuario ya descartó el aviso recientemente
    const dismissed = localStorage.getItem('pwa_install_dismissed');
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 7 * 24 * 60 * 60 * 1000) {
      return; // No volver a mostrar por 7 días
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, [isStandalone]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] El usuario aceptó la instalación');
    } else {
      console.log('[PWA] El usuario canceló la instalación');
    }

    setDeferredPrompt(null);
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('pwa_install_dismissed', Date.now().toString());
  };

  if (isStandalone || !isVisible) {
    return null;
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Instalación de la aplicación"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs animate-fade-in"
    >
      {/* Fondo para descartar al tocar fuera */}
      <div className="fixed inset-0 -z-10" onClick={handleDismiss} />

      <div className="w-full sm:max-w-md bg-secondary/95 backdrop-blur-2xl border-t sm:border border-separator rounded-t-[2rem] sm:rounded-[2rem] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl animate-fade-in-up space-y-4">
        {/* Asa táctil superior estilo iOS Sheet */}
        <div className="sm:hidden w-10 h-1.5 bg-separator-opaque rounded-full mx-auto -mt-1 mb-2" />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-terracotta/15 border border-terracotta/30 text-terracotta flex items-center justify-center shrink-0 shadow-2xs">
              <Download size={22} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="apple-headline font-semibold text-label-primary leading-tight">
                Instalar HogarApp
              </h2>
              <p className="apple-footnote text-label-secondary font-normal">
                Acceso rápido desde tu pantalla de inicio
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Cerrar aviso de instalación"
            className="w-11 h-11 rounded-full bg-tertiary text-label-secondary hover:text-label-primary flex items-center justify-center transition active:scale-90"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleDismiss}
            className="flex-1 btn-apple-gray text-xs font-semibold py-2.5 min-h-[44px]"
          >
            Ahora no
          </button>
          <button
            type="button"
            onClick={handleInstallClick}
            className="flex-1 btn-apple-filled text-xs font-semibold py-2.5 min-h-[44px]"
          >
            Instalar app
          </button>
        </div>
      </div>
    </div>
  );
}
