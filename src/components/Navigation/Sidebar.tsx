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
import styles from './Sidebar.module.css';

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
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) return;
      supabase.from('perfis').select('cargo').eq('user_id', user.id).eq('status', 'ATIVO').single()
        .then(({ data }: any) => { if (data?.cargo) setCargo(data.cargo); });
    });
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "user_cargo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = `/${lang}/login`;
  };

  const navCategories = [
    { 
      name: 'Início', icon: Home, href: `/${lang}/dashboard`, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN']
    },
    {
      name: 'Ambientes Departamentais', icon: Users, hasSubmenu: true, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN'],
      subItems: [
        { label: 'Painel Financeiro', href: `/${lang}/financeiro` },
        { label: 'Painel Comercial', href: `/${lang}/comercial` },
        { label: 'Painel Analista', href: `/${lang}/analista` },
        { label: 'Painel Técnico', href: `/${lang}/tecnico` },
      ],
    },
    {
      name: 'Chamados', icon: Inbox, hasSubmenu: true, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'COMERCIAL'],
      subItems: [
        { label: 'Todos os Chamados', href: `/${lang}/all-tickets` },
        { label: 'Meus Chamados', href: `/${lang}/my-tickets/all` },
        { label: 'Meus Chamados Abertos', href: `/${lang}/my-tickets/opened` },
        { label: 'Meus Chamados Finalizados', href: `/${lang}/my-tickets/closed` },
      ],
    },
    { 
      name: 'Ordens de Serviço', icon: MessageSquare, href: `/${lang}/atendimentos`, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'COMERCIAL']
    },
    {
      name: 'Clientes', icon: Users, hasSubmenu: true, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'COMERCIAL'],
      subItems: [
        { label: 'Todos os Clientes', href: `/${lang}/clientes/lista` },
        { label: 'Novo Cliente',      href: `/${lang}/clientes/lista?novo=true` },
      ],
    },
    {
      name: 'Relatórios', icon: PieChart, hasSubmenu: true, section: 'tools',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'COMERCIAL'],
      subItems: [{ label: 'Acompanhamento CRM', href: `/${lang}/relatorios` }],
    },
    {
      name: 'Base de Conhecimento', icon: GraduationCap, hasSubmenu: true, section: 'tools',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'COMERCIAL', 'FINANCEIRO'],
      subItems: [{ label: 'Treinamento do Sistema', href: `/${lang}/base-conhecimento` }],
    },
    {
      name: 'Administração', icon: Settings, hasSubmenu: true, section: 'admin',
      roles: ['SUPER_ADMIN', 'ADMIN'],
      subItems: [
        { label: 'Configurações de Sistema', href: `/${lang}/admin/configuracoes` },
        { label: 'Gerenciar Usuários',       href: `/${lang}/admin/usuarios` },
        { label: 'Governança de Identidade', href: `/${lang}/admin` },
      ]
    },
    { name: 'Ajuda e Suporte', icon: LifeBuoy, href: `/${lang}/ajuda`, section: 'admin', roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'COMERCIAL', 'FINANCEIRO'] },
  ].filter(cat => !cat.roles || cat.roles.includes(cargo));

  // Agrupa por section para renderizar separadores
  const sectionLabel: Record<string, string> = {
    main:  '',
    tools: 'FERRAMENTAS',
    admin: 'SISTEMA',
  };

  const renderedSections = new Set<string>();

  return (
    <>
      <div className={`${styles.sidebarOverlay} ${isMobileOpen ? styles.mobileOpen : ''}`} onClick={() => setIsMobileOpen(false)} />

      <aside className={`${styles.sidebarAside} ${isCollapsed ? styles.collapsed : ''} ${isMobileOpen ? styles.mobileOpen : ''}`}>

        {/* ── Logo ── */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoArea}>
            <div className={styles.logoIconWrap}>
              <img src="/400PngdpiLogoCropped.png" alt="Critel" />
            </div>
            <div className={styles.logoWordmark}>
              <span className={styles.brandName}>Critel</span>
              <span className={styles.brandSub}>Tecnologia</span>
            </div>
          </div>
          <button className={styles.btnCollapse} onClick={() => setIsCollapsed(!isCollapsed)} title={isCollapsed ? 'Expandir menu' : 'Recolher menu'}>
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* ── Novo Chamado ── */}
        <button className={styles.btnNovoChamado} onClick={() => setIsNovoChamadoModalOpen(true)}>
          <span className={styles.btnNovoIconWrap}>
            <Plus size={16} />
            <span className={styles.btnNovoText}>Novo Chamado</span>
          </span>
          {!isCollapsed && <ChevronDown size={14} className={styles.btnNovoChevron} />}
        </button>

        {/* ── Nav ── */}
        <nav className={styles.sidebarNav}>
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
                {showLabel && <div className={styles.sectionLabel}>{sectionLabel[section]}</div>}

                {cat.href ? (
                  <Link href={cat.href} className={styles.navLink}>
                    <div className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}>
                      <div className={styles.navItemLeft}>
                        <Icon size={17} className={styles.navIcon} />
                        <span className={styles.navLabel}>{cat.name}</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`} onClick={handleToggle}>
                    <div className={styles.navItemLeft}>
                      <Icon size={17} className={styles.navIcon} />
                      <span className={styles.navLabel}>{cat.name}</span>
                    </div>
                    {cat.hasSubmenu && (
                      <ChevronDown size={14} className={`${styles.navChevron} ${isExpanded ? styles.navChevronOpen : ''}`} />
                    )}
                  </div>
                )}

                {isExpanded && cat.subItems && (
                  <ul className={styles.submenuList}>
                    {cat.subItems.map((sub, idx) => {
                      const subActive = pathname === sub.href || pathname.startsWith(sub.href.split('?')[0]);
                      return (
                        <li key={idx} className={styles.submenuItem}>
                          <Link href={sub.href} className={`${styles.submenuLink} ${subActive ? styles.submenuLinkActive : ''}`}>
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
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn} title="Sair do Sistema">
            <LogOut size={16} className={styles.logoutIcon} />
            <span className={styles.logoutLabel}>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {isNovoChamadoModalOpen && (
        <NovoChamadoModal onClose={() => setIsNovoChamadoModalOpen(false)} />
      )}
    </>
  );
}
