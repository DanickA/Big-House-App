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
    <aside aria-label="Instalación de la aplicación" className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50 animate-fade-in-up">
      <div className="glass-modal bg-[#FCFAF7]/95 backdrop-blur-xl border border-white/80 rounded-2xl p-4 shadow-xl shadow-[#2D3E24]/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2D3E24] text-[#ECE3D4] flex items-center justify-center shrink-0 shadow-xs">
            <Download size={20} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#2D3E24] leading-tight">Instalar HogarApp</h2>
            <p className="text-xs text-[#736F68]">Acceso rápido desde tu pantalla de inicio</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="px-3 py-1.5 rounded-xl bg-[#2D3E24] hover:bg-[#3A4E30] text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            Instalar
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Cerrar aviso de instalación"
            className="p-1 rounded-lg text-[#9E988F] hover:text-[#2D3E24] transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
