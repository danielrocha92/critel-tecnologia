'use client';

import { useEffect, useState } from 'react';
import styles from './FloatingActions.module.css';
import { ArrowUp } from 'lucide-react';

export default function FloatingActions() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show back to top button when scrolled down 300px
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };



  return (
    <>
      {/* Back to Top Button - Bottom Right */}
      <button 
        onClick={scrollToTop} 
        className={`${styles.floatingBtn} ${styles.backToTopBtn} ${showBackToTop ? styles.visible : ''}`}
        aria-label="Voltar ao topo"
      >
        <ArrowUp size={24} />
      </button>
    </>
  );
}
