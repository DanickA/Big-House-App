'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createUsuario, updateUsuario } from '@/actions/usuarios';
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
  const [pin, setPin] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (usuarioAEditar) {
      setNombre(usuarioAEditar.nombre || '');
      setEmail(usuarioAEditar.email || '');
      setPin('');
    } else {
      setNombre('');
      setEmail('');
      setPin('');
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

    const formData = new FormData(e.currentTarget);
    const res = usuarioAEditar
      ? await updateUsuario(usuarioAEditar.id, formData)
      : await createUsuario(formData);

    setProcesando(false);

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
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Fondo oscuro para cerrar */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      <div className="relative glass-modal w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col my-auto max-h-[calc(100vh-3.5rem)] border border-white/80 dark:border-separator animate-fade-in-up">
        
        {/* Cabecera Fija con Esquinas Superiores Redondeadas Naturales */}
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
            className="w-9 h-9 rounded-full bg-tertiary text-label-secondary hover:text-label-primary hover:bg-secondary transition flex items-center justify-center cursor-pointer border border-separator active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cuerpo del Formulario Desplazable */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1 pr-5 sm:pr-7 bg-white/40 dark:bg-system/60">
          
          {errorMsg && (
            <div className="p-3.5 bg-[#ce9b8c]/25 dark:bg-secondary border border-[#aa4b50]/30 dark:border-terracotta/40 text-terracotta rounded-2xl apple-footnote font-semibold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* NOMBRE COMPLETO */}
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
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Daniel"
                  className="w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-tertiary border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                />
                {nombre && (
                  <button
                    type="button"
                    onClick={() => setNombre('')}
                    aria-label="Limpiar nombre"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-label-tertiary hover:text-label-primary transition"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {/* CORREO ELECTRÓNICO */}
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="daniel@hogar.com"
                  className="w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-tertiary border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                />
                {email && (
                  <button
                    type="button"
                    onClick={() => setEmail('')}
                    aria-label="Limpiar correo"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-label-tertiary hover:text-label-primary transition"
                  >
                    <X size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {/* CONTRASEÑA Y PIN EN GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                  {usuarioAEditar ? 'Nueva contraseña' : 'Contraseña *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-label-secondary">
                    <Lock size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required={!usuarioAEditar}
                    placeholder={usuarioAEditar ? 'Opcional' : '******'}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block apple-subhead font-medium text-label-primary mb-1.5">
                  PIN rápido (4-6 dígitos)
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
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder={usuarioAEditar?.tienePin ? 'Configurado' : 'Ej. 1234'}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary border border-separator rounded-2xl apple-body text-label-primary font-medium placeholder-label-tertiary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-terracotta focus:ring-3 focus:ring-terracotta/15 transition shadow-2xs tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white/60 dark:bg-secondary/70 rounded-2xl border border-separator flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-mint shrink-0 mt-0.5" />
              <p className="apple-footnote text-label-secondary leading-tight">
                El PIN numérico permite seleccionar tu perfil y desbloquear la aplicación en dispositivos compartidos con 1 toque.
              </p>
            </div>

            {/* BOTONES SIMÉTRICOS (APPLE HIG) */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={procesando}
                className="flex-1 btn-apple-gray text-sm font-semibold justify-center"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesando}
                className="flex-1 btn-apple-filled text-sm font-semibold justify-center gap-2"
              >
                {procesando ? (
                  <>
                    <Loader2 size={16} className="animate-spin shrink-0" />
                    <span>Guardando habitante...</span>
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
