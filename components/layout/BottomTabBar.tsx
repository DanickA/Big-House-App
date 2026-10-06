'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar, Sprout, Receipt, Users } from 'lucide-react';

const TAB_ITEMS = [
  {
    href: '/',
    label: 'Lobby',
    icon: Home,
    isActive: (pathname: string) => pathname === '/',
  },
  {
    href: '/calendario',
    label: 'Agenda',
    icon: Calendar,
    isActive: (pathname: string) => pathname.startsWith('/calendario'),
  },
  {
    href: '/plantas',
    label: 'Plantas',
    icon: Sprout,
    isActive: (pathname: string) => pathname.startsWith('/plantas'),
  },
  {
    href: '/finanzas',
    label: 'Cuentas',
    icon: Receipt,
    isActive: (pathname: string) => pathname.startsWith('/finanzas') || pathname.startsWith('/servicios'),
  },
  {
    href: '/usuarios',
    label: 'Miembros',
    icon: Users,
    isActive: (pathname: string) => pathname.startsWith('/usuarios'),
  },
];

export default function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [optimisticHref, setOptimisticHref] = useState<string | null>(null);

  // Sincronizar estado cuando la ruta real cambie
  useEffect(() => {
    setOptimisticHref(null);
  }, [pathname]);

  // Precargar todas las rutas principales al montar para transiciones inmediatas
  useEffect(() => {
    TAB_ITEMS.forEach((tab) => {
      router.prefetch(tab.href);
    });
  }, [router]);

  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav
      aria-label="Navegación Móvil del Hogar"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-secondary/80 backdrop-blur-2xl border-t border-separator pb-safe h-[calc(49px+env(safe-area-inset-bottom,0px))] flex items-center justify-around px-2 select-none"
    >
      {TAB_ITEMS.map((tab) => {
        // Si hay una ruta pendiente seleccionada optimísticamente, úsala para retroalimentación instantánea
        const active = optimisticHref ? tab.isActive(optimisticHref) : tab.isActive(pathname);
        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={true}
            onTouchStart={() => {
              router.prefetch(tab.href);
              if (tab.href !== pathname) setOptimisticHref(tab.href);
            }}
            onMouseEnter={() => router.prefetch(tab.href)}
            onClick={() => {
              if (tab.href !== pathname) setOptimisticHref(tab.href);
            }}
            aria-current={active ? 'page' : undefined}
            className={`flex-1 h-full min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 text-[10.5px] transition-colors duration-150 cursor-pointer active:scale-95 touch-manipulation ${
              active
                ? 'text-terracotta font-semibold'
                : 'text-label-tertiary hover:text-label-primary font-medium'
            }`}
          >
            <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
            <span className="tracking-tight leading-none">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
