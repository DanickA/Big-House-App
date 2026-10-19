'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from '@/actions/usuarios';
import type { UsuarioItem } from '@/components/usuarios/UsuarioModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
  ArrowLeft,
  UserPlus,
  ShieldCheck,
  Key,
  Pencil,
  Trash2,
  CheckCircle2,
  User,
  AlertCircle,
  X,
  Mail,
  Lock,
  KeyRound,
  Loader2,
  Check,
} from 'lucide-react';

interface UsuariosViewProps {
  initialUsuarios: UsuarioItem[];
}

type FiltroAcceso = 'TODOS' | 'PIN' | 'CLAVE';

/**
 * Habitantes · Directorio Compacto en 2 Columnas + Gaveta Inferior Contenida (2B-2).
 * - Sin MiniCockpitHUD: los conteos viven únicamente en las píldoras de filtrado.
 * - CRUD completo: createUsuario / updateUsuario / deleteUsuario (ConfirmModal).
 * - Superficies B3: tarjetas en Plano 1 (.glass-card), inputs y controles en Plano 2 (bg-tertiary).
 */
export default function UsuariosView({ initialUsuarios }: UsuariosViewProps) {
  const { data: usuarios = initialUsuarios, mutate } = useSWR<UsuarioItem[]>(
    'usuarios-list',
    async () => {
      const res = await getUsuarios();
      return res.success && res.data
        ? (res.data as unknown as UsuarioItem[])
        : initialUsuarios;
    },
    {
      fallbackData: initialUsuarios,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  );

  const [filtro, setFiltro] = useState<FiltroAcceso>('TODOS');
  const [notificacion, setNotificacion] = useState<{
    texto: string;
    tipo: 'ok' | 'error';
  } | null>(null);

  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<UsuarioItem | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioItem | null>(null);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [metodoAcceso, setMetodoAcceso] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);
  const pinInputRef = useRef<HTMLInputElement>(null);

  function mostrarAviso(texto: string, tipo: 'ok' | 'error' = 'ok') {
    setNotificacion({ texto, tipo });
    setTimeout(() => setNotificacion(null), 3500);
  }

  const conteos = useMemo(() => {
    const conPin = usuarios.filter((u) => u.tienePin).length;
    return {
      todos: usuarios.length,
      conPin,
      soloClave: usuarios.length - conPin,
    };
  }, [usuarios]);

  const usuariosFiltrados = useMemo(
    () =>
      usuarios.filter((u) => {
        if (filtro === 'PIN') return u.tienePin;
        if (filtro === 'CLAVE') return !u.tienePin;
        return true;
      }),
    [usuarios, filtro]
  );

  function abrirNuevoMiembro() {
    setUsuarioAEditar(null);
    setNombre('');
    setEmail('');
    setMetodoAcceso('pin');
    setPin('');
    setPassword('');
    setErrorForm(null);
    setIsSheetOpen(true);
  }

  function abrirEditarMiembro(u: UsuarioItem) {
    setUsuarioAEditar(u);
    setNombre(u.nombre);
    setEmail(u.email);
    setMetodoAcceso(u.tienePin ? 'pin' : 'password');
    setPin('');
    setPassword('');
    setErrorForm(null);
    setIsSheetOpen(true);
  }

  async function handleSubmitMiembro(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorForm(null);
    setProcesando(true);

    try {
      const formData = new FormData();
      formData.set('nombre', nombre.trim());
      formData.set('email', email.trim());

      if (metodoAcceso === 'pin') {
        const cleanPin = pin.trim();
        if (cleanPin.length > 0) {
          if (cleanPin.length !== 4) {
            setErrorForm('El PIN rápido debe tener exactamente 4 dígitos');
            setProcesando(false);
            return;
          }
          formData.set('pin', cleanPin);
        } else if (!usuarioAEditar || !usuarioAEditar.tienePin) {
          setErrorForm('Ingresa un PIN numérico de 4 dígitos');
          setProcesando(false);
          return;
        }
        if (!usuarioAEditar && cleanPin) {
          formData.set('password', cleanPin);
        }
      } else {
        if (!usuarioAEditar && !password.trim()) {
          setErrorForm('La contraseña es requerida');
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
        mostrarAviso(
          usuarioAEditar
            ? 'Habitante actualizado correctamente'
            : 'Nuevo habitante registrado con éxito'
        );
        setIsSheetOpen(false);
        await mutate();
      } else {
        setErrorForm(res.error || 'No se pudo guardar el habitante');
      }
    } catch (err: unknown) {
      setErrorForm(err instanceof Error ? err.message : 'Error al procesar la solicitud');
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarEliminarUsuario() {
    if (!usuarioAEliminar) return;
    const res = await deleteUsuario(usuarioAEliminar.id);
    if (res.success) {
      mostrarAviso('Habitante eliminado del hogar');
      setUsuarioAEliminar(null);
      await mutate();
    } else {
      mostrarAviso(res.error || 'No se pudo eliminar el habitante', 'error');
      setUsuarioAEliminar(null);
    }
  }

  const fieldClass =
    'flex items-center gap-2.5 bg-tertiary px-3.5 py-2.5 rounded-2xl border border-separator focus-within:border-terracotta transition';
  const inputClass =
    'w-full bg-transparent text-sm font-semibold text-label-primary placeholder:text-label-quaternary focus:outline-none';

  return (
    <div className="relative min-h-screen bg-system text-label-primary p-4 sm:p-8 transition-colors duration-300">
      <div className="ambient-glow-mint top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-5 animate-fade-in-up">
        {/* Notificación flotante */}
        {notificacion && (
          <div
            role="status"
            className={`fixed top-20 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-xs animate-fade-in-up border ${
              notificacion.tipo === 'error'
                ? 'bg-red-100 dark:bg-red-950 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
                : 'bg-secondary border-separator text-label-primary'
            }`}
          >
            {notificacion.tipo === 'error' ? (
              <AlertCircle size={16} className="shrink-0" />
            ) : (
              <CheckCircle2 size={16} className="shrink-0 text-terracotta" />
            )}
            <span>{notificacion.texto}</span>
          </div>
        )}

        {/* Cabecera única con píldoras de filtrado (único lugar de los conteos) */}
        <div className="glass-card p-4 sm:p-5 rounded-[1.8rem] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-label-tertiary hover:text-label-primary transition mb-1"
              >
                <ArrowLeft size={13} />
                <span>Lobby</span>
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-label-primary tracking-tight">
                Habitantes del hogar
              </h1>
            </div>

            <button
              type="button"
              onClick={abrirNuevoMiembro}
              className="btn-apple-filled self-start sm:self-auto"
            >
              <UserPlus size={15} />
              <span>Agregar habitante</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {[
              { id: 'TODOS', label: 'Todos', count: conteos.todos, icon: User },
              { id: 'PIN', label: 'PIN rápido', count: conteos.conPin, icon: ShieldCheck },
              { id: 'CLAVE', label: 'Solo contraseña', count: conteos.soloClave, icon: Key },
            ].map((pill) => {
              const Icon = pill.icon;
              const active = filtro === pill.id;
              return (
                <button
                  key={pill.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFiltro(pill.id as FiltroAcceso)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 border ${
                    active
                      ? 'bg-terracotta text-system border-terracotta'
                      : 'bg-tertiary text-label-secondary border-separator hover:text-label-primary'
                  }`}
                >
                  <Icon size={12} />
                  <span>{pill.label}</span>
                  <span
                    className={`px-1.5 rounded-full text-[10px] font-bold tabular-nums ${
                      active ? 'bg-system/20 text-system' : 'bg-secondary text-label-primary'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Directorio compacto en 2 columnas */}
        {usuariosFiltrados.length === 0 ? (
          <div className="glass-card p-8 rounded-[1.8rem] text-center space-y-1">
            <p className="text-sm font-bold text-label-primary">Sin habitantes en este filtro</p>
            <p className="text-xs text-label-tertiary">Cambia el filtro o agrega un nuevo habitante.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {usuariosFiltrados.map((u) => (
              <article
                key={u.id}
                className="glass-card p-4 sm:p-5 rounded-[1.8rem] flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-terracotta text-system font-bold text-base flex items-center justify-center shrink-0">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-label-primary truncate">
                        {u.nombre}
                      </h2>
                      <p className="text-xs text-label-secondary truncate">{u.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-tertiary text-label-tertiary border border-separator shrink-0 inline-flex items-center gap-1">
                    {u.tienePin ? <ShieldCheck size={11} /> : <Key size={11} />}
                    {u.tienePin ? 'PIN activo' : 'Solo clave'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-separator">
                  <button
                    type="button"
                    onClick={() => abrirEditarMiembro(u)}
                    className="px-3 py-1.5 rounded-xl bg-tertiary border border-separator text-label-primary hover:bg-terracotta hover:text-system hover:border-terracotta text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                  >
                    <Pencil size={12} />
                    <span>Editar acceso</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsuarioAEliminar(u)}
                    className="px-2.5 py-1.5 rounded-xl border border-transparent text-xs font-semibold text-label-tertiary hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer transition"
                  >
                    <Trash2 size={12} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* GAVETA INFERIOR CONTENIDA (2B-2) · CREAR / EDITAR HABITANTE */}
      {isSheetOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setIsSheetOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="habitante-sheet-title"
            onClick={(e) => e.stopPropagation()}
            className="glass-modal w-full max-w-md rounded-t-[2rem] sm:rounded-[2rem] max-h-[88dvh] flex flex-col overflow-hidden"
          >
            {/* Encabezado fijo */}
            <div className="shrink-0 px-4 sm:px-6 pt-3 pb-3 border-b border-separator space-y-3">
              <div className="w-10 h-1 bg-separator rounded-full mx-auto sm:hidden" />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-terracotta text-system font-bold text-sm flex items-center justify-center">
                    {nombre ? nombre.charAt(0).toUpperCase() : <User size={16} />}
                  </div>
                  <div>
                    <h3 id="habitante-sheet-title" className="text-sm font-bold text-label-primary">
                      {usuarioAEditar ? 'Editar habitante' : 'Nuevo habitante'}
                    </h3>
                    <p className="text-[11px] text-label-tertiary">
                      Datos de contacto y método de acceso
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Cerrar"
                  onClick={() => setIsSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-tertiary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmitMiembro} className="flex flex-col min-h-0 flex-1">
              {/* Cuerpo desplazable */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3.5">
                {errorForm && (
                  <div className="p-3 rounded-xl bg-red-500/15 border border-red-400/40 text-red-700 dark:text-red-300 text-xs font-bold text-center">
                    {errorForm}
                  </div>
                )}

                <div className="space-y-2">
                  <label className={fieldClass}>
                    <User size={15} className="text-terracotta shrink-0" />
                    <input
                      type="text"
                      required
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Nombre del habitante"
                      className={inputClass}
                    />
                  </label>
                  <label className={fieldClass}>
                    <Mail size={15} className="text-terracotta shrink-0" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Correo electrónico"
                      className={inputClass}
                    />
                  </label>
                </div>

                {/* Selector segmentado de método de acceso */}
                <div
                  role="radiogroup"
                  aria-label="Método de acceso"
                  className="grid grid-cols-2 gap-1 p-1 rounded-2xl bg-tertiary border border-separator"
                >
                  {[
                    { id: 'pin' as const, label: 'PIN (4 dígitos)', icon: KeyRound },
                    { id: 'password' as const, label: 'Contraseña', icon: Lock },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const active = metodoAcceso === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setMetodoAcceso(opt.id)}
                        className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition border ${
                          active
                            ? 'bg-secondary text-label-primary border-separator'
                            : 'text-label-secondary hover:text-label-primary border-transparent'
                        }`}
                      >
                        <Icon size={13} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {metodoAcceso === 'pin' ? (
                  <div className="p-3.5 rounded-2xl bg-tertiary border border-separator space-y-2.5">
                    <p className="text-xs font-semibold text-center text-label-secondary">
                      {usuarioAEditar?.tienePin
                        ? 'Nuevo PIN (deja vacío para conservar el actual)'
                        : 'Ingresa 4 dígitos para acceso rápido'}
                    </p>
                    <div className="relative max-w-[210px] mx-auto">
                      <input
                        ref={pinInputRef}
                        type="password"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        aria-label="PIN de 4 dígitos"
                      />
                      <div
                        onClick={() => pinInputRef.current?.focus()}
                        className="grid grid-cols-4 gap-2.5 cursor-pointer"
                      >
                        {[0, 1, 2, 3].map((idx) => {
                          const isFilled = idx < pin.length;
                          const isCurrent = idx === pin.length;
                          return (
                            <div
                              key={idx}
                              className={`h-12 rounded-xl flex items-center justify-center border bg-secondary transition ${
                                isCurrent || isFilled ? 'border-terracotta' : 'border-separator'
                              }`}
                            >
                              {isFilled && <span className="w-2.5 h-2.5 rounded-full bg-terracotta" />}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className={fieldClass}>
                    <Lock size={15} className="text-terracotta shrink-0" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={usuarioAEditar ? 'Nueva contraseña (opcional)' : 'Contraseña de acceso'}
                      className={inputClass}
                    />
                  </label>
                )}
              </div>

              {/* Pie fijo */}
              <div className="shrink-0 grid grid-cols-2 gap-2.5 px-4 sm:px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4 border-t border-separator">
                <button
                  type="button"
                  onClick={() => setIsSheetOpen(false)}
                  className="btn-apple-gray"
                >
                  Cancelar
                </button>
                <button type="submit" disabled={procesando} className="btn-apple-filled">
                  {procesando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  <span>{usuarioAEditar ? 'Guardar cambios' : 'Registrar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!usuarioAEliminar}
        title="¿Eliminar habitante?"
        description={`¿Estás seguro de que deseas eliminar a "${usuarioAEliminar?.nombre}" del hogar?`}
        confirmText="Eliminar habitante"
        variant="danger"
        onConfirm={confirmarEliminarUsuario}
        onClose={() => setUsuarioAEliminar(null)}
      />
    </div>
  );
}
