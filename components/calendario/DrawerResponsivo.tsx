'use client';

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface DrawerResponsivoProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function DrawerResponsivo({ isOpen, onClose, title, children }: DrawerResponsivoProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end md:justify-center md:items-center">
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity" 
        onClick={onClose} 
      />
      <div 
        className="
          relative z-50 w-full max-h-[90vh] bg-white flex flex-col
          rounded-t-2xl md:rounded-2xl md:w-[500px] md:max-h-[85vh]
          shadow-xl overflow-hidden
          animate-in slide-in-from-bottom-full md:slide-in-from-bottom-0 md:zoom-in-95
        "
      >
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
