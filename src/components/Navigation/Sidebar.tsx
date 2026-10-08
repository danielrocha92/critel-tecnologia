'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import {
  Home, MessageSquare, Users, Settings,
  ChevronDown, ChevronLeft, ChevronRight, LogOut, Plus, Activity
} from 'lucide-react';
import { createClient } from '../../utils/supabase/client';
import styles from './Sidebar.module.css';

type Cargo = 'SUPER_ADMIN' | 'ADMIN' | 'TÉCNICO' | 'TECNICO' | string;
type NavigationSubItem = { label: string; href: string; roles: string[] };
type NavigationItem = {
  name: string;
  icon: LucideIcon;
  href?: string;
  hasSubmenu?: boolean;
  isAction?: boolean;
  section: string;
  roles: string[];
  subItems?: NavigationSubItem[];
};

export default function Sidebar({ lang }: { lang: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed]   = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [cargo, setCargo]               = useState<Cargo | null>(null);

  useEffect(() => {
    const toggleMenu = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-menu', toggleMenu);
    return () => window.removeEventListener('toggle-mobile-menu', toggleMenu);
  }, []);

  useEffect(() => {
    const root = document.querySelector('.layout-root');
    if (root) {
      if (isCollapsed) root.classList.add('sidebar-collapsed');
      else root.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  useEffect(() => {
    let isMounted = true;
    const loadCargo = async () => {
      const supabase = createClient();
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('[Sidebar] Não foi possível identificar o usuário:', userError);
        return;
      }
      if (!user) return;

      const { data, error } = await supabase
        .from('perfis')
        .select('cargo')
        .eq('user_id', user.id)
        .eq('status', 'ATIVO')
        .maybeSingle();

      if (error) {
        console.error('[Sidebar] Não foi possível carregar o cargo do usuário:', error);
        return;
      }
      if (isMounted && data?.cargo) setCargo(data.cargo);
    };

    void loadCargo();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    document.cookie = "user_cargo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.replace(`/${lang}/login`);
    router.refresh();
  };

  const cargoNormalizado = cargo?.trim().toUpperCase().replace('É', 'E') || '';
  const homePath: Record<string, string> = {
    SUPER_ADMIN: 'dashboard',
    ADMIN: 'dashboard',
    FINANCEIRO: 'financeiro',
    COMERCIAL: 'comercial',
    ANALISTA: 'analista',
    TECNICO: 'tecnico/os',
  };
  const defaultHome = homePath[cargoNormalizado] || 'dashboard';

  const allCategories: NavigationItem[] = [
    {
      name: 'Novo Chamado', icon: Plus, href: `/${lang}/analista?novo=1`, section: 'main', isAction: true,
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA']
    },
    {
      name: 'Início', icon: Home, href: `/${lang}/${defaultHome}`, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'COMERCIAL', 'FINANCEIRO']
    },
    {
      name: 'Ambientes Departamentais', icon: Users, hasSubmenu: true, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'COMERCIAL', 'FINANCEIRO'],
      subItems: [
        { label: 'Painel Financeiro', href: `/${lang}/financeiro`, roles: ['SUPER_ADMIN', 'ADMIN', 'FINANCEIRO'] },
        { label: 'Painel Comercial', href: `/${lang}/comercial`, roles: ['SUPER_ADMIN', 'ADMIN', 'COMERCIAL'] },
        { label: 'Painel Analista', href: `/${lang}/analista`, roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA'] },
        { label: 'Painel Técnico', href: `/${lang}/tecnico`, roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'FINANCEIRO'] },
      ],
    },
    {
      name: 'Ordens de Serviço (Técnicos)', icon: MessageSquare, href: `/${lang}/os`, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN', 'TÉCNICO', 'TECNICO', 'ANALISTA']
    },
    {
      name: 'Base de Clientes', icon: Users, href: `/${lang}/clientes/lista`, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA', 'COMERCIAL']
    },
    {
      name: 'Monitoramento Bacio', icon: Activity, href: `/${lang}/monitoramento/bacio`, section: 'main',
      roles: ['SUPER_ADMIN', 'ADMIN', 'ANALISTA']
    },
    {
      name: 'Administração', icon: Settings, hasSubmenu: true, section: 'admin',
      roles: ['SUPER_ADMIN', 'ADMIN'],
      subItems: [
        { label: 'Configurações de Sistema', href: `/${lang}/admin/configuracoes`, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Gerenciar Usuários', href: `/${lang}/admin/usuarios`, roles: ['SUPER_ADMIN', 'ADMIN'] },
        { label: 'Governança de Identidade', href: `/${lang}/admin`, roles: ['SUPER_ADMIN', 'ADMIN'] },
      ]
    },
  ];

  const navCategories = allCategories
    .filter((category) => category.roles.includes(cargoNormalizado))
    .map((category) => ({
      ...category,
      subItems: category.subItems?.filter((item) => item.roles.includes(cargoNormalizado)),
    }));

  // Agrupa por section para renderizar separadores
  const sectionLabel: Record<string, string> = {
    main:  '',
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

        {/* ── Nav ── */}
        <nav className={styles.sidebarNav}>
          {navCategories.map(cat => {
            const Icon = cat.icon;
            const section = cat.section;
            const showLabel = !renderedSections.has(section) && sectionLabel[section];
            if (sectionLabel[section] !== undefined) renderedSections.add(section);

            const isActive = !cat.isAction && cat.href
              ? pathname === cat.href || pathname.startsWith(`${cat.href}/`)
              : cat.subItems?.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)) ?? false;
            const isExpanded = expandedMenu === cat.name;

            const handleToggle = () => {
              if (cat.hasSubmenu) setExpandedMenu(isExpanded ? null : cat.name);
            };

            return (
              <div key={cat.name}>
                {showLabel && <div className={styles.sectionLabel}>{sectionLabel[section]}</div>}

                {cat.href ? (
                  <Link href={cat.href} className={styles.navLink} onClick={() => setIsMobileOpen(false)} title={cat.isAction ? cat.name : undefined}>
                    <div className={`${styles.navItem} ${cat.isAction ? styles.navItemAction : ''} ${isActive ? styles.navItemActive : ''}`}>
                      <div className={styles.navItemLeft}>
                        <Icon size={17} className={styles.navIcon} />
                        <span className={styles.navLabel}>{cat.name}</span>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`${styles.navItem} ${styles.navButton} ${isActive ? styles.navItemActive : ''}`}
                    onClick={handleToggle}
                    aria-expanded={isExpanded}
                  >
                    <div className={styles.navItemLeft}>
                      <Icon size={17} className={styles.navIcon} />
                      <span className={styles.navLabel}>{cat.name}</span>
                    </div>
                    <ChevronDown size={14} className={`${styles.navChevron} ${isExpanded ? styles.navChevronOpen : ''}`} />
                  </button>
                )}

                {isExpanded && cat.subItems && cat.subItems.length > 0 && (
                  <ul className={styles.submenuList}>
                    {cat.subItems.map((sub) => {
                      const subActive = pathname === sub.href || pathname.startsWith(sub.href.split('?')[0]);
                      return (
                        <li key={sub.href} className={styles.submenuItem}>
                          <Link
                            href={sub.href}
                            className={`${styles.submenuLink} ${subActive ? styles.submenuLinkActive : ''}`}
                            onClick={() => setIsMobileOpen(false)}
                          >
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

    </>
  );
}
