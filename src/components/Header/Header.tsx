"use client";
import { useState } from 'react';
import styles from './Header.module.css';
import Link from 'next/link';
import { Globe, Menu, X, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const changeLanguage = (newLang: string) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    segments[1] = newLang; // Replace the language segment
    router.push(segments.join('/') || '/');
    setIsLangMenuOpen(false);
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.logo}>
          <Link href={`/${lang}`}>
            <img src="/400PngdpiLogoCroppedBW.png" alt="Critel Tecnologia" className={styles.logoImage} />
          </Link>
        </div>
        
        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}>
          <ul className={styles.navList}>
            <li><Link href={`/${lang}`} onClick={toggleMobileMenu}>{dict.home}</Link></li>
            <li className={styles.hasDropdown}>
              <span>{dict.about}</span>
              <ul className={styles.dropdown}>
                <li><Link href={`/${lang}/#empresa`} onClick={toggleMobileMenu}>{dict.aboutCritel}</Link></li>
              </ul>
            </li>
            <li className={styles.hasDropdown}>
              <span>{dict.solutions}</span>
              <ul className={styles.dropdown}>
                <li><Link href={`/${lang}/solucoes/seguranca-da-informacao`} onClick={toggleMobileMenu}>{dict.sol_security}</Link></li>
                <li><Link href={`/${lang}/solucoes/ativos-de-rede`} onClick={toggleMobileMenu}>{dict.sol_network}</Link></li>
                <li><Link href={`/${lang}/solucoes/cabeamento-estruturado`} onClick={toggleMobileMenu}>{dict.sol_cabling}</Link></li>
                <li><Link href={`/${lang}/solucoes/tecnologia-predial`} onClick={toggleMobileMenu}>{dict.sol_building}</Link></li>
              </ul>
            </li>
            <li><Link href={`/${lang}/#clientes`} onClick={toggleMobileMenu}>{dict.clients}</Link></li>
            <li><Link href={`/${lang}/#formulario`} onClick={toggleMobileMenu}>{dict.contact}</Link></li>
          </ul>
        </nav>
        
        <div className={styles.actions}>
          {/* Novo Seletor de Idioma baseado na Imagem */}
          <div className={styles.customLangSelector}>
            <Globe size={20} className={styles.globeIcon} />
            <div className={styles.langDropdownContainer}>
              <button 
                className={styles.langBtn} 
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                aria-expanded={isLangMenuOpen}
              >
                {lang.toUpperCase()}
              </button>
              
              {isLangMenuOpen && (
                <ul className={styles.langMenu}>
                  {['pt', 'en', 'es'].map((l) => (
                    <li key={l}>
                      <button 
                        onClick={() => changeLanguage(l)}
                        className={lang === l ? styles.activeLang : ''}
                      >
                        {l.toUpperCase()}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <Link href={`/${lang}/#formulario`} className={styles.btnAction} onClick={toggleMobileMenu}>{dict.talkToUs}</Link>
        </div>
        
        <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu} aria-label="Menu">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
