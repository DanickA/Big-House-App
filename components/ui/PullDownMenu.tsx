'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar con Escape o clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    setIsOpen(false);
    item.onClick();
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Botón Disparador (Touch target asegurado de mínimo 44x44 pt) */}
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger ? (
          trigger
        ) : (
          <button
            type="button"
            aria-label={ariaLabel}
            aria-expanded={isOpen}
            aria-haspopup="true"
            className="w-11 h-11 rounded-full flex items-center justify-center text-label-secondary hover:text-label-primary hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-150 cursor-pointer active:scale-92"
          >
            <MoreHorizontal size={18} strokeWidth={2.2} />
          </button>
        )}
      </div>

      {/* Popover Desplegable Glassmorphic (Apple HIG Pull-Down Menu) */}
      {isOpen && (
        <div
          role="menu"
          aria-label={ariaLabel}
          className={`
            absolute top-full mt-2 w-56 max-w-[90vw] z-50
            rounded-2xl bg-white/95 dark:bg-[#201C1A]/95 backdrop-blur-2xl
            border border-separator shadow-xl p-1.5
            animate-fade-in-up select-none
            ${align === 'right' ? 'right-0' : 'left-0'}
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
                        w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl
                        apple-footnote transition-all duration-150 text-left
                        cursor-pointer active:scale-[0.98]
                        ${
                          item.disabled
                            ? 'opacity-40 pointer-events-none'
                            : isDestructive
                            ? 'text-terracotta hover:bg-[#ce9b8c]/20 hover:text-terracotta dark:hover:bg-terracotta/20 font-semibold'
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
        </div>
      )}
    </div>
  );
}
