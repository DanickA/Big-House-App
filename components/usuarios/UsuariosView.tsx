'use client';

import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import useSWR from 'swr';
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
} from '@/actions/usuarios';
import type { UsuarioItem } from '@/components/usuarios/types';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { formatPlural, getSafeInitials } from '@/lib/formatters';
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
  MoreHorizontal,
  Copy,
} from 'lucide-react';

interface UsuariosViewProps {
  initialUsuarios: UsuarioItem[];
}

type FiltroAcceso = 'TODOS' | 'PIN' | 'CLAVE';

/**
 * Proyección de momento inercial Apple (Designing Fluid Interfaces - WWDC)
 */
function projectMomentum(initialVelocity: number, decelerationRate = 0.998): number {
  return (initialVelocity / 1000) * decelerationRate / (1 - decelerationRate);
}

/**
 * Resistencia elástica Apple HIG (Rubber-banding) para límites físicos
 */
function rubberband(overshoot: number, dimension: number, constant = 0.55): number {
  return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
}

/**
 * Habitantes · Directorio Apple Design & Emil Kowalski Craft
 * - Superficies B3: paleta B3-1 / B3-2 con Liquid Glass y contraste reforzado.
 * - Gaveta fluida adaptativa: centrada en escritorio y bottom-sheet en móvil.
 * - Gestos 1:1 directos (`setPointerCapture`, `projectMomentum`, `rubberband`, salida simétrica 260ms).
 * - Blindaje Break-UI: `getSafeInitials`, `flex-shrink: 0`, `[overflow-wrap:anywhere] break-words`.
 * - Menú de opciones anclado y protegido contra recortes de pantalla.
 * - CRUD 100% preservado (crear, editar, revocar PIN, eliminar, SWR revalidation).
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [filtro, setFiltro] = useState<FiltroAcceso>('TODOS');
  const [notificacion, setNotificacion] = useState<{
    texto: string;
    tipo: 'ok' | 'error';
  } | null>(null);

  // Estados de la Gaveta Fluida (Sheet/Drawer)
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [usuarioAEditar, setUsuarioAEditar] = useState<UsuarioItem | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioItem | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Estados del Formulario
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [metodoAcceso, setMetodoAcceso] = useState<'pin' | 'password'>('pin');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const pinInputRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const grabOffsetYRef = useRef(0);
  const currentDeltaYRef = useRef(0);
  const historyRef = useRef<{ y: number; time: number }[]>([]);

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

  // Montaje seguro de entrada animada
  useEffect(() => {
    if (isSheetOpen) {
      setIsClosing(false);
      currentDeltaYRef.current = 0;
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 16);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isSheetOpen]);

  // Bloqueo estricto del scroll del fondo al abrir la gaveta (Anti-Scroll Chaining & Touch Isolation con position: fixed)
  useEffect(() => {
    if (!isSheetOpen && !isClosing) return;

    const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;

    const prevPosition = document.body.style.position;
    const prevTop = document.body.style.top;
    const prevLeft = document.body.style.left;
    const prevRight = document.body.style.right;
    const prevWidth = document.body.style.width;
    const prevOverflow = document.body.style.overflow;
    const prevOverscroll = document.body.style.overscrollBehavior;
    const prevTouchAction = document.body.style.touchAction;
    const prevPaddingRight = document.body.style.paddingRight;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    // Compensar scrollbar en escritorio para eliminar cualquier salto o parpadeo
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    // Pinar físicamente el body en su coordenada exacta (imposibilita el scroll y rebote en iOS Safari y Android)
    document.body.classList.add('sheet-open');
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    let touchStartY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        touchStartY = e.touches[0].clientY;
      }
    };

    // Interceptar touchmove para anular el encadenamiento de scroll al fondo
    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const scrollEl = target.closest('[data-sheet-scrollable="true"]') as HTMLElement | null;
      if (scrollEl) {
        const hasScrollOverflow = scrollEl.scrollHeight > scrollEl.clientHeight + 1;
        // Si el formulario cabe completo sin overflow, anular cualquier touchmove para aislar la pantalla
        if (!hasScrollOverflow) {
          if (e.cancelable) e.preventDefault();
          return;
        }

        const currentY = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
        const deltaY = currentY - touchStartY;
        const isAtTop = scrollEl.scrollTop <= 0;
        const isAtBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;

        // Si está en el tope superior y jala hacia abajo, o en el tope inferior y jala hacia arriba:
        // anular para prevenir que el navegador intente desplazar el fondo
        if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
          if (e.cancelable) e.preventDefault();
          return;
        }

        // Permitir scroll vertical legítimo dentro del contenido del formulario
        return;
      }

      // En cualquier otra zona (backdrop, cabecera, manija, pie, márgenes): anular incondicionalmente
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      document.body.classList.remove('sheet-open');
      document.body.style.position = prevPosition;
      document.body.style.top = prevTop;
      document.body.style.left = prevLeft;
      document.body.style.right = prevRight;
      document.body.style.width = prevWidth;
      document.body.style.overflow = prevOverflow;
      document.body.style.overscrollBehavior = prevOverscroll;
      document.body.style.touchAction = prevTouchAction;
      document.body.style.paddingRight = prevPaddingRight;
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      try {
        window.scrollTo(0, scrollY);
      } catch {
        // Fallback defensivo para entornos de prueba
      }
    };
  }, [isSheetOpen, isClosing]);

  // Salida simétrica animada garantizada (260ms)
  const triggerSymmetricClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setIsVisible(false);

    if (sheetRef.current && backdropRef.current) {
      sheetRef.current.style.transition =
        'transform 260ms cubic-bezier(0.32, 0.72, 0, 1), opacity 240ms ease-out';
      sheetRef.current.style.transform = 'translate3d(0, 100%, 0)';
      sheetRef.current.style.opacity = '0';
      backdropRef.current.style.transition = 'opacity 240ms ease-out';
      backdropRef.current.style.opacity = '0';
    }

    setTimeout(() => {
      setIsClosing(false);
      currentDeltaYRef.current = 0;
      setIsSheetOpen(false);
      setUsuarioAEditar(null);
    }, 260);
  }, [isClosing]);

  // Tecla Escape para descarte accesible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSheetOpen && !isClosing) {
          triggerSymmetricClose();
        }
        if (activeMenuId) {
          setActiveMenuId(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSheetOpen, isClosing, activeMenuId, triggerSymmetricClose]);

  // Cierre de menú emergente al hacer clic fuera
  useEffect(() => {
    if (!activeMenuId) return;
    const handleOutsideClick = (e: PointerEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-popover-container]')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsideClick);
    return () => document.removeEventListener('pointerdown', handleOutsideClick);
  }, [activeMenuId]);

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
    setActiveMenuId(null);
    setUsuarioAEditar(u);
    setNombre(u.nombre);
    setEmail(u.email);
    setMetodoAcceso(u.tienePin ? 'pin' : 'password');
    setPin('');
    setPassword('');
    setErrorForm(null);
    setIsSheetOpen(true);
  }

  const copiarEmail = (emailStr: string) => {
    setActiveMenuId(null);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(emailStr);
      mostrarAviso('Correo copiado al portapapeles');
    }
  };

  // --- GESTOS DE MANIPULACIÓN DIRECTA 1:1 CON POINTER CAPTURE ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isClosing) return;
    const target = e.target as HTMLElement;
    // Ignorar controles interactivos (botones, inputs, links, selectores)
    if (target.closest('button, [role="button"], a, input, select, textarea')) return;

    // Si el toque se origina dentro del cuerpo deslizable, solo permitir arrastre de la gaveta si está en el tope superior
    const scrollContainer = target.closest('[data-sheet-scrollable="true"]') as HTMLElement | null;
    if (scrollContainer) {
      const hasOverflow = scrollContainer.scrollHeight > scrollContainer.clientHeight + 2;
      if (hasOverflow && scrollContainer.scrollTop > 0) {
        return;
      }
    }

    const sheet = sheetRef.current;
    if (!sheet) return;

    if (typeof sheet.setPointerCapture === 'function') {
      try {
        sheet.setPointerCapture(e.pointerId);
      } catch {
        // Fallback defensivo
      }
    }
    isDraggingRef.current = true;
    grabOffsetYRef.current = (e.clientY ?? 0) - currentDeltaYRef.current;
    historyRef.current = [{ y: e.clientY ?? 0, time: performance.now() }];

    sheet.style.transition = 'none';
    if (backdropRef.current) backdropRef.current.style.transition = 'none';
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !sheetRef.current) return;

    const rawDeltaY = (e.clientY ?? 0) - grabOffsetYRef.current;
    const sheetHeight = sheetRef.current.offsetHeight || 500;

    let appliedY: number;
    if (rawDeltaY < 0) {
      // Arrastre hacia arriba pasado el tope superior -> Resistencia elástica (Rubber-band)
      appliedY = rubberband(rawDeltaY, sheetHeight, 0.55);
    } else {
      // Arrastre hacia abajo -> Seguimiento 1:1 directo
      appliedY = rawDeltaY;
    }

    currentDeltaYRef.current = appliedY;

    // Mutación directa a nivel de compositor GPU (Cero setState para 120fps sostenidos)
    sheetRef.current.style.transform = `translate3d(0, ${appliedY}px, 0)`;

    if (backdropRef.current) {
      const dismissRatio = Math.max(0, Math.min(1, appliedY / (sheetHeight * 0.75)));
      backdropRef.current.style.opacity = String(1 - dismissRatio * 0.7);
    }

    const now = performance.now();
    historyRef.current.push({ y: e.clientY ?? 0, time: now });
    while (historyRef.current.length > 2 && now - historyRef.current[0].time > 120) {
      historyRef.current.shift();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !sheetRef.current) return;
    isDraggingRef.current = false;

    if (typeof sheetRef.current.releasePointerCapture === 'function') {
      try {
        sheetRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Manejo defensivo
      }
    }

    const sheet = sheetRef.current;
    const sheetHeight = sheet.offsetHeight || 500;
    const currentY = currentDeltaYRef.current;

    // Cálculo de velocidad de salida (px/s)
    const history = historyRef.current;
    let velocity = 0;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = (last.time - first.time) / 1000;
      if (dt > 0.005) {
        velocity = (last.y - first.y) / dt;
      }
    }

    // Proyección de posición final según inercia de Apple
    const projectedEndpoint = currentY + projectMomentum(velocity, 0.998);
    const shouldDismiss =
      velocity > 500 ||
      currentY > sheetHeight * 0.4 ||
      (velocity > 0 && projectedEndpoint > sheetHeight * 0.48);

    if (shouldDismiss) {
      triggerSymmetricClose();
    } else {
      // Retorno elástico a posición de apertura
      sheet.style.transition =
        'transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 250ms ease-out';
      sheet.style.transform = 'translate3d(0, 0, 0)';
      sheet.style.opacity = '1';
      currentDeltaYRef.current = 0;

      if (backdropRef.current) {
        backdropRef.current.style.transition = 'opacity 250ms ease-out';
        backdropRef.current.style.opacity = '1';
      }
    }
  };

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
        // En modo solo contraseña, revocar explícitamente el PIN previo al editar
        if (usuarioAEditar) {
          formData.set('pin', '');
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
        triggerSymmetricClose();
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
    'flex items-center gap-2.5 bg-tertiary px-3.5 py-3 rounded-2xl border border-separator focus-within:border-terracotta transition-colors shadow-xs';
  const inputClass =
    'w-full bg-transparent text-xs font-semibold text-label-primary placeholder:text-label-quaternary focus:outline-none';

  return (
    <div className="relative min-h-screen bg-system text-label-primary p-4 sm:p-8 overflow-x-clip transition-colors duration-300">
      {/* Resplandores ambientales iOS Liquid Glass */}
      <div className="ambient-glow-mint top-[-50px] right-[-50px]" />
      <div className="ambient-glow-terracotta bottom-[-50px] left-[-50px]" />

      <div className="relative z-10 max-w-5xl mx-auto space-y-6 animate-fade-in-up">
        {/* Notificación flotante con Liquid Glass */}
        {notificacion && (
          <div
            role="status"
            className={`fixed top-20 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-xs animate-fade-in-up border backdrop-blur-md ${
              notificacion.tipo === 'error'
                ? 'bg-red-500/15 border-red-500/30 text-red-700 dark:text-red-300'
                : 'glass-modal border-separator text-label-primary'
            }`}
          >
            {notificacion.tipo === 'error' ? (
              <AlertCircle size={16} className="shrink-0 text-red-500" />
            ) : (
              <CheckCircle2 size={16} className="shrink-0 text-mint" />
            )}
            <span>{notificacion.texto}</span>
          </div>
        )}

        {/* Cabecera Apple HIG con resumen y filtros */}
        <div className="glass-card p-5 sm:p-6 rounded-[2rem] space-y-4 border border-separator shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-label-tertiary hover:text-label-primary transition-colors mb-1.5 active:scale-95"
              >
                <ArrowLeft size={14} />
                <span>Volver al Lobby</span>
              </Link>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-label-primary tracking-tight">
                  Habitantes del hogar
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-mint/15 text-mint border border-mint/25">
                  {formatPlural(conteos.todos, 'habitante', 'habitantes')}
                </span>
              </div>
              <p className="text-xs text-label-tertiary mt-1">
                Administración de accesos con PIN rápido y credenciales del hogar
              </p>
            </div>

            <button
              type="button"
              onClick={abrirNuevoMiembro}
              className="touch-target px-4 py-2.5 rounded-2xl bg-terracotta text-white font-bold text-xs shadow-sm hover:bg-terracotta-hover active:scale-97 cursor-pointer transition-transform flex items-center gap-2 self-start sm:self-auto shrink-0"
            >
              <UserPlus size={16} />
              <span>Agregar habitante</span>
            </button>
          </div>

          {/* Segmented Control Apple HIG para filtrado */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5 no-scrollbar select-none">
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
                  className={`touch-target px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 border active:scale-95 ${
                    active
                      ? 'bg-terracotta text-white border-terracotta shadow-xs'
                      : 'bg-tertiary text-label-secondary border-separator hover:text-label-primary hover:bg-tertiary/80'
                  }`}
                >
                  <Icon size={13} className={active ? 'text-white' : 'text-label-tertiary'} />
                  <span>{pill.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                      active ? 'bg-white/25 text-white' : 'bg-secondary text-label-primary'
                    }`}
                  >
                    {pill.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Directorio de Habitantes en 2 Columnas con Blindaje Break-UI */}
        {usuariosFiltrados.length === 0 ? (
          <div className="glass-card p-10 rounded-[2rem] text-center space-y-3 border border-dashed border-separator">
            <div className="w-12 h-12 rounded-2xl bg-tertiary text-label-tertiary flex items-center justify-center mx-auto">
              <User size={22} />
            </div>
            <div>
              <p className="text-sm font-bold text-label-primary">Sin habitantes en este filtro</p>
              <p className="text-xs text-label-tertiary mt-0.5">
                Cambia el filtro de acceso o registra un nuevo habitante para comenzar.
              </p>
            </div>
            <button
              type="button"
              onClick={abrirNuevoMiembro}
              className="touch-target px-4 py-2 rounded-xl bg-tertiary border border-separator text-xs font-bold text-label-primary hover:bg-tertiary/80 active:scale-97 cursor-pointer transition-transform"
            >
              Registrar nuevo habitante
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {usuariosFiltrados.map((u) => {
              const initials = getSafeInitials(u.nombre);
              const isMenuOpen = activeMenuId === u.id;

              return (
                <article
                  key={u.id}
                  className={`glass-card p-4 sm:p-5 rounded-[1.8rem] flex flex-col justify-between gap-4 border border-separator/80 hover:border-separator transition-all shadow-xs relative ${
                    isMenuOpen ? 'z-40 ring-1 ring-terracotta/40 shadow-lg' : 'z-0'
                  }`}
                  style={{ zIndex: isMenuOpen ? 40 : 1 }}
                >
                  {/* Encabezado de la Tarjeta con flex-shrink: 0 y wrap seguro */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      {/* Avatar con flex-shrink: 0 para evitar deformación oval */}
                      <div className="w-11 h-11 rounded-2xl bg-terracotta text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs select-none">
                        {initials}
                      </div>

                      {/* Texto seguro con overflow-wrap: anywhere y min-w-0 */}
                      <div className="min-w-0 flex-1">
                        <h2 className="text-sm sm:text-base font-bold text-label-primary truncate leading-tight">
                          {u.nombre}
                        </h2>
                        <p className="text-xs text-label-secondary [overflow-wrap:anywhere] break-words leading-snug mt-0.5">
                          {u.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-tertiary text-label-secondary border border-separator shrink-0 inline-flex items-center gap-1">
                        {u.tienePin ? (
                          <ShieldCheck size={12} className="text-mint shrink-0" />
                        ) : (
                          <Key size={12} className="text-terracotta shrink-0" />
                        )}
                        <span>{u.tienePin ? 'PIN activo' : 'Solo clave'}</span>
                      </span>

                      {/* Botón de Menú de Opciones (Elevado en z-index para no solaparse con usuarios inferiores) */}
                      <div className="relative" data-popover-container="true" style={{ zIndex: isMenuOpen ? 50 : 'auto' }}>
                        <button
                          type="button"
                          aria-label={`Opciones de ${u.nombre}`}
                          aria-expanded={isMenuOpen}
                          onClick={() => setActiveMenuId(isMenuOpen ? null : u.id)}
                          className={`touch-target w-8 h-8 rounded-xl border flex items-center justify-center cursor-pointer transition-all active:scale-95 ${
                            isMenuOpen
                              ? 'bg-terracotta text-white border-terracotta shadow-xs'
                              : 'bg-tertiary border-separator text-label-secondary hover:text-label-primary'
                          }`}
                        >
                          <MoreHorizontal size={14} />
                        </button>

                        {/* Menú Emergente Anclado Apple HIG (Elevado en z-50, con sombreado rico y superficie sólida para flotar sobre tarjetas inferiores) */}
                        {isMenuOpen && (
                          <>
                            {/* Backdrop transparente/sutil para cerrar al clic fuera y garantizar foco */}
                            <div
                              className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[0.5px] sm:bg-transparent"
                              onClick={() => setActiveMenuId(null)}
                              aria-hidden="true"
                            />
                            <div
                              role="menu"
                              aria-orientation="vertical"
                              className="popover-fluid-container animate-popover-spring absolute right-0 top-full mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-2xl bg-secondary/95 dark:bg-secondary/95 backdrop-blur-2xl p-1.5 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.45)] dark:shadow-[0_24px_56px_-8px_rgba(0,0,0,0.7)] border border-separator z-50 origin-top-right select-none"
                            >
                              <p className="px-3 py-1 text-[10px] font-bold text-label-tertiary uppercase tracking-wider">
                                Opciones de habitante
                              </p>
                              <button
                                type="button"
                                onClick={() => abrirEditarMiembro(u)}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-label-primary hover:bg-tertiary flex items-center gap-2 cursor-pointer transition-colors active:scale-97"
                              >
                                <Pencil size={13} className="text-terracotta" />
                                <span>Editar acceso</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => copiarEmail(u.email)}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-label-primary hover:bg-tertiary flex items-center gap-2 cursor-pointer transition-colors active:scale-97"
                              >
                                <Copy size={13} className="text-label-secondary" />
                                <span>Copiar correo</span>
                              </button>
                              <div className="my-1 border-t border-separator/60" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setUsuarioAEliminar(u);
                                }}
                                className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center gap-2 cursor-pointer transition-colors active:scale-97"
                              >
                                <Trash2 size={13} />
                                <span>Eliminar del hogar</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Acciones Directas Inmediatas */}
                  <div className="flex items-center justify-between pt-3 border-t border-separator/70 gap-2">
                    <button
                      type="button"
                      onClick={() => abrirEditarMiembro(u)}
                      className="touch-target px-3 py-1.5 rounded-xl bg-tertiary border border-separator text-label-primary hover:bg-terracotta hover:text-white hover:border-terracotta text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-97 transition-all shadow-xs"
                    >
                      <Pencil size={13} />
                      <span>Editar acceso</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setUsuarioAEliminar(u)}
                      className="touch-target px-2.5 py-1.5 rounded-xl border border-transparent text-xs font-semibold text-label-tertiary hover:text-red-600 dark:hover:text-red-400 flex items-center gap-1 cursor-pointer active:scale-97 transition-colors"
                    >
                      <Trash2 size={13} />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* GAVETA FLUIDA APPLE HIG · CREAR / EDITAR HABITANTE (1:1 Drag-to-Dismiss & Adaptive Modal) */}
      {mounted &&
        (isSheetOpen || isClosing) &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-6 select-none touch-none overscroll-none">
            {/* Scrim / Fondo con blur y opacidad GPU (Touch-none para aislar gestos del fondo) */}
            <div
              ref={backdropRef}
              onClick={triggerSymmetricClose}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-240 ease-out touch-none overscroll-none"
              style={{ opacity: isVisible && !isClosing ? 1 : 0 }}
            />

            {/* Contenedor Modal / Bottom Sheet Fluido */}
            <div
              ref={sheetRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              role="dialog"
              aria-modal="true"
              aria-labelledby="habitante-sheet-title"
              className="sheet-fluid-container relative z-10 glass-modal w-full max-w-lg rounded-t-[2.25rem] sm:rounded-[2rem] max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-separator will-change-transform touch-none overscroll-none pb-safe sm:pb-0 my-0 sm:my-auto"
              style={{
                transform:
                  isVisible && !isClosing
                    ? 'translate3d(0, 0, 0)'
                    : 'translate3d(0, 100%, 0)',
                opacity: isVisible && !isClosing ? 1 : 0,
                transition: isClosing
                  ? 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1), opacity 240ms ease-out'
                  : 'transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 250ms ease-out',
              }}
            >
              {/* Encabezado fijo y manija física de arrastre (Touch-none) */}
              <div
                data-drag-handle="true"
                className="shrink-0 px-5 sm:px-6 pt-3.5 pb-3 border-b border-separator/80 cursor-grab active:cursor-grabbing select-none touch-none"
              >
                {/* Manija táctil Apple HIG */}
                <div className="w-12 h-1.5 bg-separator/80 hover:bg-separator rounded-full mx-auto mb-3 sm:hidden transition-colors touch-none" />

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-terracotta text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {nombre ? getSafeInitials(nombre) : <User size={18} />}
                    </div>
                    <div>
                      <h3
                        id="habitante-sheet-title"
                        className="text-base font-bold text-label-primary leading-tight"
                      >
                        {usuarioAEditar ? 'Editar habitante' : 'Nuevo habitante'}
                      </h3>
                      <p className="text-[11px] text-label-tertiary mt-0.5">
                        {usuarioAEditar
                          ? `Editando credenciales de ${usuarioAEditar.nombre}`
                          : 'Datos de contacto y método de acceso al sistema'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Cerrar modal"
                    onClick={triggerSymmetricClose}
                    className="touch-target w-8 h-8 rounded-full bg-tertiary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer active:scale-95 transition-transform shrink-0"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Formulario con cuerpo deslizable y pie sticky */}
              <form onSubmit={handleSubmitMiembro} className="flex flex-col min-h-0 flex-1 overscroll-contain">
                {/* Cuerpo desplazable protegido: únicamente aquí se permite scroll vertical touch-pan-y */}
                <div
                  data-sheet-scrollable="true"
                  className="flex-1 overflow-y-auto overscroll-contain px-5 sm:px-6 py-4 space-y-4 touch-pan-y max-h-[55vh] sm:max-h-[60vh]"
                >
                  {errorForm && (
                    <div className="p-3.5 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 text-xs font-bold text-center animate-apple-shake">
                      {errorForm}
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-label-secondary block">
                        Nombre completo
                      </label>
                      <div className={fieldClass}>
                        <User size={16} className="text-terracotta shrink-0" />
                        <input
                          type="text"
                          required
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          placeholder="Nombre del habitante"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-label-secondary block">
                        Correo electrónico
                      </label>
                      <div className={fieldClass}>
                        <Mail size={16} className="text-terracotta shrink-0" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="correo@ejemplo.com"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Selector segmentado Apple HIG para método de acceso */}
                  <div className="space-y-2 pt-1">
                    <label className="text-[11px] font-bold text-label-secondary block">
                      Método de acceso preferido
                    </label>
                    <div
                      role="radiogroup"
                      aria-label="Método de acceso"
                      className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-tertiary border border-separator select-none"
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
                            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all border active:scale-95 ${
                              active
                                ? 'bg-secondary text-label-primary border-separator shadow-xs'
                                : 'text-label-secondary hover:text-label-primary border-transparent'
                            }`}
                          >
                            <Icon size={14} className={active ? 'text-terracotta' : ''} />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {metodoAcceso === 'pin' ? (
                    <div className="p-4 rounded-2xl bg-tertiary/70 border border-separator space-y-3">
                      <p className="text-xs font-semibold text-center text-label-secondary leading-snug">
                        {usuarioAEditar?.tienePin
                          ? 'Nuevo PIN (deja vacío para conservar el actual)'
                          : 'Ingresa 4 dígitos numéricos para acceso rápido'}
                      </p>
                      <div className="relative max-w-[220px] mx-auto">
                        <input
                          ref={pinInputRef}
                          type="password"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={4}
                          value={pin}
                          onChange={(e) =>
                            setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                          }
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                          aria-label="PIN de 4 dígitos"
                        />
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
                                className={`h-12 rounded-xl flex items-center justify-center border bg-secondary transition-all ${
                                  isCurrent || isFilled
                                    ? 'border-terracotta ring-1 ring-terracotta/30'
                                    : 'border-separator'
                                }`}
                              >
                                {isFilled && (
                                  <span className="w-2.5 h-2.5 rounded-full bg-terracotta animate-popover-spring" />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-label-secondary block">
                        Contraseña de acceso
                      </label>
                      <div className={fieldClass}>
                        <Lock size={16} className="text-terracotta shrink-0" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={
                            usuarioAEditar
                              ? 'Nueva contraseña (opcional)'
                              : 'Contraseña segura'
                          }
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Pie fijo con acciones siempre visibles (Sticky Footer con Touch-none) */}
                <div className="shrink-0 grid grid-cols-2 gap-3 px-5 sm:px-6 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:pb-4 border-t border-separator/80 bg-tertiary/40 touch-none overscroll-none">
                  <button
                    type="button"
                    onClick={triggerSymmetricClose}
                    className="touch-target py-2.5 px-4 rounded-xl bg-tertiary border border-separator text-xs font-bold text-label-secondary hover:text-label-primary active:scale-97 cursor-pointer transition-transform"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={procesando}
                    className="touch-target py-2.5 px-4 rounded-xl bg-terracotta text-white text-xs font-bold shadow-sm hover:bg-terracotta-hover active:scale-97 cursor-pointer transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {procesando ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Check size={15} />
                    )}
                    <span>{usuarioAEditar ? 'Guardar cambios' : 'Registrar'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Modal de confirmación para eliminar habitante */}
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
