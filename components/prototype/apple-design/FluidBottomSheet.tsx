'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useSimulatorPortal } from './SimulatorPortalContext';

interface FluidBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

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

export default function FluidBottomSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: FluidBottomSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const { portalContainer, isInsidePhone } = useSimulatorPortal();

  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const grabOffsetYRef = useRef(0);
  const currentDeltaYRef = useRef(0);

  const historyRef = useRef<{ y: number; time: number }[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Montaje seguro en cliente con animación de entrada simétrica
  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      currentDeltaYRef.current = 0;
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 16);
      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Cierre simétrico animado
  const triggerSymmetricClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    setIsVisible(false);

    if (sheetRef.current && backdropRef.current) {
      sheetRef.current.style.transition = 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease-out';
      sheetRef.current.style.transform = 'translate3d(0, 100%, 0)';
      sheetRef.current.style.opacity = '0';
      backdropRef.current.style.transition = 'opacity 250ms ease-out';
      backdropRef.current.style.opacity = '0';
    }

    setTimeout(() => {
      setIsClosing(false);
      currentDeltaYRef.current = 0;
      onClose();
    }, 280);
  }, [isClosing, onClose]);

  // Bloqueo estricto del scroll de fondo en cliente (Anti-Scroll Chaining & Touch Isolation)
  useEffect(() => {
    if (!isOpen && !isClosing) return;

    if (isInsidePhone) {
      // Si está dentro del simulador de iPhone, bloquear el contenedor con scroll interno del chasis
      const simulatorScroll = portalContainer?.querySelector('.overflow-y-auto') as HTMLElement | null;
      if (simulatorScroll) {
        const prevOverflow = simulatorScroll.style.overflowY;
        simulatorScroll.style.overflowY = 'hidden';
        return () => {
          simulatorScroll.style.overflowY = prevOverflow;
        };
      }
      return;
    }

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

    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

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

    const handleTouchMove = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const scrollEl = target.closest('[data-sheet-scrollable="true"]') as HTMLElement | null;
      if (scrollEl) {
        const hasScrollOverflow = scrollEl.scrollHeight > scrollEl.clientHeight + 1;
        if (!hasScrollOverflow) {
          if (e.cancelable) e.preventDefault();
          return;
        }

        const currentY = e.touches && e.touches[0] ? e.touches[0].clientY : 0;
        const deltaY = currentY - touchStartY;
        const isAtTop = scrollEl.scrollTop <= 0;
        const isAtBottom = scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 1;

        if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
          if (e.cancelable) e.preventDefault();
          return;
        }
        return;
      }

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
  }, [isOpen, isClosing, isInsidePhone, portalContainer]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        triggerSymmetricClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isClosing, triggerSymmetricClose]);

  // --- GESTOS DE MANIPULACIÓN DIRECTA 1:1 CON POINTER CAPTURE ---
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isClosing) return;
    const target = e.target as HTMLElement;
    // Ignorar controles interactivos (botones, inputs, links)
    if (target.closest('button, [role="button"], a, input, select, textarea')) return;

    // Si el toque se origina dentro del cuerpo deslizable, solo permitir arrastre si está en el tope
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
        // Manejo seguro por si el puntero ya no está capturado
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
      velocity > 500 || // Flick rápido hacia abajo
      currentY > sheetHeight * 0.40 || // Pasó el 40% de la altura
      (velocity > 0 && projectedEndpoint > sheetHeight * 0.48); // La inercia positiva lo lleva al descarte

    if (shouldDismiss) {
      // Commit de descarte: transición de salida simétrica
      setIsClosing(true);
      setIsVisible(false);

      sheet.style.transition = 'transform 260ms cubic-bezier(0.32, 0.72, 0, 1), opacity 240ms ease-out';
      sheet.style.transform = 'translate3d(0, 100%, 0)';
      sheet.style.opacity = '0';

      if (backdropRef.current) {
        backdropRef.current.style.transition = 'opacity 240ms ease-out';
        backdropRef.current.style.opacity = '0';
      }

      setTimeout(() => {
        setIsClosing(false);
        currentDeltaYRef.current = 0;
        onClose();
      }, 260);
    } else {
      // Rebote de retorno a la posición abierta con resorte
      sheet.style.transition = 'transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 250ms ease-out';
      sheet.style.transform = 'translate3d(0, 0, 0)';
      sheet.style.opacity = '1';
      currentDeltaYRef.current = 0;

      if (backdropRef.current) {
        backdropRef.current.style.transition = 'opacity 250ms ease-out';
        backdropRef.current.style.opacity = '1';
      }
    }
  };

  if (!mounted || (!isOpen && !isClosing)) return null;

  // Clases y posicionamiento adaptativos según si está dentro del iPhone o en Pantalla Completa
  const overlayClasses = isInsidePhone
    ? 'absolute inset-0 z-50 flex items-end justify-center p-0 select-none overflow-hidden touch-none overscroll-none'
    : 'fixed inset-0 z-[100000] flex items-end sm:items-center justify-center p-0 sm:p-6 select-none touch-none overscroll-none';

  const containerClasses = isInsidePhone
    ? 'sheet-fluid-container relative z-10 glass-modal w-full max-w-full rounded-t-[2.25rem] rounded-b-none max-h-[88%] flex flex-col overflow-hidden shadow-2xl border-t border-x border-separator will-change-transform touch-none overscroll-none pb-4'
    : 'sheet-fluid-container relative z-10 glass-modal w-full max-w-lg rounded-t-[2.25rem] sm:rounded-[2rem] max-h-[90dvh] sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-separator will-change-transform touch-none overscroll-none pb-safe sm:pb-0 my-0 sm:my-auto';

  const bodyClasses = isInsidePhone
    ? 'flex-1 overflow-y-auto px-5 py-4 space-y-4 touch-pan-y overscroll-contain max-h-[52vh]'
    : 'flex-1 overflow-y-auto px-5 sm:px-6 py-4 space-y-4 touch-pan-y overscroll-contain max-h-[55vh]';

  const sheetContent = (
    <div className={overlayClasses}>
      {/* Fondo scrim con blur y opacidad GPU (Touch-none para aislar gestos del fondo) */}
      <div
        ref={backdropRef}
        onClick={triggerSymmetricClose}
        className={`${
          isInsidePhone ? 'absolute' : 'fixed'
        } inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-250 ease-out touch-none overscroll-none`}
        style={{ opacity: isVisible && !isClosing ? 1 : 0 }}
      />

      {/* Contenedor de la Gaveta Inferior Fluida */}
      <div
        ref={sheetRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fluid-sheet-title"
        className={containerClasses}
        style={{
          transform: isVisible && !isClosing ? 'translate3d(0, 0, 0)' : 'translate3d(0, 100%, 0)',
          opacity: isVisible && !isClosing ? 1 : 0,
          transition: isClosing
            ? 'transform 280ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease-out'
            : 'transform 320ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 250ms ease-out',
        }}
      >
        {/* Cabecera interactiva y manija física de arrastre (Touch-none para evitar scroll de fondo) */}
        <div
          data-drag-handle="true"
          className="shrink-0 px-5 sm:px-6 pt-3.5 pb-3 border-b border-separator/80 cursor-grab active:cursor-grabbing select-none touch-none"
        >
          {/* Manija táctil Apple HIG */}
          <div className="w-12 h-1.5 bg-separator/80 hover:bg-separator rounded-full mx-auto mb-3 transition-colors touch-none" />

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h3 id="fluid-sheet-title" className="apple-headline font-bold text-label-primary truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="apple-footnote text-label-tertiary truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>

            <button
              type="button"
              aria-label="Cerrar gaveta"
              onClick={triggerSymmetricClose}
              className="touch-target w-8 h-8 rounded-full bg-tertiary border border-separator flex items-center justify-center text-label-secondary hover:text-label-primary cursor-pointer active:scale-95 transition-transform shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Contenido deslizable interno protegido */}
        <div data-sheet-scrollable="true" className={bodyClasses}>
          {children}
        </div>

        {/* Pie opcional con acción sticky y siempre visible (Touch-none) */}
        {footer && (
          <div className="shrink-0 p-4 sm:px-6 border-t border-separator/80 bg-tertiary/40 touch-none overscroll-none">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  const targetContainer = (isInsidePhone && portalContainer) || document.body;
  return createPortal(sheetContent, targetContainer);
}
