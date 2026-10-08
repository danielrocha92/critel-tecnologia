"use client";

import { useEffect, useState } from 'react';
import styles from './ThemeToggle.module.css';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const initialTheme = savedTheme === 'dark' ? 'dark' : 'light';
    setTheme(initialTheme);
    document.documentElement.setAttribute('data-theme', initialTheme);
    document.documentElement.style.colorScheme = initialTheme;
    setMounted(true);

    const syncTheme = () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      setTheme(currentTheme);
    };
    const syncFromStorage = (event: StorageEvent) => {
      if (event.key !== 'theme') return;
      const currentTheme = event.newValue === 'dark' ? 'dark' : 'light';
      setTheme(currentTheme);
      document.documentElement.setAttribute('data-theme', currentTheme);
      document.documentElement.style.colorScheme = currentTheme;
      window.dispatchEvent(new Event('critel-theme-change'));
      document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
        meta.content = currentTheme === 'dark' ? '#0b1120' : '#f4f6fa';
      });
    };
    window.addEventListener('critel-theme-change', syncTheme);
    window.addEventListener('storage', syncFromStorage);
    return () => {
      window.removeEventListener('critel-theme-change', syncTheme);
      window.removeEventListener('storage', syncFromStorage);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
      meta.content = nextTheme === 'dark' ? '#0b1120' : '#f4f6fa';
    });
    window.dispatchEvent(new Event('critel-theme-change'));
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
