'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('bighouse-theme') as Theme | null;
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      setThemeState(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    function aplicarTema(t: Theme) {
      const isSystemDark = mediaQuery.matches;
      const actual: ResolvedTheme = t === 'system' ? (isSystemDark ? 'dark' : 'light') : t;
      setResolvedTheme(actual);

      const root = document.documentElement;
      if (t === 'system') {
        root.removeAttribute('data-theme');
      } else {
        root.setAttribute('data-theme', t);
      }

      if (actual === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Actualizar color de la barra de estado móvil
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', actual === 'dark' ? '#121411' : '#F4EFE6');
      }
    }

    aplicarTema(theme);

    const handleChange = () => {
      if (theme === 'system') {
        aplicarTema('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme);
    try {
      localStorage.setItem('bighouse-theme', newTheme);
    } catch {
      // Ignorar errores de localStorage
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
