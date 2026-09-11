'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, ShieldAlert, LogOut } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function Sidebar({ lang }: { lang: string }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = `/${lang}/login`;
  };

  const navItems = [
    { name: 'Dashboard', href: `/${lang}/dashboard`, icon: LayoutDashboard },
    { name: 'Atendimento', href: `/${lang}/atendimento`, icon: Users },
    { name: 'Painel Admin', href: `/${lang}/admin`, icon: ShieldAlert },
  ];

  return (
    <aside style={{
      width: '250px',
      background: 'rgba(11, 17, 32, 0.6)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.08)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 100
    }}>
      <div style={{ padding: '2rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0052FF' }}>Critel</h2>
        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Intranet Corporativa</span>
      </div>

      <nav style={{ flex: 1, padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {navItems.map(item => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 15px',
                borderRadius: '8px',
                textDecoration: 'none',
                color: isActive ? '#fff' : '#8892b0',
                backgroundColor: isActive ? 'rgba(0, 82, 255, 0.2)' : 'transparent',
                transition: 'all 0.2s',
                borderLeft: isActive ? '4px solid #0052FF' : '4px solid transparent'
              }}
            >
              <Icon size={20} />
              <span style={{ fontWeight: isActive ? 'bold' : 'normal' }}>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <button 
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 15px',
            width: '100%',
            background: 'none',
            border: 'none',
            color: '#dc3545',
            cursor: 'pointer',
            fontWeight: 'bold',
            textAlign: 'left'
          }}
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </aside>
  );
}
