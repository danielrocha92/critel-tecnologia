'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NovoChamadoModal from '../Chamados/NovoChamadoModal';
import {
  Home, Inbox, MessageSquare, Users, PieChart,
  GraduationCap, Settings, LifeBuoy,
  ChevronDown, ChevronLeft, ChevronRight, Plus, LogOut
} from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

type Cargo = 'SUPER_ADMIN' | 'ADMIN' | 'TÉCNICO' | 'TECNICO' | string;

export default function Sidebar({ lang }: { lang: string }) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed]   = useState(false);
  const [isNovoChamadoModalOpen, setIsNovoChamadoModalOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [cargo, setCargo]               = useState<Cargo>('TECNICO');

  useEffect(() => {
    const toggleMenu = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-menu', toggleMenu);
    return () => window.removeEventListener('toggle-mobile-menu', toggleMenu);
  }, []);

  useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  useEffect(() => {
    const root = document.querySelector('.layout-root');
    if (root) {
      if (isCollapsed) root.classList.add('sidebar-collapsed');
      else root.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('perfis').select('cargo').eq('user_id', user.id).eq('status', 'ATIVO').single()
        .then(({ data }) => { if (data?.cargo) setCargo(data.cargo); });
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${lang}/login`;
  };

  const navCategories = [
    { name: 'Início',          icon: Home,          href: `/${lang}/dashboard`,   section: 'main' },
    {
      name: 'Chamados', icon: Inbox, hasSubmenu: true, section: 'main',
      subItems: [
        { label: 'Todos os Chamados', href: `/${lang}/atendimento?filter=todos` },
        { label: 'Meus Chamados', href: `/${lang}/atendimento?meus=true` },
        { label: 'Abertos',       href: `/${lang}/atendimento?filter=abertos` },
        { label: 'Finalizados',   href: `/${lang}/atendimento?filter=finalizados` },
        { label: 'Cancelados',    href: `/${lang}/atendimento?filter=cancelados` },
      ],
    },
    { name: 'Ordens de Serviço', icon: MessageSquare, href: `/${lang}/atendimentos`, section: 'main' },
    {
      name: 'Clientes', icon: Users, hasSubmenu: true, section: 'main',
      subItems: [
        { label: 'Todos os Clientes', href: `/${lang}/clientes/lista` },
        { label: 'Novo Cliente',      href: `/${lang}/clientes/lista?novo=true` },
      ],
    },
    {
      name: 'Relatórios', icon: PieChart, hasSubmenu: true, section: 'tools',
      subItems: [{ label: 'Acompanhamento CRM', href: `/${lang}/relatorios` }],
    },
    {
      name: 'Base de Conhecimento', icon: GraduationCap, hasSubmenu: true, section: 'tools',
      subItems: [{ label: 'Treinamento do Sistema', href: `/${lang}/base-conhecimento` }],
    },
    {
      name: 'Administração', icon: Settings, hasSubmenu: true, section: 'admin',
      subItems: [
        { label: 'Configurações de Sistema', href: `/${lang}/admin/configuracoes`, roles: ['SUPER_ADMIN', 'ADMIN', 'TÉCNICO', 'TECNICO'] },
        { label: 'Gerenciar Usuários',       href: `/${lang}/admin/configuracoes#usuarios`, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Governança de Identidade', href: `/${lang}/admin`, roles: ['SUPER_ADMIN'] },
      ].filter(item => item.roles.includes(cargo)),
    },
    { name: 'Ajuda e Suporte', icon: LifeBuoy, href: `/${lang}/ajuda`, section: 'admin' },
  ];

  // Agrupa por section para renderizar separadores
  const sectionLabel: Record<string, string> = {
    main:  '',
    tools: 'FERRAMENTAS',
    admin: 'SISTEMA',
  };

  const renderedSections = new Set<string>();

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

        .sidebar-aside {
          width: 256px;
          background: #12151f;
          border-right: 1px solid rgba(255,255,255,0.05);
          color: #7a8ba0;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          left: 0; top: 0;
          z-index: 100;
          font-family: 'Inter', -apple-system, system-ui, sans-serif;
          overflow-y: auto;
          overflow-x: hidden;
          transition: width 0.25s cubic-bezier(.4,0,.2,1);
        }
        .sidebar-aside::-webkit-scrollbar { width: 3px; }
        .sidebar-aside::-webkit-scrollbar-track { background: transparent; }
        .sidebar-aside::-webkit-scrollbar-thumb { background: #1e2538; border-radius: 99px; }

        /* ── COLLAPSED ── */
        .sidebar-aside.collapsed { width: 68px; }
        .sidebar-aside.collapsed .logo-wordmark,
        .sidebar-aside.collapsed .nav-label,
        .sidebar-aside.collapsed .nav-chevron,
        .sidebar-aside.collapsed .section-label,
        .sidebar-aside.collapsed .submenu-list,
        .sidebar-aside.collapsed .btn-novo-text,
        .sidebar-aside.collapsed .logout-label { display: none; }
        .sidebar-aside.collapsed .btn-novo-chamado { padding: 10px; justify-content: center; }
        .sidebar-aside.collapsed .nav-item { padding: 10px; justify-content: center; }
        .sidebar-aside.collapsed .nav-item .nav-icon { margin: 0; }
        .sidebar-aside.collapsed .sidebar-footer { padding: 12px; }

        /* ── HEADER ── */
        .sidebar-header {
          padding: 20px 14px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.04);
          min-height: 68px;
          position: relative;
        }
        .logo-area { display: flex; align-items: center; gap: 10px; overflow: hidden; }
        .logo-icon-wrap {
          width: 34px; height: 34px; border-radius: 8px;
          background: linear-gradient(135deg, #1e2a3e, #2a3a52);
          border: 1px solid rgba(45,74,107,0.6);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
        }
        .logo-icon-wrap img { width: 28px; height: auto; }
        .logo-wordmark {
          display: flex; flex-direction: column; line-height: 1;
        }
        .logo-wordmark .brand-name {
          font-size: 0.95rem; font-weight: 700; letter-spacing: -0.3px;
          background: linear-gradient(90deg, #c9253a, #e8344a);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .logo-wordmark .brand-sub {
          font-size: 0.62rem; color: #3a4a5e; font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
          margin-top: 1px;
        }

        .btn-collapse {
          position: absolute; right: -11px; top: 50%;
          transform: translateY(-50%);
          width: 22px; height: 22px;
          background: #1a1e2c; border: 1px solid rgba(255,255,255,0.08);
          border-radius: 50%; color: #4a5568;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 10;
          transition: color 0.2s, border-color 0.2s;
        }
        .btn-collapse:hover { color: #e2e8f0; border-color: rgba(255,255,255,0.2); }

        /* ── NEW TICKET BUTTON ── */
        .btn-novo-chamado {
          margin: 12px 14px;
          width: calc(100% - 28px);
          background: linear-gradient(135deg, #8b2cff, #7020cc);
          color: #fff; border: none;
          padding: 10px 14px; border-radius: 8px;
          font-weight: 600; font-size: 0.875rem;
          cursor: pointer;
          display: flex; align-items: center; justify-content: space-between;
          gap: 8px;
          box-shadow: 0 4px 20px rgba(139,44,255,0.25);
          transition: all 0.2s;
          font-family: inherit;
        }
        .btn-novo-chamado:hover {
          background: linear-gradient(135deg, #9d3fff, #8b2cff);
          box-shadow: 0 6px 24px rgba(139,44,255,0.4);
          transform: translateY(-1px);
        }
        .btn-novo-chamado:active { transform: translateY(0); }

        /* ── NAV ── */
        .sidebar-nav { padding: 6px 10px; flex: 1; }

        .section-label {
          padding: 14px 8px 5px;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 1.8px;
          color: #2d3a4e;
          text-transform: uppercase;
          user-select: none;
        }

        .nav-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 10px;
          border-radius: 7px;
          color: #5a6a7e;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.15s;
          user-select: none;
          position: relative;
        }
        .nav-item:hover { background: rgba(255,255,255,0.04); color: #c8d6e5; }
        .nav-item.active {
          background: rgba(139,44,255,0.12);
          color: #d8aaff;
        }
        .nav-item.active::before {
          content: '';
          position: absolute; left: 0; top: 20%; bottom: 20%;
          width: 3px; border-radius: 0 3px 3px 0;
          background: #8b2cff;
        }
        .nav-item-left { display: flex; align-items: center; gap: 12px; }
        .nav-icon { color: inherit; opacity: 0.75; flex-shrink: 0; }
        .nav-item.active .nav-icon { opacity: 1; }
        .nav-chevron { opacity: 0.5; transition: transform 0.2s; }
        .nav-chevron.open { transform: rotate(180deg); }

        /* ── SUBMENU ── */
        .submenu-list { list-style: none; padding: 2px 0 4px 22px; margin: 0; }
        .submenu-item { margin: 1px 0; }
        .submenu-link {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 10px; border-radius: 6px;
          color: #445060; font-size: 0.825rem; font-weight: 500;
          text-decoration: none; transition: all 0.15s;
          position: relative;
        }
        .submenu-link::before {
          content: '';
          width: 4px; height: 4px; border-radius: 50%;
          background: #2d3a4e; flex-shrink: 0;
          transition: background 0.15s;
        }
        .submenu-link:hover { color: #c8d6e5; background: rgba(255,255,255,0.04); }
        .submenu-link:hover::before { background: #8b2cff; }
        .submenu-link.active { color: #c084fc; }
        .submenu-link.active::before { background: #8b2cff; }

        /* ── FOOTER ── */
        .sidebar-footer {
          padding: 12px 14px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .logout-btn {
          width: 100%;
          display: flex; align-items: center; gap: 10px;
          background: transparent;
          border: none; color: #3d4e60;
          padding: 9px 10px; border-radius: 7px;
          font-size: 0.85rem; font-weight: 500;
          cursor: pointer; transition: all 0.15s;
          font-family: inherit;
        }
        .logout-btn:hover { background: rgba(239,68,68,0.08); color: #f87171; }

        /* ── MOBILE ── */
        .sidebar-overlay { display: none; }
        @media (max-width: 768px) {
          .sidebar-aside {
            transform: translateX(-100%);
            transition: transform 0.3s ease, width 0.25s cubic-bezier(.4,0,.2,1);
          }
          .sidebar-aside.mobile-open { transform: translateX(0); }
          .btn-collapse { display: none; }
          .sidebar-overlay {
            display: block;
            position: fixed; inset: 0;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(2px);
            z-index: 99;
            opacity: 0; pointer-events: none;
            transition: opacity 0.3s;
          }
          .sidebar-overlay.mobile-open { opacity: 1; pointer-events: auto; }
        }
      `}} />

      <div className={`sidebar-overlay ${isMobileOpen ? 'mobile-open' : ''}`} onClick={() => setIsMobileOpen(false)} />

      <aside className={`sidebar-aside ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>

        {/* ── Logo ── */}
        <div className="sidebar-header">
          <div className="logo-area">
            <div className="logo-icon-wrap">
              <img src="/400PngdpiLogoCropped.png" alt="Critel" />
            </div>
            <div className="logo-wordmark">
              <span className="brand-name">Critel</span>
              <span className="brand-sub">Tecnologia</span>
            </div>
          </div>
          <button className="btn-collapse" onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}>
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* ── Novo Chamado ── */}
        <button className="btn-novo-chamado" onClick={() => setIsNovoChamadoModalOpen(true)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span className="btn-novo-text">Novo Chamado</span>
          </span>
          {!isCollapsed && <ChevronDown size={14} style={{ opacity: 0.7 }} />}
        </button>

        {/* ── Nav ── */}
        <nav className="sidebar-nav">
          {navCategories.map(cat => {
            const Icon = cat.icon;
            const section = (cat as any).section ?? 'main';
            const showLabel = !renderedSections.has(section) && sectionLabel[section];
            if (sectionLabel[section] !== undefined) renderedSections.add(section);

            const isActive  = cat.href ? pathname.includes(cat.href.split('/').pop()!) : false;
            const isExpanded = expandedMenu === cat.name;

            const handleToggle = () => {
              if (cat.hasSubmenu) setExpandedMenu(isExpanded ? null : cat.name);
            };

            return (
              <div key={cat.name}>
                {showLabel && <div className="section-label">{sectionLabel[section]}</div>}

                {cat.href ? (
                  <Link href={cat.href} style={{ textDecoration: 'none' }}>
                    <div className={`nav-item ${isActive ? 'active' : ''}`}>
                      <div className="nav-item-left">
                        <Icon size={17} className="nav-icon" />
                        <span className="nav-label">{cat.name}</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className={`nav-item ${isActive ? 'active' : ''}`} onClick={handleToggle}>
                    <div className="nav-item-left">
                      <Icon size={17} className="nav-icon" />
                      <span className="nav-label">{cat.name}</span>
                    </div>
                    {cat.hasSubmenu && (
                      <ChevronDown size={14} className={`nav-chevron ${isExpanded ? 'open' : ''}`} />
                    )}
                  </div>
                )}

                {isExpanded && cat.subItems && (
                  <ul className="submenu-list">
                    {cat.subItems.map((sub, idx) => {
                      const subActive = pathname === sub.href || pathname.startsWith(sub.href.split('?')[0]);
                      return (
                        <li key={idx} className="submenu-item">
                          <Link href={sub.href} className={`submenu-link ${subActive ? 'active' : ''}`}>
                            {sub.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        {/* ── Footer / Logout ── */}
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn" title="Sair do Sistema">
            <LogOut size={16} style={{ opacity: 0.7 }} />
            <span className="logout-label">Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {isNovoChamadoModalOpen && (
        <NovoChamadoModal onClose={() => setIsNovoChamadoModalOpen(false)} />
      )}
    </>
  );
}
