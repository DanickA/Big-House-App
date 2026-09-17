'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { logout } from '@/actions/auth';

interface InactivityTimerProps {
  timeoutMinutes?: number;
  isLoggedIn: boolean;
}

export default function InactivityTimer({
  timeoutMinutes = 15,
  isLoggedIn,
}: InactivityTimerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastResetRef = useRef<number>(0);

  const handleLogout = useCallback(async () => {
    if (pathname === '/login') return;
    await logout();
    router.push('/login?reason=inactivity');
    router.refresh();
  }, [pathname, router]);

  const resetTimer = useCallback((force = false) => {
    if (!isLoggedIn || pathname === '/login') return;

    const now = Date.now();
    // Throttle de 2000ms para evitar saturar el Main Thread en scrolls o eventos táctiles continuos
    if (!force && now - lastResetRef.current < 2000) return;
    lastResetRef.current = now;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      handleLogout();
    }, timeoutMinutes * 60 * 1000);
  }, [isLoggedIn, pathname, timeoutMinutes, handleLogout]);

  useEffect(() => {
    if (!isLoggedIn || pathname === '/login') {
      if (timerRef.current) clearTimeout(timerRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];

    // Iniciar temporizador forzando el primer registro
    resetTimer(true);

    // Agregar listeners
    const onActivity = () => resetTimer();
    events.forEach((event) => {
      window.addEventListener(event, onActivity, { passive: true });
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, onActivity);
      });
    };
  }, [isLoggedIn, pathname, resetTimer]);

  return null;
}
