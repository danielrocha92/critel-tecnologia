'use client';

import { useEffect, useState } from 'react';
import { Toaster } from 'sonner';

export default function ThemeToaster() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const syncTheme = () => {
      setTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
    };

    syncTheme();
    window.addEventListener('critel-theme-change', syncTheme);
    return () => window.removeEventListener('critel-theme-change', syncTheme);
  }, []);

  return <Toaster theme={theme} position="top-right" richColors />;
}
