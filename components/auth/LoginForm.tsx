'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MiembroSelector,
  loginConCredenciales,
  loginTradicional,
} from '@/actions/auth';
import { ShieldCheck, Key, UserPlus, ArrowRight, Delete, Check, Clock, Mail, Lock } from 'lucide-react';

interface LoginFormProps {
  initialMiembros: MiembroSelector[];
}

export default function LoginForm({ initialMiembros }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');

  const [miembros] = useState<MiembroSelector[]>(initialMiembros);
  const [vista, setVista] = useState<'selector' | 'tradicional'>('selector');
  const [miembroSeleccionado, setMiembroSeleccionado] = useState<MiembroSelector | null>(null);

  const [pinOClave, setPinOClave] = useState('');
  const [usarPin, setUsarPin] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleSelectMiembro(m: MiembroSelector) {
    setMiembroSeleccionado(m);
    setUsarPin(m.tienePin);
    setPinOClave('');
    setErrorMsg(null);
  }

  function handlePinKey(num: string) {
    if (pinOClave.length < 6) {
      setPinOClave((prev) => prev + num);
    }
  }

  function handlePinBackspace() {
    setPinOClave((prev) => prev.slice(0, -1));
  }

  function handlePinClear() {
    setPinOClave('');
  }

  async function handleLoginPerfil(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!miembroSeleccionado || !pinOClave) {
      setErrorMsg('Por favor ingresa tu clave o PIN');
      return;
    }

    setProcesando(true);
    setErrorMsg(null);

    const res = await loginConCredenciales(miembroSeleccionado.id, pinOClave, usarPin);
    setProcesando(false);

    if (res.success) {
      router.push('/');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Credenciales incorrectas');
      setPinOClave('');
    }
  }

  async function handleLoginTradicional(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setProcesando(true);
    setErrorMsg(null);

    const formData = new FormData(e.currentTarget);
    const res = await loginTradicional(formData);
    setProcesando(false);

    if (res.success) {
      router.push('/');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'Credenciales incorrectas');
    }
  }

  return (
    <div className="relative min-h-screen bg-[#F4EFE6] text-[#2E2B27] flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-olive top-[-50px] left-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] right-[-50px]" />

      <div className="relative z-10 w-full max-w-md space-y-6 animate-fade-in-up">
        
        {/* Cabecera / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.75rem] bg-white/80 border border-white/80 text-[#3A4630] font-black text-2xl shadow-lg shadow-[#3A4630]/5 mb-1">
            H
          </div>
          <h1 className="text-3xl font-black text-[#3A4630] tracking-tight">HogarApp</h1>
          <p className="text-xs text-[#736F68] font-medium">
            {vista === 'tradicional'
              ? 'Accede con tu correo y contraseña'
              : 'Selecciona tu perfil para ingresar'}
          </p>
        </div>

        {/* Aviso de Inactividad */}
        {reason === 'inactivity' && (
          <div className="p-4 bg-[#FAE2D8]/90 border border-[#F2BAA5] text-[#B84626] rounded-2xl text-xs font-bold text-center flex items-center justify-center gap-2 shadow-sm animate-pulse">
            <Clock size={15} />
            <span>Tu sesión expiró por inactividad. Elige tu perfil para continuar.</span>
          </div>
        )}

        {/* Tarjeta Principal Glassmorphic */}
        <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-xl shadow-[#3A4630]/8 border border-white/80">
          
          {/* Header de Vistas / Switcher */}
          <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3.5">
            <h2 className="text-xs font-extrabold text-[#3A4630] uppercase tracking-wider">
              {vista === 'selector' ? 'Iniciar Sesión' : 'Acceso con Correo'}
            </h2>
            <Link
              href="/register"
              className="text-xs font-bold text-[#5F6F52] hover:text-[#3A4630] bg-[#EEF2EA] hover:bg-[#DCE7D3] px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <UserPlus size={13} strokeWidth={2.2} />
              <span>Registrarse</span>
            </Link>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-[#FAE2D8] border border-[#F2BAA5] text-[#B84626] rounded-2xl text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          {/* VISTA 1: SELECTOR DE MIEMBROS */}
          {vista === 'selector' && (
            <div className="space-y-6">
              {!miembroSeleccionado ? (
                <div className="space-y-5">
                  {miembros.length === 0 ? (
                    <div className="py-8 text-center space-y-4">
                      <p className="text-xs text-[#736F68] font-medium">No hay miembros registrados aún en la casa.</p>
                      <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#5F6F52] text-white rounded-2xl text-xs font-bold hover:bg-[#4E5D42] transition shadow-md shadow-[#5F6F52]/20"
                      >
                        <UserPlus size={14} />
                        <span>Registrar Primer Miembro</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3.5">
                      {miembros.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectMiembro(m)}
                          className="p-4 rounded-2xl border border-white/80 bg-white/60 hover:bg-white hover:border-[#B7CBA9] hover:shadow-md transition-all duration-200 flex flex-col items-center gap-3 group cursor-pointer text-center active:scale-95 shadow-2xs"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#5F6F52] to-[#3A4630] text-white font-black text-xl flex items-center justify-center group-hover:scale-105 transition shadow-sm">
                            {m.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-extrabold text-[#3A4630] truncate max-w-[120px]">
                              {m.nombre}
                            </p>
                            <span className="text-[10px] text-[#736F68] font-semibold block mt-0.5">
                              {m.tienePin ? 'PIN o Clave' : 'Contraseña'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Enlace alternativo */}
                  <div className="pt-3 border-t border-[#F0EAE1] flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setVista('tradicional');
                        setErrorMsg(null);
                      }}
                      className="text-xs text-[#736F68] hover:text-[#3A4630] font-semibold text-center transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <span>Ingresar con correo y contraseña</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                /* INGRESO CON PERFIL SELECCIONADO (PIN O CLAVE) */
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-[#F0EAE1] pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#5F6F52] to-[#3A4630] text-white font-black text-base flex items-center justify-center shadow-xs">
                        {miembroSeleccionado.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-sm font-extrabold text-[#3A4630]">
                          {miembroSeleccionado.nombre}
                        </h2>
                        <p className="text-[11px] text-[#736F68] font-medium">
                          {usarPin ? 'Ingresa tu PIN de 4-6 dígitos' : 'Ingresa tu contraseña'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMiembroSeleccionado(null)}
                      className="text-xs font-bold text-[#736F68] hover:text-[#3A4630] bg-[#F4EFE6] px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>

                  {usarPin ? (
                    /* Teclado Numérico de PIN */
                    <div className="space-y-4">
                      <div className="flex justify-center items-center gap-3 h-13 bg-white/70 border border-[#E8E0D2] rounded-2xl shadow-inner">
                        {[0, 1, 2, 3, 4, 5].slice(0, Math.max(4, pinOClave.length)).map((_, i) => (
                          <div
                            key={i}
                            className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                              i < pinOClave.length ? 'bg-[#3A4630] scale-110 shadow-xs' : 'bg-[#D9CEBC]'
                            }`}
                          />
                        ))}
                      </div>

                      <div className="grid grid-cols-3 gap-2.5">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePinKey(num)}
                            className="h-13 rounded-2xl bg-white/80 hover:bg-white border border-[#E8E0D2] text-lg font-extrabold text-[#3A4630] transition shadow-2xs cursor-pointer active:scale-92"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={handlePinClear}
                          className="h-13 rounded-2xl bg-[#F4EFE6] hover:bg-[#E8E0D2] text-xs font-bold text-[#736F68] transition cursor-pointer active:scale-92"
                        >
                          Limpiar
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePinKey('0')}
                          className="h-13 rounded-2xl bg-white/80 hover:bg-white border border-[#E8E0D2] text-lg font-extrabold text-[#3A4630] transition shadow-2xs cursor-pointer active:scale-92"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={handlePinBackspace}
                          className="h-13 rounded-2xl bg-[#F4EFE6] hover:bg-[#E8E0D2] text-base font-bold text-[#736F68] transition cursor-pointer flex items-center justify-center active:scale-92"
                        >
                          <Delete size={18} />
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={procesando || pinOClave.length < 4}
                        onClick={() => handleLoginPerfil()}
                        className="w-full py-3.5 bg-gradient-to-r from-[#5F6F52] to-[#4E5D42] hover:from-[#4E5D42] hover:to-[#3A4630] text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-[#5F6F52]/25 disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                      >
                        <Check size={16} strokeWidth={2.5} />
                        <span>{procesando ? 'Verificando...' : 'Entrar al Hogar'}</span>
                      </button>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUsarPin(false);
                            setPinOClave('');
                            setErrorMsg(null);
                          }}
                          className="text-xs text-[#736F68] hover:text-[#3A4630] font-semibold underline cursor-pointer"
                        >
                          Prefiero ingresar con mi contraseña
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Input de Contraseña */
                    <form onSubmit={handleLoginPerfil} className="space-y-4">
                      <div>
                        <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                          Contraseña
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736F68]">
                            <Lock size={15} strokeWidth={2.2} />
                          </div>
                          <input
                            type="password"
                            required
                            value={pinOClave}
                            onChange={(e) => setPinOClave(e.target.value)}
                            placeholder="Tu contraseña de acceso"
                            className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={procesando}
                        className="w-full py-3.5 bg-gradient-to-r from-[#5F6F52] to-[#4E5D42] hover:from-[#4E5D42] hover:to-[#3A4630] text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-[#5F6F52]/25 disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                      >
                        <Check size={16} strokeWidth={2.5} />
                        <span>{procesando ? 'Iniciando sesión...' : 'Entrar al Hogar'}</span>
                      </button>

                      {miembroSeleccionado.tienePin && (
                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setUsarPin(true);
                              setPinOClave('');
                              setErrorMsg(null);
                            }}
                            className="text-xs text-[#736F68] hover:text-[#3A4630] font-semibold underline cursor-pointer"
                          >
                            Usar PIN rápido
                          </button>
                        </div>
                      )}
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VISTA 2: INGRESO TRADICIONAL */}
          {vista === 'tradicional' && (
            <form onSubmit={handleLoginTradicional} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52]">
                    <Mail size={16} strokeWidth={2.2} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="ejemplo@hogar.com"
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736F68]">
                    <Lock size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Tu contraseña"
                    className="w-full pl-10 pr-4 py-3 bg-white/80 border border-[#D9CEBC] rounded-2xl text-sm text-[#191C16] font-medium placeholder-[#A39E95] focus:outline-none focus:bg-white focus:border-[#3A4630] focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={procesando}
                className="w-full py-3.5 bg-gradient-to-r from-[#5F6F52] to-[#4E5D42] hover:from-[#4E5D42] hover:to-[#3A4630] text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-[#5F6F52]/25 disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>{procesando ? 'Verificando...' : 'Iniciar Sesión'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVista('selector');
                    setErrorMsg(null);
                  }}
                  className="text-xs text-[#736F68] hover:text-[#3A4630] font-semibold cursor-pointer"
                >
                  ← Volver a selección de miembros
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
