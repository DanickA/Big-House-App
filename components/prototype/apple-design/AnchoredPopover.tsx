'use client';

import React, { useState, useRef, useEffect } from 'react';

interface AnchoredPopoverProps {
  trigger: (props: { isOpen: boolean; toggle: () => void }) => React.ReactNode;
  children: (props: { close: () => void }) => React.ReactNode;
  align?: 'right' | 'left';
  className?: string;
}

export default function AnchoredPopover({
  trigger,
  children,
  align = 'right',
  className = '',
}: AnchoredPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = () => {
    setIsOpen((prev) => !prev);
  };

  const close = () => {
    if (isOpen) {
      setIsOpen(false);
    }
  };

  // Cierre al hacer clic fuera
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${isOpen ? 'z-40' : 'z-0'}`}
      style={{ zIndex: isOpen ? 60 : 'auto' }}
    >
      {trigger({ isOpen, toggle })}

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className={`popover-fluid-container animate-popover-spring absolute z-50 mt-2 w-64 rounded-2xl bg-secondary/95 dark:bg-secondary/95 backdrop-blur-2xl p-2 shadow-[0_20px_50px_-10px_rgba(0,0,0,0.45)] dark:shadow-[0_24px_56px_-8px_rgba(0,0,0,0.7)] border border-separator will-change-transform ${
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          } ${className}`}
        >
          {children({ close })}
        </div>
      )}
    </div>
  );
}

