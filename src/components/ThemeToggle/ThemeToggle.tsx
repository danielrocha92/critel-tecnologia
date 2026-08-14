"use client";

import { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check saved theme in localStorage or system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialTheme = prefersDark ? 'dark' : 'light';
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  if (!mounted) {
    return <div className={styles.togglePlaceholder} aria-hidden="true" />;
  }

  const isDark = theme === 'dark';

  return (
    <button
      className={styles.themeToggleBtn}
      onClick={toggleTheme}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      title={isDark ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
      type="button"
    >
      <div className={`${styles.iconTrack} ${isDark ? styles.darkTrack : styles.lightTrack}`}>
        <span className={`${styles.iconWrapper} ${styles.sunIcon}`}>
          <Sun size={17} />
        </span>
        <span className={`${styles.iconWrapper} ${styles.moonIcon}`}>
          <Moon size={16} />
        </span>
        <div className={`${styles.sliderThumb} ${isDark ? styles.thumbDark : styles.thumbLight}`} />
      </div>
    </button>
  );
}
