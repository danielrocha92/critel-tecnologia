import styles from './Header.module.css';
import Link from 'next/link';
import { Globe } from 'lucide-react';

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={`container ${styles.container}`}>
        <div className={styles.logo}>
          <Link href="/">Critel<span>Tecnologia</span></Link>
        </div>
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            <li><Link href="#empresa">Empresa</Link></li>
            <li><Link href="#servicos">Serviços</Link></li>
            <li><Link href="#clientes">Clientes</Link></li>
            <li><Link href="#contato">Contato</Link></li>
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
          <Link href="#contato" className={styles.btnAction}>Fale Conosco</Link>
        </div>
      </div>
    </header>
  );
}
