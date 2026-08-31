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

  const handleLogout = useCallback(async () => {
    if (pathname === '/login') return;
    await logout();
    router.push('/login?reason=inactivity');
    router.refresh();
  }, [pathname, router]);

  const resetTimer = useCallback(() => {
    if (!isLoggedIn || pathname === '/login') return;

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

    // Iniciar temporizador
    resetTimer();

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
