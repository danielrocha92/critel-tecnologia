"use client";
import { useState } from 'react';
import styles from './Header.module.css';
import Link from 'next/link';
import { Globe, Menu, X, ChevronDown } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import ThemeToggle from '../ThemeToggle/ThemeToggle';

export default function Header({ dict, lang }: { dict: any, lang: string }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileSolutionsOpen, setIsMobileSolutionsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const changeLanguage = (newLang: string) => {
    if (!pathname) return;
    const segments = pathname.split('/');
    segments[1] = newLang; // Replace the language segment
    router.push(segments.join('/') || '/');
    setIsLangMenuOpen(false);
    closeMobileMenu();
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.logo}>
          <Link href={`/${lang}`} onClick={closeMobileMenu}>
            <img src="/400PngdpiLogoCropped.png" alt="Critel Tecnologia" className={styles.logoImage} />
          </Link>
        </div>
        
        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}>
          <ul className={styles.navList}>
            <li>
              <Link href={`/${lang}`} onClick={closeMobileMenu}>{dict.home}</Link>
            </li>
            <li className={styles.hasDropdown}>
              <Link href={`/${lang}/sobre`} onClick={closeMobileMenu}>{dict.about}</Link>
            </li>
            <li className={`${styles.hasDropdown} ${isMobileSolutionsOpen ? styles.mobileDropdownOpen : ''}`}>
              <div 
                className={styles.dropdownToggle}
                onClick={() => setIsMobileSolutionsOpen(!isMobileSolutionsOpen)}
              >
                <span>{dict.solutions}</span>
                <ChevronDown size={16} className={styles.dropdownArrow} />
              </div>
              <ul className={styles.dropdown}>
                <li><Link href={`/${lang}/solucoes/suporte-ti-empresarial`} onClick={closeMobileMenu}>Suporte de TI Empresarial</Link></li>
                <li><Link href={`/${lang}/solucoes/cabeamento-estruturado`} onClick={closeMobileMenu}>{dict.sol_cabling}</Link></li>
                <li><Link href={`/${lang}/solucoes/ativos-de-rede`} onClick={closeMobileMenu}>{dict.sol_network}</Link></li>
                <li><Link href={`/${lang}/solucoes/seguranca-da-informacao`} onClick={closeMobileMenu}>{dict.sol_security}</Link></li>
                <li><Link href={`/${lang}/solucoes/tecnologia-predial`} onClick={closeMobileMenu}>{dict.sol_building}</Link></li>
                <li><Link href={`/${lang}/solucoes/field-services`} onClick={closeMobileMenu}>Field Services & Lojas</Link></li>
              </ul>
            </li>
            <li><Link href={`/${lang}/clientes`} onClick={closeMobileMenu}>{dict.clients}</Link></li>
            <li><Link href={`/${lang}/contato`} onClick={closeMobileMenu}>{dict.contact}</Link></li>
          </ul>

          {/* Ações adicionais no menu mobile */}
          <div className={styles.mobileActions}>
            <div className={styles.mobileThemeRow}>
              <span className={styles.mobileActionLabel}>Tema:</span>
              <ThemeToggle />
            </div>

            <div className={styles.mobileLangSelector}>
              <div className={styles.mobileLangHeader}>
                <Globe size={18} />
                <span>Idioma:</span>
              </div>
              <div className={styles.langPills}>
                {['pt', 'en', 'es'].map((l) => (
                  <button 
                    key={l}
                    onClick={() => changeLanguage(l)}
                    className={lang === l ? styles.activeLangPill : styles.langPill}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <Link href={`/${lang}/#formulario`} className={styles.mobileBtnAction} onClick={closeMobileMenu}>
              {dict.talkToUs}
            </Link>
          </div>
        </nav>
        
        <div className={styles.actions}>
          {/* Seletor de Tema Desktop */}
          <ThemeToggle />

          {/* Seletor de Idioma Desktop */}
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
          <Link href={`/${lang}/#formulario`} className={styles.btnAction}>{dict.talkToUs}</Link>
        </div>
        
        <button 
          className={styles.mobileMenuBtn} 
          onClick={toggleMobileMenu} 
          aria-label="Abrir Menu de Navegação"
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>
    </header>
  );
}
