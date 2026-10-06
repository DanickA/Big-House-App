'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createUsuario, updateUsuario } from '@/actions/usuarios';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { X, Check, User, Mail, Lock, KeyRound, ShieldCheck, Loader2 } from 'lucide-react';

export type UsuarioItem = {
  id: string;
  nombre: string;
  email: string;
  tienePin: boolean;
  fecha_registro: Date | null;
};

interface UsuarioModalProps {
  isOpen: boolean;
  usuarioAEditar: UsuarioItem | null;
  onClose: () => void;
  onSuccess: (mensaje: string) => void;
}

export default function UsuarioModal({
  isOpen,
  usuarioAEditar,
  onClose,
  onSuccess,
}: UsuarioModalProps) {
  const [mounted, setMounted] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Estados interactivos
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [metodoAcceso, setMetodoAcceso] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');

  const pinInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (usuarioAEditar) {
      setNombre(usuarioAEditar.nombre || '');
      setEmail(usuarioAEditar.email || '');
      setPin('');
      setPassword('');
      setMetodoAcceso(usuarioAEditar.tienePin ? 'pin' : 'password');
    } else {
      setNombre('');
      setEmail('');
      setPin('');
      setPassword('');
      setMetodoAcceso('pin');
    }
    setErrorMsg(null);
  }, [usuarioAEditar, isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setProcesando(true);

    try {
      const formData = new FormData(e.currentTarget);

      if (metodoAcceso === 'pin') {
        const cleanPin = pin.trim();
        if (cleanPin.length > 0) {
          if (cleanPin.length !== 4) {
            setErrorMsg('El PIN rápido debe tener exactamente 4 dígitos');
            setProcesando(false);
            return;
          }
          formData.set('pin', cleanPin);
        } else if (!usuarioAEditar || !usuarioAEditar.tienePin) {
          setErrorMsg('El PIN rápido debe tener exactamente 4 dígitos');
          setProcesando(false);
          return;
        }
        // Si es nuevo usuario y no especificó contraseña manual, se asigna el PIN como contraseña base
        if (!usuarioAEditar && cleanPin) {
          formData.set('password', cleanPin);
        }
      } else {
        if (!usuarioAEditar && !password.trim()) {
          setErrorMsg('La contraseña es requerida');
          setProcesando(false);
          return;
        }
        if (password.trim()) {
          formData.set('password', password.trim());
        }
      }

      const res = usuarioAEditar
        ? await updateUsuario(usuarioAEditar.id, formData)
        : await createUsuario(formData);

      if (res.success) {
        onSuccess(
          usuarioAEditar
            ? '¡Perfil de miembro actualizado con éxito!'
            : '¡Nuevo miembro registrado con éxito!'
        );
        onClose();
      } else {
        setErrorMsg(res.error || 'Ocurrió un error al guardar');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error de conexión');
    } finally {
      setProcesando(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Fondo oscuro para cerrar */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative glass-modal w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col my-auto max-h-[calc(100vh-3.5rem)] border border-white/80 dark:border-separator animate-fade-in-up">
        
        {/* Cabecera Fija */}
        <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b border-separator bg-white/85 dark:bg-secondary/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-terracotta to-brand-deep text-white font-bold text-lg flex items-center justify-center shadow-md shadow-terracotta/20 transition-all duration-300">
              {nombre ? nombre.charAt(0).toUpperCase() : <User size={22} />}
            </div>
            <div>
              <h2 className="apple-title-3 font-semibold text-label-primary">
                {usuarioAEditar ? 'Editar Miembro' : 'Nuevo Miembro'}
              </h2>
              <p className="apple-subhead text-label-secondary">
                {usuarioAEditar ? 'Actualiza los accesos del habitante' : 'Da de alta a un habitante de la casa'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-11 h-11 rounded-full bg-tertiary text-label-secondary hover:text-label-primary hover:bg-secondary transition flex items-center justify-center cursor-pointer border border-separator active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cuerpo del Formulario Desplazable (Grouped Sections estilo iOS) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 pr-5 sm:pr-7 bg-white/40 dark:bg-system/60">
          
          {errorMsg && (
            <div className="p-3.5 bg-[#ce9b8c]/25 dark:bg-secondary border border-[#aa4b50]/30 dark:border-terracotta/40 text-terracotta rounded-2xl apple-footnote font-semibold text-center animate-fade-in-up">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECCIÓN 1: DATOS PERSONALES (Grouped Section estilo iOS) */}
            <div className="space-y-2">
              <span className="apple-caption-1 font-semibold uppercase tracking-wider text-label-secondary px-1">
                Información personal
              </span>
              
              <div className="rounded-2xl border border-separator bg-secondary/90 dark:bg-tertiary/50 divide-y divide-separator overflow-hidden shadow-2xs">
                {/* Campo Nombre */}
                <div className="flex items-center px-4 py-3 gap-3">
                  <User size={18} className="text-terracotta shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-semibold text-label-secondary">
                      Nombre completo *
                    </label>
                    <input
                      type="text"
                      name="nombre"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Daniel"
                      className="w-full bg-transparent text-sm text-label-primary font-medium focus:outline-none placeholder:text-label-tertiary"
                    />
                  </div>
                  {nombre && (
                    <button
                      type="button"
                      onClick={() => setNombre('')}
                      aria-label="Limpiar nombre"
                      className="text-label-tertiary hover:text-label-primary p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Campo Correo */}
                <div className="flex items-center px-4 py-3 gap-3">
                  <Mail size={18} className="text-terracotta shrink-0" />
                  <div className="flex-1 min-w-0">
                    <label className="block text-[11px] font-semibold text-label-secondary">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="daniel@hogar.com"
                      className="w-full bg-transparent text-sm text-label-primary font-medium focus:outline-none placeholder:text-label-tertiary"
                    />
                  </div>
                  {email && (
                    <button
                      type="button"
                      onClick={() => setEmail('')}
                      aria-label="Limpiar correo"
                      className="text-label-tertiary hover:text-label-primary p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: SEGURIDAD Y ACCESO (Grouped Section con Selector Segmentado) */}
            <div className="space-y-2.5">
              <span className="apple-caption-1 font-semibold uppercase tracking-wider text-label-secondary px-1">
                Método de acceso
              </span>

              {/* Selector Segmentado Apple HIG */}
              <SegmentedControl<'pin' | 'password'>
                options={[
                  { value: 'pin', label: 'PIN rápido (4 dígitos)', icon: KeyRound },
                  { value: 'password', label: 'Contraseña clásica', icon: Lock },
                ]}
                value={metodoAcceso}
                onChange={setMetodoAcceso}
                ariaLabel="Selector de método de acceso"
              />

              <div className="rounded-2xl border border-separator bg-secondary/90 dark:bg-tertiary/50 p-4 space-y-3.5 shadow-2xs">
                {metodoAcceso === 'pin' ? (
                  /* CASILLAS DISCRETAS FORMATEADAS PARA EL PIN */
                  <div className="space-y-3">
                    <div className="text-center space-y-1">
                      <p className="apple-headline font-semibold text-label-primary">
                        Configura un PIN de 4 dígitos
                      </p>
                      <p className="apple-footnote text-label-secondary font-normal">
                        Permite acceso directo en 1 toque desde la pantalla de bienvenida
                      </p>
                    </div>

                    <div className="relative max-w-[240px] mx-auto pt-1">
                      {/* Input nativo transparente para soporte accesible */}
                      <input
                        ref={pinInputRef}
                        type="password"
                        name="pin_display"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 4);
                          setPin(digits);
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        aria-label="PIN de 4 dígitos"
                      />

                      {/* 4 Casillas discretas formateadas */}
                      <div
                        onClick={() => pinInputRef.current?.focus()}
                        className="grid grid-cols-4 gap-3 cursor-pointer"
                      >
                        {[0, 1, 2, 3].map((idx) => {
                          const isFilled = idx < pin.length;
                          const isCurrent = idx === pin.length;
                          return (
                            <div
                              key={idx}
                              className={`h-14 rounded-2xl flex items-center justify-center transition-all duration-150 border-2 select-none ${
                                isCurrent
                                  ? 'border-terracotta ring-4 ring-terracotta/20 bg-secondary shadow-xs scale-102'
                                  : isFilled
                                  ? 'border-terracotta/60 bg-secondary shadow-xs'
                                  : 'border-separator bg-secondary/50 dark:bg-tertiary/40'
                              }`}
                            >
                              {isFilled ? (
                                <span className="w-3 h-3 rounded-full bg-terracotta shadow-xs" />
                              ) : isCurrent ? (
                                <span className="w-1.5 h-4 rounded-full bg-terracotta/60 animate-pulse" />
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {usuarioAEditar?.tienePin && !pin && (
                      <p className="apple-caption-2 text-center text-label-tertiary pt-1">
                        (Actualmente configurado. Deja vacío para conservar el actual)
                      </p>
                    )}
                  </div>
                ) : (
                  /* INPUT CLÁSICO DE CONTRASEÑA */
                  <div className="space-y-2">
                    <label className="block apple-subhead font-medium text-label-primary">
                      {usuarioAEditar ? 'Nueva contraseña (opcional)' : 'Contraseña *'}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-label-secondary">
                        <Lock size={16} strokeWidth={2.2} />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={usuarioAEditar ? 'Dejar en blanco para no cambiar' : '••••••••'}
                        className="w-full pl-10 pr-4 py-3 bg-secondary/80 dark:bg-tertiary border border-separator rounded-2xl apple-body text-label-primary font-medium focus:outline-none focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-3.5 bg-mint/10 dark:bg-secondary/70 rounded-2xl border border-mint/25 flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-mint shrink-0 mt-0.5" />
              <p className="apple-footnote text-label-secondary leading-tight">
                El PIN numérico permite desbloquear la aplicación en dispositivos del hogar compartidos sin necesidad de escribir contraseñas largas.
              </p>
            </div>

            {/* BOTONES SIMÉTRICOS (APPLE HIG) */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={procesando}
                className="flex-1 btn-apple-gray text-sm font-semibold justify-center min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesando}
                className="flex-1 btn-apple-filled text-sm font-semibold justify-center gap-2 min-h-[44px]"
              >
                {procesando ? (
                  <>
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check size={16} strokeWidth={2.4} className="shrink-0" />
                    <span>
                      {usuarioAEditar ? 'Guardar cambios' : 'Registrar habitante'}
                    </span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>,
    document.body
  );
}
