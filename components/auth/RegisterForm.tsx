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
    <div className="relative min-h-screen bg-system text-label-primary flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-mint top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 w-full max-w-md space-y-6 animate-fade-in-up">
        
        {/* Cabecera / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.75rem] bg-terracotta text-white font-bold text-2xl shadow-lg shadow-terracotta/15 mb-1">
            H
          </div>
          <h1 className="apple-large-title text-label-primary">HogarApp</h1>
          <p className="apple-subhead text-label-secondary">
            Registro de nuevo habitante para el hogar
          </p>
        </div>

        {/* Formulario de Registro Glassmorphic */}
        <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-xl shadow-black/5 border border-white/80 dark:border-white/10">
          
          <div className="flex items-center justify-between border-b border-separator pb-3.5">
            <div className="flex items-center gap-2">
              <UserPlus size={16} className="text-terracotta" />
              <h2 className="apple-subhead font-semibold text-label-primary">
                Nuevo Miembro
              </h2>
            </div>
            <Link
              href="/login"
              className="text-xs font-semibold text-label-secondary hover:text-label-primary bg-tertiary px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <LogIn size={13} strokeWidth={2.2} />
              <span>Iniciar sesión</span>
            </Link>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-[#ce9b8c]/25 border border-[#aa4b50]/30 text-terracotta rounded-2xl apple-footnote font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                Nombre completo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-terracotta">
                  <User size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="text"
                  name="nombre"
                  required
                  placeholder="Ej. Ana"
                  className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary/60 border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-white focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                />
              </div>
            </div>

            <div>
              <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                Correo electrónico *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-terracotta">
                  <Mail size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="ana@hogar.com"
                  className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary/60 border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-white focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                  Contraseña *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-label-secondary">
                    <Lock size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="******"
                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary/60 border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-white focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                  PIN rápido (Opcional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-label-secondary">
                    <KeyRound size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="password"
                    name="pin"
                    maxLength={6}
                    pattern="[0-9]*"
                    inputMode="numeric"
                    placeholder="4-6 dígitos"
                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary/60 border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-white focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white/60 dark:bg-tertiary/60 rounded-2xl border border-separator flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-pistachio shrink-0 mt-0.5" />
              <p className="apple-footnote text-label-secondary leading-tight">
                El PIN te permite ingresar con 1 toque en tablets y dispositivos compartidos de la casa.
              </p>
            </div>

            <button
              type="submit"
              disabled={procesando}
              className="w-full py-3.5 bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-terracotta/25 disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
            >
              <Check size={16} strokeWidth={2.5} />
              <span>{procesando ? 'Creando perfil...' : 'Registrar Miembro e Ingresar'}</span>
            </button>
          </form>

          {/* Enlace para volver al login */}
          <div className="pt-2 border-t border-separator text-center">
            <Link
              href="/login"
              className="apple-footnote text-label-secondary hover:text-terracotta font-medium transition"
            >
              ¿Ya estás registrado en la casa? Inicia sesión aquí →
            </Link>
          </div>

        </div>

      </div>
    </div>
  );
}
