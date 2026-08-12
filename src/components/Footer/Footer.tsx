'use client';

import { useState, useEffect } from 'react';
import styles from './Footer.module.css';

const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
);

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

export default function Footer({ dict, lang }: { dict: any, lang: string }) {
  const [year, setYear] = useState<number | string>("");

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return (
    <footer className={styles.footer} id="contato">
      <div className={`container ${styles.container}`}>
        <div className={styles.brandInfo}>
          <img src="/400PngdpiLogoCroppedBW.png" alt="Critel Tecnologia" className={styles.logoImage} />
          <p className={styles.address}>
            R. Homero Vaz do Amaral, 35 - Veleiros<br />
            São Paulo - SP, 04774-030
          </p>
          <div className={styles.contact}>
            <p>comercial@criteltecnologia.com.br</p>
            <p>(11) 3136-2592</p>
          </div>
        </div>
        
        <div className={styles.linksBlock}>
          <h4 className={styles.title}>{dict.menuTitle}</h4>
          <ul className={styles.linksList}>
            <li><a href={`/${lang}/#empresa`}>Empresa</a></li>
            <li><a href={`/${lang}/#solucoes`}>Serviços</a></li>
            <li><a href={`/${lang}/#clientes`}>Clientes</a></li>
            <li><a href={`/${lang}/#formulario`}>Contato</a></li>
          </ul>
        </div>
        
        <div className={styles.socialBlock}>
          <h4 className={styles.title}>{dict.socialTitle}</h4>
          <div className={styles.socialLinks}>
            <a href="https://www.linkedin.com/in/critel-tecnologia-3802a2363/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
              <LinkedinIcon />
            </a>
            <a href="https://www.instagram.com/criteltecnologia/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <InstagramIcon />
            </a>
            <a href="https://www.facebook.com/criteltecnologia" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <FacebookIcon />
            </a>
          </div>
        </div>
        
        <div className={styles.lgpdBlock}>
          <div className={styles.lgpdSeal}>
            {dict.lgpdSeal}
          </div>
          <p className={styles.lgpdText}>
            {dict.lgpdText}
          </p>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomBarContent}`}>
          <p>&copy; {year || 2026} {dict.rights}</p>
          <p>{dict.madeBy} <a href="https://rocha-tech-solutions.vercel.app/" target="_blank" rel="noopener noreferrer" className={styles.authorLink}>Rocha Tech Solution</a></p>
        </div>
      </div>
    </footer>
  );
}
