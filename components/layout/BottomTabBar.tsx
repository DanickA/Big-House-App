'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  if (pathname === '/login' || pathname === '/register') return null;

  return (
    <nav
      aria-label="Navegación Móvil del Hogar"
      className="sm:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] pointer-events-none"
    >
      {/* Cápsula Flotante (Floating Island - visionOS / iOS 18 style) */}
      <div className="pointer-events-auto max-w-sm w-full bg-[#FDFBF7]/90 dark:bg-[#1C1F1A]/92 backdrop-blur-2xl rounded-full px-2 py-1.5 flex items-center justify-around shadow-2xl border border-[rgba(232,224,210,0.9)] dark:border-[rgba(255,255,255,0.14)]">
        {TAB_ITEMS.map((tab) => {
          const active = tab.isActive(pathname);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`min-w-[54px] min-h-[44px] px-2.5 py-1 rounded-full flex flex-col items-center justify-center gap-0.5 text-[10px] transition-all duration-200 cursor-pointer active:scale-90 ${
                active
                  ? 'bg-[#5F6F52] dark:bg-[#8FA37E] text-white dark:text-[#121411] font-black shadow-2xs'
                  : 'text-[#736F68] dark:text-[#ABA69B] hover:text-[#3A4630] dark:hover:text-[#F5F2EB] font-bold'
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.5 : 2} />
              <span className="tracking-tight leading-none">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
