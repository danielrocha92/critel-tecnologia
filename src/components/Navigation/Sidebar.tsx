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
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-aside {
          width: 250px;
          background: rgba(11, 17, 32, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-right: 1px solid rgba(255, 255, 255, 0.08);
          color: #fff;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
        }
        .sidebar-header {
          padding: 2rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          text-align: center;
        }
        .sidebar-nav {
          flex: 1;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 15px;
          border-radius: 8px;
          text-decoration: none;
          color: #8892b0;
          background-color: transparent;
          transition: all 0.2s;
          border-left: 4px solid transparent;
        }
        .nav-item.active {
          color: #fff;
          background-color: rgba(0, 82, 255, 0.2);
          border-left: 4px solid #0052FF;
        }
        .nav-item-text {
          font-weight: normal;
        }
        .nav-item.active .nav-item-text {
          font-weight: bold;
        }
        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 15px;
          width: 100%;
          background: none;
          border: none;
          color: #dc3545;
          cursor: pointer;
          font-weight: bold;
          text-align: left;
        }
        @media (max-width: 768px) {
          .sidebar-aside {
            width: 100%;
            height: 70px;
            flex-direction: row;
            border-right: none;
            border-top: 1px solid rgba(255, 255, 255, 0.08);
            background: rgba(11, 17, 32, 0.9); /* Um pouco mais opaco para leitura */
          }
          .sidebar-header {
            display: none;
          }
          .sidebar-nav {
            flex-direction: row;
            padding: 0;
            gap: 0;
            align-items: center;
            justify-content: space-around;
          }
          .sidebar-footer {
            border-top: none;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 70px; /* Espaço para o botão sair */
          }
          .nav-item {
            flex: 1;
            justify-content: center;
            flex-direction: column;
            gap: 4px;
            padding: 10px 0;
            border-radius: 0;
            border-left: none;
            border-bottom: 4px solid transparent;
          }
          .nav-item.active {
            border-left: none;
            border-bottom: 4px solid #0052FF;
            background-color: rgba(0, 82, 255, 0.1);
          }
          .nav-item-text {
            font-size: 0.65rem;
            display: block;
          }
          .logout-btn {
            justify-content: center;
            padding: 10px;
          }
          .logout-btn-text {
            display: none;
          }
        }
      `}} />
      <aside className="sidebar-aside">
        <div className="sidebar-header">
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0052FF' }}>Critel</h2>
          <span style={{ fontSize: '0.8rem', color: '#aaa' }}>Intranet Corporativa</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(item => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={20} />
                <span className="nav-item-text">{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn" title="Sair">
            <LogOut size={20} />
            <span className="logout-btn-text">Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}
