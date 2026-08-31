'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registroNuevoMiembro } from '@/actions/auth';
import { User, Mail, Lock, KeyRound, LogIn, Check, ShieldCheck, UserPlus } from 'lucide-react';

export default function RegisterForm() {
  const router = useRouter();
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProcesando(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await registroNuevoMiembro(formData);
    setProcesando(false);

    if (res.success) {
      router.push('/');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'No se pudo registrar el usuario');
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F4EFE6] text-[#2E2B27] flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-olive top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 w-full max-w-md space-y-6 animate-fade-in-up">
        
        {/* Cabecera / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.75rem] bg-white/80 border border-white/80 text-[#3A4630] font-black text-2xl shadow-lg shadow-[#3A4630]/5 mb-1">
            H
          </div>
          <h1 className="text-3xl font-black text-[#3A4630] tracking-tight">HogarApp</h1>
          <p className="text-xs text-[#736F68] font-medium">
            Registro de nuevo habitante para el hogar
          </p>
        </div>

        {/* Formulario de Registro Glassmorphic */}
        <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-xl shadow-[#3A4630]/8 border border-white/80">
          
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3.5">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-[#5F6F52]" />
              <h2 className="text-xs font-extrabold text-[#3A4630] uppercase tracking-wider">
                Nuevo Miembro
              </h2>
            </div>
            <Link
              href="/login"
              className="text-xs font-bold text-[#736F68] hover:text-[#3A4630] bg-[#F4EFE6] hover:bg-[#E8E0D2] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogIn size={13} strokeWidth={2.2} />
              <span>Iniciar Sesión</span>
            </Link>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-[#FAE2D8] border border-[#F2BAA5] text-[#B84626] rounded-2xl text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                Nombre Completo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52]">
                  <User size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="text"
                  name="nombre"
                  required
                  placeholder="Ej. Ana"
                  className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                Correo Electrónico *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52]">
                  <Mail size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Ana@hogar.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Contraseña *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736F68]">
                    <Lock size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="******"
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  PIN Rápido (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736F68]">
                    <KeyRound size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="password"
                    name="pin"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="4-6 dígitos"
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white/60 rounded-2xl border border-white/80 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-[#5F6F52] shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#736F68] font-medium leading-tight">
                El PIN te permite ingresar con 1 toque en tablets y dispositivos compartidos de la casa.
              </p>
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="w-full py-3.5 bg-gradient-to-r from-[#5F6F52] to-[#4E5D42] hover:from-[#4E5D42] hover:to-[#3A4630] text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-[#5F6F52]/25 disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{procesando ? 'Creando perfil...' : 'Registrar Miembro e Ingresar'}</span>
            </button>
          </form>

          {/* Enlace para volver al login */}
          <div className="pt-2 border-t border-[#F0EAE1] text-center">
            <Link
              href="/login"
              className="text-xs text-[#736F68] hover:text-[#3A4630] font-semibold transition"
            >
              ¿Ya estás registrado en la casa? Inicia sesión aquí →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
