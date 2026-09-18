'use client';

import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Quando o conteúdo rola (window)
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '40px',
        right: '40px',
        backgroundColor: '#c9253a',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 9999,
        transition: 'all 0.3s ease'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.backgroundColor = '#a81c2e';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.backgroundColor = '#c9253a';
      }}
      aria-label="Voltar ao topo"
    >
      <ChevronUp size={24} />
    </button>
  );
}
