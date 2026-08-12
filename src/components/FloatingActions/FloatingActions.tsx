'use client';

import { useEffect, useState } from 'react';
import styles from './FloatingActions.module.css';
import { ArrowUp, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function FloatingActions({ lang }: { lang?: string }) {
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

  // Default number used in footer
  const whatsappNumber = '5511996839480';
  const whatsappMessage = encodeURIComponent('Olá, gostaria de saber mais sobre as soluções da Critel Tecnologia.');
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <>
      {/* WhatsApp Button - Bottom Left */}
      <Link 
        href={whatsappLink} 
        target="_blank" 
        rel="noopener noreferrer"
        className={`${styles.floatingBtn} ${styles.whatsappBtn}`}
        aria-label="Fale conosco no WhatsApp"
      >
        <MessageCircle size={28} />
      </Link>

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
