'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/actions/auth';
import { SessionPayload } from '@/lib/session';
import { Home, Sprout, Users, RefreshCw, LogOut, LogIn, Receipt } from 'lucide-react';

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
      <div className="max-w-6xl mx-auto glass-card bg-white/80 backdrop-blur-xl border border-white/70 rounded-[1.75rem] px-4 sm:px-6 h-15 flex items-center justify-between shadow-lg shadow-[#3A4630]/5">
        
        {/* Logo & Links */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-[#5F6F52] text-white font-black text-sm flex items-center justify-center group-hover:scale-105 transition shadow-2xs">
              H
            </div>
            <span className="font-extrabold text-base text-[#3A4630] tracking-tight">
              HogarApp
            </span>
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                pathname === '/'
                  ? 'bg-[#EEF2EA] text-[#3A4630] shadow-2xs'
                  : 'text-[#736F68] hover:text-[#3A4630] hover:bg-white/50'
              }`}
            >
              <Home size={13} strokeWidth={2.2} />
              <span>Lobby</span>
            </Link>

            <Link
              href="/plantas"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                pathname.startsWith('/plantas')
                  ? 'bg-[#EEF2EA] text-[#3A4630] shadow-2xs'
                  : 'text-[#736F68] hover:text-[#3A4630] hover:bg-white/50'
              }`}
            >
              <Sprout size={13} strokeWidth={2.2} />
              <span>Jardín</span>
            </Link>

            <Link
              href="/finanzas"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                pathname.startsWith('/finanzas') || pathname.startsWith('/servicios')
                  ? 'bg-[#EEF2EA] text-[#3A4630] shadow-2xs'
                  : 'text-[#736F68] hover:text-[#3A4630] hover:bg-white/50'
              }`}
            >
              <Receipt size={13} strokeWidth={2.2} />
              <span>Cuentas</span>
            </Link>

            <Link
              href="/usuarios"
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                pathname.startsWith('/usuarios')
                  ? 'bg-[#EEF2EA] text-[#3A4630] shadow-2xs'
                  : 'text-[#736F68] hover:text-[#3A4630] hover:bg-white/50'
              }`}
            >
              <Users size={13} strokeWidth={2.2} />
              <span>Miembros</span>
            </Link>
          </nav>
        </div>

        {/* User Session & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Badge del Miembro Activo */}
              <div className="flex items-center gap-2 bg-[#EEF2EA]/90 border border-[#DCE7D3] px-3 py-1.5 rounded-2xl shadow-2xs">
                <span className="w-6 h-6 rounded-full bg-[#5F6F52] text-white text-[11px] font-bold flex items-center justify-center">
                  {user.nombre.charAt(0).toUpperCase()}
                </span>
                <span className="text-xs font-extrabold text-[#3A4630] max-w-[90px] sm:max-w-[140px] truncate">
                  {user.nombre}
                </span>
              </div>

              {/* Botón Cambiar Perfil */}
              <Link
                href="/login"
                title="Cambiar de miembro del hogar"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-white/70 hover:bg-white text-[#736F68] hover:text-[#3A4630] border border-[#E8E0D2] rounded-xl transition cursor-pointer active:scale-95 shadow-2xs"
              >
                <RefreshCw size={12} strokeWidth={2.2} />
                <span>Cambiar</span>
              </Link>

              {/* Botón Cerrar Sesión Manual */}
              <button
                type="button"
                onClick={handleLogout}
                title="Cerrar sesión"
                className="text-xs font-bold px-3 py-1.5 bg-[#FAE2D8]/80 hover:bg-[#FAE2D8] text-[#B84626] border border-[#F2BAA5] rounded-xl transition cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-2xs"
              >
                <LogOut size={12} strokeWidth={2.2} />
                <span>Salir</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="text-xs font-bold px-4 py-2 bg-[#5F6F52] hover:bg-[#4E5D42] text-white rounded-xl transition shadow-sm flex items-center gap-1.5"
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
