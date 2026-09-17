'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  function cycleTheme() {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  }

  const title = !mounted
    ? 'Cambiar tema de color'
    : theme === 'system'
    ? `Tema: Siguiendo el Sistema (${resolvedTheme === 'dark' ? 'Oscuro' : 'Claro'}) - Clic para cambiar`
    : theme === 'light'
    ? 'Tema: Forzado Claro - Clic para cambiar'
    : 'Tema: Forzado Oscuro - Clic para cambiar';

  return (
    <button
      type="button"
      onClick={cycleTheme}
      title={title}
      aria-label={title}
      suppressHydrationWarning
      className="w-8 h-8 rounded-xl flex items-center justify-center bg-tertiary hover:bg-tertiary-hover text-label-secondary hover:text-label-primary transition cursor-pointer active:scale-90 border border-separator shrink-0"
    >
      {!mounted || theme === 'system' ? (
        <Laptop size={15} strokeWidth={2.2} />
      ) : theme === 'dark' ? (
        <Moon size={15} strokeWidth={2.2} />
      ) : (
        <Sun size={15} strokeWidth={2.2} />
      )}
    </button>
  );
}
