'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MiembroSelector,
  loginConCredenciales,
  loginTradicional,
} from '@/actions/auth';
import { ShieldCheck, Key, UserPlus, ArrowRight, Delete, Check, Clock, Mail, Lock, Loader2 } from 'lucide-react';

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
  const [shake, setShake] = useState(false);

  const pinInputRef = useRef<HTMLInputElement>(null);
  const expectedPinLength = miembroSeleccionado?.pinLongitud || 4;

  // Recordar el último usuario para vista directa de desbloqueo de perfil
  useEffect(() => {
    try {
      const lastUserId = localStorage.getItem('bighouse_last_user_id');
      if (lastUserId && !miembroSeleccionado) {
        const found = miembros.find((m) => m.id === lastUserId);
        if (found) {
          setMiembroSeleccionado(found);
          setUsarPin(found.tienePin);
        }
      }
    } catch {
      // Ignorar si localStorage no está disponible
    }
  }, [miembros]);

  useEffect(() => {
    if (miembroSeleccionado && usarPin) {
      const timer = setTimeout(() => {
        pinInputRef.current?.focus();
      }, 80);
      return () => clearTimeout(timer);
    }
  }, [miembroSeleccionado, usarPin]);

  function handleSelectMiembro(m: MiembroSelector) {
    setMiembroSeleccionado(m);
    setUsarPin(m.tienePin);
    setPinOClave('');
    setErrorMsg(null);
    setShake(false);
    try {
      localStorage.setItem('bighouse_last_user_id', m.id);
    } catch {}
  }

  async function handleLoginPerfil(e?: React.FormEvent, overridePin?: string) {
    if (e) e.preventDefault();
    const pinAUsar = (overridePin !== undefined ? overridePin : pinOClave).trim();
    if (!miembroSeleccionado || !pinAUsar) {
      setErrorMsg('Por favor ingresa tu clave o PIN');
      return;
    }

    setProcesando(true);
    setErrorMsg(null);

    const res = await loginConCredenciales(miembroSeleccionado.id, pinAUsar, usarPin);
    setProcesando(false);

    if (res.success) {
      try {
        localStorage.setItem('bighouse_last_user_id', miembroSeleccionado.id);
      } catch {}
      router.push('/');
      router.refresh();
    } else {
      setErrorMsg(res.error || 'PIN o clave incorrecta');
      setShake(true);
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([40, 80, 40]);
        } catch {}
      }
      setTimeout(() => {
        setPinOClave('');
        setShake(false);
        if (pinInputRef.current) {
          pinInputRef.current.value = '';
          pinInputRef.current.focus();
        }
      }, 450);
    }
  }

  function handlePinKey(num: string) {
    if (procesando || shake || pinOClave.length >= expectedPinLength) return;
    const nuevoPin = (pinOClave + num).slice(0, expectedPinLength);
    setPinOClave(nuevoPin);
    if (pinInputRef.current) {
      pinInputRef.current.value = nuevoPin;
    }
    // Auto-envío determinista inmediato al ingresar el 4to dígito
    if (nuevoPin.length === expectedPinLength) {
      handleLoginPerfil(undefined, nuevoPin);
    }
  }

  function handlePinInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (procesando || shake) return;
    const cleanDigits = e.target.value.replace(/\D/g, '').slice(0, expectedPinLength);
    setPinOClave(cleanDigits);
    // Auto-envío determinista inmediato al ingresar el 4to dígito
    if (cleanDigits.length === expectedPinLength) {
      handleLoginPerfil(undefined, cleanDigits);
    }
  }

  function handlePinBackspace() {
    if (procesando || shake) return;
    const nuevoPin = pinOClave.slice(0, -1);
    setPinOClave(nuevoPin);
    if (pinInputRef.current) {
      pinInputRef.current.value = nuevoPin;
      pinInputRef.current.focus();
    }
  }

  function handlePinClear() {
    if (procesando || shake) return;
    setPinOClave('');
    if (pinInputRef.current) {
      pinInputRef.current.value = '';
      pinInputRef.current.focus();
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
    <div className="relative min-h-screen bg-system text-label-primary flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden">
      {/* Luces Ambientales de Fondo */}
      <div className="ambient-glow-mint top-[-50px] left-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] right-[-50px]" />

      <div className="relative z-10 w-full max-w-md space-y-6 animate-fade-in-up">
        
        {/* Cabecera / Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.75rem] bg-terracotta text-white font-bold text-2xl shadow-lg shadow-terracotta/15 mb-1">
            H
          </div>
          <h1 className="apple-large-title text-label-primary">HogarApp</h1>
          <p className="apple-subhead text-label-secondary">
            {vista === 'tradicional'
              ? 'Accede con tu correo y contraseña'
              : 'Selecciona tu perfil para ingresar'}
          </p>
        </div>

        {/* Aviso de Inactividad */}
        {reason === 'inactivity' && (
          <div className="p-4 bg-terracotta/15 border border-separator text-terracotta rounded-2xl apple-footnote font-semibold text-center flex items-center justify-center gap-2 shadow-sm animate-pulse">
            <Clock size={15} />
            <span>Tu sesión expiró por inactividad. Elige tu perfil para continuar.</span>
          </div>
        )}

        {/* Tarjeta Principal Glassmorphic */}
        <div className="glass-card rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-xl shadow-black/5 border border-separator">
          
          {/* Header de Vistas / Switcher */}
          <div className="flex items-center justify-between border-b border-separator pb-3.5">
            <h2 className="apple-subhead font-semibold text-label-primary">
              {vista === 'selector' ? 'Iniciar sesión' : 'Acceso con correo'}
            </h2>
            <Link
              href="/register"
              className="text-xs font-semibold text-terracotta hover:opacity-85 bg-terracotta/15 hover:bg-terracotta/20 px-3.5 min-h-[44px] rounded-xl transition inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <UserPlus size={13} strokeWidth={2.2} />
              <span>Registrarse</span>
            </Link>
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-terracotta/15 border border-separator text-terracotta rounded-2xl apple-footnote font-semibold text-center">
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
                      <p className="apple-subhead text-label-secondary">No hay miembros registrados aún en la casa.</p>
                      <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-5 py-2.5 min-h-[44px] bg-terracotta text-white rounded-2xl text-sm font-semibold hover:bg-terracotta-hover transition shadow-md shadow-terracotta/20"
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
                          className="p-4 rounded-2xl border border-separator bg-tertiary hover:bg-tertiary hover:border-terracotta/40 hover:shadow-md transition-all duration-200 flex flex-col items-center gap-3 group cursor-pointer text-center active:scale-95 shadow-2xs"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-terracotta to-brand-deep text-white font-bold text-xl flex items-center justify-center group-hover:scale-105 transition shadow-sm">
                            {m.nombre.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="apple-headline text-label-primary truncate max-w-[120px]">
                              {m.nombre}
                            </p>
                            <span className="apple-caption-2 text-label-secondary font-medium block mt-0.5">
                              {m.tienePin ? 'PIN o Clave' : 'Contraseña'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Enlace alternativo */}
                  <div className="pt-3 border-t border-separator flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setVista('tradicional');
                        setErrorMsg(null);
                      }}
                      className="apple-footnote text-label-secondary hover:text-label-primary font-medium text-center transition cursor-pointer flex items-center justify-center gap-1 min-h-[44px]"
                    >
                      <span>Ingresar con correo y contraseña</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              ) : (
                /* INGRESO CON PERFIL SELECCIONADO (PIN O CLAVE) */
                <div className="space-y-5">
                  <div className="flex items-center justify-between border-b border-separator pb-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-terracotta to-brand-deep text-white font-bold text-base flex items-center justify-center shadow-xs">
                        {miembroSeleccionado.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h2 className="apple-headline text-label-primary">
                          {miembroSeleccionado.nombre}
                        </h2>
                        <p className="apple-footnote text-label-secondary">
                          {usarPin ? `Ingresa tu PIN de ${expectedPinLength} dígitos` : 'Ingresa tu contraseña'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setMiembroSeleccionado(null)}
                      className="apple-footnote font-semibold text-label-secondary hover:text-label-primary bg-tertiary px-3.5 min-h-[44px] rounded-xl transition cursor-pointer inline-flex items-center"
                    >
                      Cambiar
                    </button>
                  </div>

                  {usarPin ? (
                    /* Teclado Numérico de PIN con 4 Casillas Discretas (Apple HIG PinDigitSlots) */
                    <div className="space-y-5">
                      <div className={`relative max-w-[270px] mx-auto ${shake ? 'animate-apple-shake' : ''}`}>
                        {/* Input nativo transparente para soporte óptimo de teclados móviles y físicos */}
                        <input
                          ref={pinInputRef}
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={expectedPinLength}
                          autoComplete="one-time-code"
                          value={pinOClave}
                          onChange={handlePinInputChange}
                          disabled={procesando}
                          aria-label={`PIN de acceso de ${expectedPinLength} dígitos`}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />

                        {/* Casillas Discretas Estilo Apple HIG (Dinámicas 4-6 dígitos) */}
                        <div
                          onClick={() => pinInputRef.current?.focus()}
                          className={`grid ${
                            expectedPinLength === 5
                              ? 'grid-cols-5'
                              : expectedPinLength === 6
                              ? 'grid-cols-6'
                              : 'grid-cols-4'
                          } gap-3 cursor-pointer py-1`}
                        >
                          {Array.from({ length: expectedPinLength }).map((_, i) => {
                            const isFilled = i < pinOClave.length;
                            const isCurrent = i === pinOClave.length;
                            return (
                              <div
                                key={i}
                                className={`h-15 sm:h-16 rounded-2xl flex items-center justify-center transition-all duration-150 border-2 select-none ${
                                  shake
                                    ? 'border-terracotta bg-terracotta/15 text-terracotta'
                                    : isCurrent
                                    ? 'border-terracotta ring-4 ring-terracotta/20 bg-secondary shadow-xs scale-102'
                                    : isFilled
                                    ? 'border-terracotta/60 bg-secondary shadow-xs'
                                    : 'border-separator bg-secondary/50 dark:bg-tertiary/40'
                                }`}
                              >
                                {isFilled ? (
                                  <span className="w-3.5 h-3.5 rounded-full bg-terracotta shadow-xs" />
                                ) : isCurrent ? (
                                  <span className="w-1.5 h-5 rounded-full bg-terracotta/70 animate-pulse" />
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Estado visual durante verificación determinista (sin botón redundante) */}
                      {procesando && (
                        <div className="flex items-center justify-center gap-2 text-xs font-semibold text-terracotta animate-pulse">
                          <Loader2 size={15} className="animate-spin" />
                          <span>Verificando PIN...</span>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2.5">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                          <button
                            key={num}
                            type="button"
                            disabled={procesando}
                            onClick={() => handlePinKey(num)}
                            className="h-13 rounded-2xl bg-secondary hover:bg-tertiary border border-separator text-lg font-semibold tabular-nums text-label-primary transition shadow-2xs cursor-pointer active:scale-92 disabled:opacity-50"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          disabled={procesando}
                          onClick={handlePinClear}
                          className="h-13 rounded-2xl bg-tertiary hover:opacity-85 text-xs font-semibold text-label-secondary transition cursor-pointer active:scale-92 disabled:opacity-50"
                        >
                          Limpiar
                        </button>
                        <button
                          type="button"
                          disabled={procesando}
                          onClick={() => handlePinKey('0')}
                          className="h-13 rounded-2xl bg-secondary hover:bg-tertiary border border-separator text-lg font-semibold tabular-nums text-label-primary transition shadow-2xs cursor-pointer active:scale-92 disabled:opacity-50"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          disabled={procesando}
                          onClick={handlePinBackspace}
                          className="h-13 rounded-2xl bg-tertiary hover:opacity-85 text-base font-semibold text-label-secondary transition cursor-pointer flex items-center justify-center active:scale-92 disabled:opacity-50"
                        >
                          <Delete size={18} />
                        </button>
                      </div>

                      <div className="text-center pt-1 flex flex-col items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setUsarPin(false);
                            setPinOClave('');
                            setErrorMsg(null);
                          }}
                          className="apple-footnote text-label-secondary hover:text-terracotta font-medium underline cursor-pointer min-h-[44px] inline-flex items-center justify-center px-3"
                        >
                          Prefiero ingresar con mi contraseña
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMiembroSeleccionado(null);
                            setVista('tradicional');
                            setErrorMsg(null);
                          }}
                          className="apple-caption-1 text-label-tertiary hover:text-label-primary font-medium cursor-pointer min-h-[44px] inline-flex items-center justify-center gap-1 px-3"
                        >
                          <span>Ingresar con correo y contraseña</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Input de Contraseña */
                    <form onSubmit={handleLoginPerfil} className="space-y-4">
                      <div>
                        <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                          Contraseña
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-label-secondary">
                            <Lock size={15} strokeWidth={2.2} />
                          </div>
                          <input
                            type="password"
                            required
                            value={pinOClave}
                            onChange={(e) => setPinOClave(e.target.value)}
                            placeholder="Tu contraseña de acceso"
                            className="w-full pl-10 pr-4 py-3 bg-tertiary border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-secondary focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={procesando}
                        className="w-full py-3.5 min-h-[44px] bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-terracotta/25 disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
                      >
                        <Check size={16} strokeWidth={2.5} />
                        <span>{procesando ? 'Iniciando sesión...' : 'Entrar al Hogar'}</span>
                      </button>

                      <div className="text-center pt-1 flex flex-col items-center gap-1.5">
                        {miembroSeleccionado.tienePin && (
                          <button
                            type="button"
                            onClick={() => {
                              setUsarPin(true);
                              setPinOClave('');
                              setErrorMsg(null);
                            }}
                            className="apple-footnote text-label-secondary hover:text-terracotta font-medium underline cursor-pointer min-h-[44px] inline-flex items-center justify-center px-3"
                          >
                            Usar PIN rápido
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setMiembroSeleccionado(null);
                            setVista('tradicional');
                            setErrorMsg(null);
                          }}
                          className="apple-caption-1 text-label-tertiary hover:text-label-primary font-medium cursor-pointer min-h-[44px] inline-flex items-center justify-center gap-1 px-3"
                        >
                          <span>Ingresar con correo y contraseña</span>
                          <ArrowRight size={11} />
                        </button>
                      </div>
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
                <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-terracotta">
                    <Mail size={16} strokeWidth={2.2} />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="ejemplo@hogar.com"
                    className="w-full pl-10 pr-4 py-3 bg-tertiary border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-secondary focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-label-secondary">
                    <Lock size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required
                    placeholder="Tu contraseña"
                    className="w-full pl-10 pr-4 py-3 bg-tertiary border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-secondary focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={procesando}
                className="w-full py-3.5 bg-terracotta hover:bg-terracotta-hover text-white font-semibold text-sm rounded-2xl transition shadow-lg shadow-terracotta/25 disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>{procesando ? 'Verificando...' : 'Iniciar Sesión'}</span>
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setVista('selector');
                    setMiembroSeleccionado(null);
                    setErrorMsg(null);
                  }}
                  className="apple-footnote text-label-secondary hover:text-terracotta font-medium cursor-pointer"
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
