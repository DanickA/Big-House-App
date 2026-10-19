'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

export interface MenuItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface MenuGroup {
  id?: string;
  items: MenuItem[];
}

export interface PullDownMenuProps {
  groups: MenuGroup[];
  trigger?: React.ReactNode;
  align?: 'left' | 'right';
  ariaLabel?: string;
  className?: string;
}

export default function PullDownMenu({
  groups,
  trigger,
  align = 'right',
  ariaLabel = 'Menú de opciones',
  className = '',
}: PullDownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [popoverPlacement, setPopoverPlacement] = useState<{
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'right';
  }>({ vertical: 'bottom', horizontal: align });
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number } | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    const checkViewport = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  // Cálculo de posición Fixed con soporte de Portal y colisiones de bordes
  const updatePosition = () => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const estimatedHeight = popoverRef.current ? popoverRef.current.offsetHeight : 220;
    const vertical = spaceBelow < estimatedHeight && spaceAbove > spaceBelow ? 'top' : 'bottom';

    const popoverWidth = 224; // w-56 = 14rem = 224px

    let top = vertical === 'bottom' ? rect.bottom + 8 : rect.top - estimatedHeight - 8;
    let left = align === 'right' ? rect.right - popoverWidth : rect.left;

    // Ajuste contra desbordamientos fuera de la ventana
    if (left + popoverWidth > window.innerWidth - 12) {
      left = window.innerWidth - popoverWidth - 12;
    }
    if (left < 12) {
      left = 12;
    }
    if (top < 12) {
      top = 12;
    }

    setPopoverCoords({ top, left });
    setPopoverPlacement({ vertical, horizontal: align });
  };

  useEffect(() => {
    if (isOpen && !isMobile) {
      updatePosition();
      const onScrollOrResize = () => {
        updatePosition();
      };
      window.addEventListener('resize', onScrollOrResize);
      window.addEventListener('scroll', onScrollOrResize, true);
      return () => {
        window.removeEventListener('resize', onScrollOrResize);
        window.removeEventListener('scroll', onScrollOrResize, true);
      };
    }
  }, [isOpen, isMobile, align]);

  // Cerrar con Escape o clic fuera (evaluando trigger y portal)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isMobile]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    setIsOpen(false);
    item.onClick();
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Botón Disparador (Touch target asegurado de mínimo 44x44 pt conforme a Apple HIG) */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger ? (
          trigger
        ) : (
          <button
            type="button"
            aria-label={ariaLabel}
            aria-expanded={isOpen}
            aria-haspopup="true"
            className="touch-target w-11 h-11 rounded-full flex items-center justify-center text-label-secondary hover:text-label-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer active:scale-92"
          >
            <MoreHorizontal size={18} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* 1. FALLBACK AUTOMÁTICO A ACTION SHEET INFERIOR EN DISPOSITIVOS MÓVILES (< 640px) */}
      {isOpen && isMobile && mounted && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-xs flex flex-col justify-end p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm mx-auto space-y-2 animate-fade-in-up"
          >
            {/* Grupos de Acciones agrupadas estilo Apple HIG Sheet */}
            <div className="bg-secondary/95 backdrop-blur-2xl rounded-2xl border border-separator overflow-hidden shadow-2xl divide-y divide-separator">
              {groups.map((group, groupIdx) => (
                <div key={group.id || groupIdx} className="divide-y divide-separator">
                  {group.items.map((item) => {
                    const IconComp = item.icon;
                    const isDestructive = item.destructive;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={item.disabled}
                        onClick={() => handleItemClick(item)}
                        className={`w-full min-h-[50px] px-4 py-3 flex items-center gap-3 text-left transition-colors cursor-pointer active:bg-tertiary ${
                          item.disabled
                            ? 'opacity-40 pointer-events-none'
                            : isDestructive
                            ? 'text-terracotta font-semibold'
                            : 'text-label-primary font-medium'
                        }`}
                      >
                        {IconComp && (
                          <IconComp
                            size={18}
                            strokeWidth={isDestructive ? 2.2 : 2}
                            className={`shrink-0 ${isDestructive ? 'text-terracotta' : 'text-label-secondary'}`}
                          />
                        )}
                        <span className="truncate text-sm">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Botón Cancelar Independiente estilo Action Sheet */}
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full min-h-[50px] rounded-2xl bg-secondary/95 backdrop-blur-2xl border border-separator font-semibold text-center text-label-primary flex items-center justify-center cursor-pointer active:scale-98 shadow-md text-sm"
            >
              Cancelar
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 2. POPOVER DESKTOP ADAPTATIVO CON DETECCIÓN DE COLISIONES DE BORDES (>= 640px) */}
      {isOpen && !isMobile && mounted && popoverCoords && createPortal(
        <div
          ref={popoverRef}
          role="menu"
          aria-label={ariaLabel}
          style={{
            position: 'fixed',
            top: `${popoverCoords.top}px`,
            left: `${popoverCoords.left}px`,
            zIndex: 9999,
          }}
          className={`
            w-56 max-w-[90vw]
            rounded-2xl bg-secondary/95 backdrop-blur-2xl
            border border-separator shadow-2xl p-1.5
            animate-fade-in-up select-none
          `}
        >
          {groups.map((group, groupIdx) => (
            <React.Fragment key={group.id || groupIdx}>
              {groupIdx > 0 && <div className="h-px bg-separator my-1" role="separator" />}
              <div className="space-y-0.5" role="group">
                {group.items.map((item) => {
                  const IconComp = item.icon;
                  const isDestructive = item.destructive;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="menuitem"
                      disabled={item.disabled}
                      onClick={() => handleItemClick(item)}
                      className={`
                        w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl
                        apple-footnote transition-all duration-150 text-left
                        cursor-pointer active:scale-[0.98]
                        ${
                          item.disabled
                            ? 'opacity-40 pointer-events-none'
                            : isDestructive
                            ? 'text-terracotta hover:bg-terracotta/20 hover:text-terracotta dark:hover:bg-terracotta/20 font-semibold'
                            : 'text-label-primary hover:bg-tertiary font-medium'
                        }
                      `}
                    >
                      {IconComp && (
                        <IconComp
                          size={15}
                          strokeWidth={isDestructive ? 2.2 : 2}
                          className={`shrink-0 ${isDestructive ? 'text-terracotta' : 'text-label-secondary'}`}
                        />
                      )}
                      <span className="truncate flex-1">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}
