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
      className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#EFEAE0] dark:bg-[#282C25] hover:bg-[#E8E0D2] dark:hover:bg-[#33382F] text-[#6E6A62] dark:text-[#ABA69B] hover:text-[#2E2B27] dark:hover:text-[#F5F2EB] transition cursor-pointer active:scale-90 border border-[rgba(115,111,104,0.22)] dark:border-[rgba(255,255,255,0.14)] shrink-0"
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
