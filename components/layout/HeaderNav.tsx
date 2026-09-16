'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/actions/auth';
import { SessionPayload } from '@/lib/session';
import ThemeToggle from './ThemeToggle';
import UserMenuDropdown from './UserMenuDropdown';
import { Home, Sprout, Users, LogIn, Receipt, Calendar } from 'lucide-react';

interface HeaderNavProps {
  user: SessionPayload | null;
}

export default function HeaderNav({ user }: HeaderNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/login' || pathname === '/register') return null;

  async function handleLogout() {
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 px-4 sm:px-6 pt-3 pb-2">
      <div className="max-w-6xl mx-auto glass-card rounded-[1.75rem] px-4 sm:px-6 h-15 flex items-center justify-between">
        
        {/* Logo de la Aplicación */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#5F6F52] dark:bg-[#8FA37E] text-white dark:text-[#121411] font-black text-sm flex items-center justify-center group-hover:scale-105 transition shadow-2xs">
              H
            </div>
            <span className="font-extrabold text-base text-[#3A4630] dark:text-[#F5F2EB] tracking-tight">
              HogarApp
            </span>
          </Link>

          {/* Navegación Desktop: Segmented Control (Apple HIG) */}
          <nav
            aria-label="Navegación Principal"
            className="hidden sm:flex items-center bg-[#F4EFE6]/70 dark:bg-[#282C25]/70 p-1 rounded-2xl border border-[rgba(217,206,188,0.5)] dark:border-[rgba(255,255,255,0.08)]"
          >
            <Link
              href="/"
              prefetch={true}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                pathname === '/'
                  ? 'bg-white dark:bg-[#1C1F1A] text-[#3A4630] dark:text-[#F5F2EB] shadow-2xs font-extrabold'
                  : 'text-[#736F68] dark:text-[#ABA69B] hover:text-[#3A4630] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <Home size={13} strokeWidth={2.2} />
              <span>Lobby</span>
            </Link>

            <Link
              href="/calendario"
              prefetch={true}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                pathname.startsWith('/calendario')
                  ? 'bg-white dark:bg-[#1C1F1A] text-[#3A4630] dark:text-[#F5F2EB] shadow-2xs font-extrabold'
                  : 'text-[#736F68] dark:text-[#ABA69B] hover:text-[#3A4630] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <Calendar size={13} strokeWidth={2.2} />
              <span>Agenda</span>
            </Link>

            <Link
              href="/plantas"
              prefetch={true}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                pathname.startsWith('/plantas')
                  ? 'bg-white dark:bg-[#1C1F1A] text-[#3A4630] dark:text-[#F5F2EB] shadow-2xs font-extrabold'
                  : 'text-[#736F68] dark:text-[#ABA69B] hover:text-[#3A4630] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <Sprout size={13} strokeWidth={2.2} />
              <span>Plantas</span>
            </Link>

            <Link
              href="/finanzas"
              prefetch={true}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                pathname.startsWith('/finanzas') || pathname.startsWith('/servicios')
                  ? 'bg-white dark:bg-[#1C1F1A] text-[#3A4630] dark:text-[#F5F2EB] shadow-2xs font-extrabold'
                  : 'text-[#736F68] dark:text-[#ABA69B] hover:text-[#3A4630] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <Receipt size={13} strokeWidth={2.2} />
              <span>Cuentas</span>
            </Link>

            <Link
              href="/usuarios"
              prefetch={true}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
                pathname.startsWith('/usuarios')
                  ? 'bg-white dark:bg-[#1C1F1A] text-[#3A4630] dark:text-[#F5F2EB] shadow-2xs font-extrabold'
                  : 'text-[#736F68] dark:text-[#ABA69B] hover:text-[#3A4630] dark:hover:text-[#F5F2EB]'
              }`}
            >
              <Users size={13} strokeWidth={2.2} />
              <span>Miembros</span>
            </Link>
          </nav>
        </div>

        {/* Acciones de la Cabecera (Theme + User Dropdown) */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Conmutador de Tema (Apple HIG) */}
          <ThemeToggle />

          {user ? (
            /* Menú Desplegable de Usuario (Apple HIG Pull-Down Menu) */
            <UserMenuDropdown user={user} onLogout={handleLogout} />
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold px-4 py-2 bg-[#5F6F52] dark:bg-[#8FA37E] hover:bg-[#4E5D43] text-white dark:text-[#121411] rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#5F6F52]/20"
            >
              <LogIn size={13} strokeWidth={2.2} />
              <span>Ingresar</span>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
}
