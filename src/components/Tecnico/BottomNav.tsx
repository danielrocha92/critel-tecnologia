'use client';

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { Home, ClipboardList, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const params = useParams();
  const lang = params.lang as string;

  const isActive = (path: string) => {
    // pathname includes lang, e.g. /pt/tecnico
    const base = `/${lang}${path}`;
    return pathname === base;
  };

  const navItems = [
    { icon: Home, label: 'Início', path: '/tecnico' },
    { icon: ClipboardList, label: 'Histórico', path: '/tecnico/historico' },
    { icon: User, label: 'Perfil', path: '/tecnico/perfil' }
  ];

  // Don't show bottom nav inside OS details page to maximize screen space
  if (pathname.includes('/os/')) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '65px',
      background: 'rgba(15, 23, 42, 0.95)',
      backdropFilter: 'blur(10px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      zIndex: 40,
      paddingBottom: 'env(safe-area-inset-bottom)' // for iOS
    }}>
      {navItems.map((item) => {
        const active = isActive(item.path);
        const Icon = item.icon;
        
        return (
          <Link
            key={item.path}
            href={`/${lang}${item.path}`}
            style={{
              background: 'transparent',
              border: 'none',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              color: active ? '#00d2ff' : '#64748b',
              width: '100%',
              padding: '8px 0',
              textDecoration: 'none'
            }}
          >
            <div style={{ 
              background: active ? 'rgba(0, 210, 255, 0.1)' : 'transparent',
              padding: '6px 20px',
              borderRadius: '20px',
              transition: 'all 0.2s ease'
            }}>
              <Icon size={22} strokeWidth={active ? 2.5 : 2} />
            </div>
            <span style={{ 
              fontSize: '0.75rem', 
              fontWeight: active ? 600 : 500,
              transition: 'all 0.2s ease'
            }}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
