"use client";
import { useState } from 'react';
import styles from './Header.module.css';
import Link from 'next/link';
import { Globe, Menu, X } from 'lucide-react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.logo}>
          <Link href="/">
            <img src="/400PngdpiLogoCroppedBW.png" alt="Critel Tecnologia" className={styles.logoImage} />
          </Link>
        </div>
        
        <nav className={`${styles.nav} ${isMobileMenuOpen ? styles.mobileNavOpen : ''}`}>
          <ul className={styles.navList}>
            <li><Link href="/" onClick={toggleMobileMenu}>Home</Link></li>
            <li className={styles.hasDropdown}>
              <span>Quem Somos</span>
              <ul className={styles.dropdown}>
                <li><Link href="/#empresa" onClick={toggleMobileMenu}>Sobre a Critel</Link></li>
              </ul>
            </li>
            <li className={styles.hasDropdown}>
              <span>Soluções</span>
              <ul className={styles.dropdown}>
                <li><Link href="/solucoes/seguranca-da-informacao" onClick={toggleMobileMenu}>Segurança da Informação</Link></li>
                <li><Link href="/solucoes/ativos-de-rede" onClick={toggleMobileMenu}>Ativos de Rede</Link></li>
                <li><Link href="/solucoes/cabeamento-estruturado" onClick={toggleMobileMenu}>Cabeamento Estruturado</Link></li>
                <li><Link href="/solucoes/tecnologia-predial" onClick={toggleMobileMenu}>Tecnologia Predial</Link></li>
              </ul>
            </li>
            <li><Link href="/#clientes" onClick={toggleMobileMenu}>Clientes</Link></li>
            <li><Link href="/#formulario" onClick={toggleMobileMenu}>Contato</Link></li>
          </ul>
        </nav>
        
        <div className={styles.actions}>
          <div className={styles.langSelector}>
            <Globe size={18} className={styles.globeIcon} />
            <select aria-label="Seletor de idioma">
              <option value="pt">PT</option>
              <option value="en">EN</option>
              <option value="es">ES</option>
            </select>
          </div>
          <Link href="#contato" className={styles.btnAction} onClick={toggleMobileMenu}>Fale Conosco</Link>
        </div>
        
        <button className={styles.mobileMenuBtn} onClick={toggleMobileMenu} aria-label="Menu">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </header>
  );
}
