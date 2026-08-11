'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './ScrollReveal.module.css';

interface ScrollRevealProps {
  children?: React.ReactNode;
  animation?: 'fadeInUp' | 'fadeInLeft' | 'fadeInRight' | 'zoomIn';
  delay?: number;
  duration?: number;
  className?: string;
  threshold?: number;
}

export default function ScrollReveal({
  children,
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.6,
  className = '',
  threshold = 0.1,
}: ScrollRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Stop observing once it's visible
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [threshold]);

  const customStyle = {
    transitionDuration: `${duration}s`,
    transitionDelay: `${delay}s`,
  };

  return (
    <div
      ref={ref}
      className={`${styles.revealWrapper} ${styles[animation]} ${isVisible ? styles.visible : ''} ${className}`}
      style={customStyle}
    >
      {children}
    </div>
  );
}
