'use client';

import { usePathname, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Home, ClipboardList, User } from 'lucide-react';

import styles from './BottomNav.module.css';

export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const lang = params.lang as string;

  const isActive = (path: string) => {
    // pathname includes lang, e.g. /pt/tecnico
    const base = `/${lang}${path}`;
    return pathname === base;
  };

  const searchParams = useSearchParams();
  const ticketId = searchParams.get('ticket_id');

  const navItems = [
    { icon: Home, label: 'Início', path: '/tecnico/os' },
    { icon: ClipboardList, label: 'Histórico', path: '/tecnico/historico' },
    { icon: User, label: 'Perfil', path: '/tecnico/perfil' }
  ];

  // Don't show bottom nav inside OS details page to maximize screen space
  if (pathname.includes('/os') && ticketId) {
    return null;
  }

  return (
    <div className={styles.bottomNavContainer}>
      {navItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.path}
            href={`/${lang}${item.path}`}
            className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
          >
            <div className={`${styles.iconContainer} ${active ? styles.iconContainerActive : ''}`}>
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span className={`${styles.navLabel} ${active ? styles.navLabelActive : ''}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
