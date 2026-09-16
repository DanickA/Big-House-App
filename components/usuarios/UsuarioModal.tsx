'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { createUsuario, updateUsuario } from '@/actions/usuarios';
import { X, Check, User, Mail, Lock, KeyRound, ShieldCheck } from 'lucide-react';

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
        <div className="flex justify-between items-center px-6 sm:px-8 py-5 border-b border-[#E8E0D2]/80 dark:border-separator bg-white/85 dark:bg-secondary/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5F6F52] to-[#3A4630] dark:from-olive dark:to-[#3A4630] text-white font-black text-xl flex items-center justify-center shadow-md shadow-[#3A4630]/15 dark:shadow-none transition-all duration-300">
              {nombre ? nombre.charAt(0).toUpperCase() : <User size={22} />}
            </div>
            <div>
              <h2 className="text-xl font-black text-[#3A4630] dark:text-label-primary tracking-tight">
                {usuarioAEditar ? 'Editar Miembro' : 'Nuevo Miembro'}
              </h2>
              <p className="text-xs text-[#736F68] dark:text-label-secondary font-medium">
                {usuarioAEditar ? 'Actualiza los accesos del habitante' : 'Da de alta a un habitante de la casa'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar modal"
            className="w-9 h-9 rounded-full bg-[#F4EFE6] dark:bg-tertiary text-[#736F68] dark:text-label-tertiary hover:text-[#3A4630] dark:hover:text-label-primary hover:bg-[#E8E0D2] dark:hover:bg-secondary transition flex items-center justify-center cursor-pointer border border-[#E8E0D2] dark:border-separator active:scale-90"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Cuerpo del Formulario Desplazable */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-4 flex-1 pr-5 sm:pr-7 bg-white/40 dark:bg-system/60">
          
          {errorMsg && (
            <div className="p-3.5 bg-[#FAE2D8] dark:bg-secondary border border-[#F2BAA5] dark:border-terracotta/40 text-[#B84626] dark:text-terracotta rounded-2xl text-xs font-bold text-center">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* NOMBRE COMPLETO */}
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                Nombre Completo *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52] dark:text-olive">
                  <User size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="text"
                  name="nombre"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Daniel"
                  className="w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-2xl text-sm text-[#191C16] dark:text-label-primary font-medium placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-[#3A4630] dark:focus:border-olive focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
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
              <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                Correo Electrónico *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#5F6F52] dark:text-olive">
                  <Mail size={16} strokeWidth={2.2} />
                </div>
                <input
                  type="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="daniel@hogar.com"
                  className="w-full pl-10 pr-10 py-3 bg-white/80 dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-2xl text-sm text-[#191C16] dark:text-label-primary font-medium placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-[#3A4630] dark:focus:border-olive focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
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
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                  {usuarioAEditar ? 'Nueva Contraseña' : 'Contraseña *'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736F68] dark:text-label-tertiary">
                    <Lock size={15} strokeWidth={2.2} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    required={!usuarioAEditar}
                    placeholder={usuarioAEditar ? 'Opcional' : '******'}
                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-2xl text-sm text-[#191C16] dark:text-label-primary font-medium placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-[#3A4630] dark:focus:border-olive focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold uppercase tracking-wider text-[#3A4630] dark:text-label-primary mb-1.5">
                  PIN Rápido (4-6 dígitos)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#736F68] dark:text-label-tertiary">
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
                    className="w-full pl-10 pr-4 py-3 bg-white/80 dark:bg-tertiary border border-[#D9CEBC] dark:border-separator rounded-2xl text-sm text-[#191C16] dark:text-label-primary font-medium placeholder-[#A39E95] dark:placeholder-label-quaternary focus:outline-none focus:bg-white dark:focus:bg-secondary focus:border-[#3A4630] dark:focus:border-olive focus:ring-3 focus:ring-[#5F6F52]/15 transition shadow-2xs"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-white/60 dark:bg-secondary/70 rounded-2xl border border-white/80 dark:border-separator flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-[#5F6F52] dark:text-olive shrink-0 mt-0.5" />
              <p className="text-[11px] text-[#736F68] dark:text-label-secondary font-medium leading-tight">
                El PIN numérico permite seleccionar tu perfil y desbloquear la aplicación en dispositivos compartidos con 1 toque.
              </p>
            </div>

            {/* BOTONES */}
            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3.5 bg-[#F4EFE6] dark:bg-tertiary hover:bg-[#E8E0D2] dark:hover:bg-secondary text-[#736F68] dark:text-label-secondary font-bold text-xs rounded-2xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={procesando}
                className="flex-1 py-3.5 bg-gradient-to-r from-[#5F6F52] to-[#4E5D42] dark:from-olive dark:to-[#4E5D42] hover:from-[#4E5D42] hover:to-[#3A4630] dark:hover:opacity-95 text-white font-extrabold text-xs rounded-2xl transition shadow-lg shadow-[#5F6F52]/25 dark:shadow-none disabled:opacity-50 cursor-pointer active:scale-98 flex items-center justify-center gap-2"
              >
                <Check size={16} strokeWidth={2.5} />
                <span>{procesando ? 'Guardando...' : (usuarioAEditar ? 'Guardar Cambios' : 'Registrar Miembro')}</span>
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>,
    document.body
  );
}
