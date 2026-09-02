'use client';

import { useEffect } from 'react';

export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registrado con éxito. Scope:', registration.scope);
          })
          .catch((error) => {
            console.error('[PWA] Error al registrar el Service Worker:', error);
          });
      });
    }
  }, []);

  return null;
}
