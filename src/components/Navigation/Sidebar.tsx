'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import NovoChamadoModal from '../Chamados/NovoChamadoModal';
import { 
  Home, Inbox, UserSquare2, LayoutGrid, MessageSquare, 
  Users, PieChart, Megaphone, GraduationCap, Settings, 
  CreditCard, LifeBuoy, ChevronDown, ChevronLeft, ChevronRight, Plus, X, Search
} from 'lucide-react';
import { useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function Sidebar({ lang }: { lang: string }) {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isNovoChamadoModalOpen, setIsNovoChamadoModalOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const toggleMenu = () => setIsMobileOpen(prev => !prev);
    window.addEventListener('toggle-mobile-menu', toggleMenu);
    return () => window.removeEventListener('toggle-mobile-menu', toggleMenu);
  }, []);

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const root = document.querySelector('.layout-root');
    if (root) {
      if (isCollapsed) root.classList.add('sidebar-collapsed');
      else root.classList.remove('sidebar-collapsed');
    }
  }, [isCollapsed]);

  const handleLogout = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = `/${lang}/login`;
  };

  const navCategories = [
    { name: 'Início', icon: Home, href: `/${lang}/dashboard` },
    { 
      name: 'Chamados', icon: Inbox, hasSubmenu: true, 
      subItems: [
        { label: 'Todos', href: `/${lang}/atendimento` },
        { label: 'Aguardando Atendente', href: `/${lang}/atendimento?filter=aguardando-atendente` },
        { label: 'Aguardando Aprovação', href: `/${lang}/atendimento?filter=aguardando-aprovacao` },
        { label: 'Todos com Deadline Vencido', href: `/${lang}/atendimento?filter=deadline-vencido` },
        { label: 'Abertos com Deadline Vencido', href: `/${lang}/atendimento?filter=abertos-deadline-vencido` },
        { label: 'Abertos com Inicialização Vencida...', href: `/${lang}/atendimento?filter=inicializacao-vencida` },
        { label: 'Inicialização', href: `/${lang}/atendimento?filter=inicializacao` },
        { label: 'Abertos', href: `/${lang}/atendimento?filter=abertos` },
        { label: 'Finalizados', href: `/${lang}/atendimento?filter=finalizados` },
        { label: 'Cancelados', href: `/${lang}/atendimento?filter=cancelados` },
        { label: 'Busca Avançada', href: `/${lang}/atendimento?filter=busca-avancada` }
      ] 
    },
    { 
      name: 'Meus Chamados', icon: UserSquare2, hasSubmenu: true,
      subItems: [
        { label: 'Todos', href: `/${lang}/atendimento?meus=true` },
        { label: 'Não Iniciados', href: `/${lang}/atendimento?meus=true&filter=nao-iniciados` },
        { label: 'Abertos', href: `/${lang}/atendimento?meus=true&filter=abertos` },
        { label: 'Respondidos', href: `/${lang}/atendimento?meus=true&filter=respondidos` },
        { label: 'Finalizados', href: `/${lang}/atendimento?meus=true&filter=finalizados` },
        { label: 'Abertos com Deadline Vencido', href: `/${lang}/atendimento?meus=true&filter=abertos-deadline-vencido` },
        { label: 'Abertos com Inicialização Vencida...', href: `/${lang}/atendimento?meus=true&filter=inicializacao-vencida` },
        { label: 'Inicialização', href: `/${lang}/atendimento?meus=true&filter=inicializacao` }
      ]
    },
    { name: 'Quadros', icon: LayoutGrid, href: `/${lang}/quadros` },
    { name: 'Atendimento', icon: MessageSquare, hasSubmenu: true, href: `/${lang}/atendimento` },
    { 
      name: 'Clientes', icon: Users, hasSubmenu: true,
      subItems: [
        { label: 'Clientes', href: `/${lang}/clientes/lista` },
        { label: 'Organizações', href: `/${lang}/clientes/organizacoes` },
        { label: 'Importar Clientes', href: `/${lang}/clientes/importar` }
      ]
    },
    { 
      name: 'Relatórios', icon: PieChart, hasSubmenu: true,
      subItems: [
        { label: 'Relatórios Básicos', href: `/${lang}/relatorios/basicos` },
        { label: 'Relatórios Personalizados', href: `/${lang}/relatorios/personalizados` },
        { label: 'Gráficos', href: `/${lang}/relatorios/graficos` },
        { label: 'Exportar Dados', href: `/${lang}/relatorios/exportar` }
      ]
    },
    { name: 'Avisos', icon: Megaphone, href: `/${lang}/avisos` },
    { name: 'Base de Conhecimento', icon: GraduationCap, hasSubmenu: true, href: `/${lang}/base-conhecimento` },
    { 
      name: 'Administração', icon: Settings, hasSubmenu: true, href: `/${lang}/admin`,
      subItems: [
        { label: 'Atendentes', href: `/${lang}/admin/atendentes` },
        { label: 'Categorias', href: `/${lang}/admin/categorias` },
        { label: 'Campos Personalizados', href: `/${lang}/admin/campos-personalizados` },
        { label: 'Departamentos', href: `/${lang}/admin/departamentos` },
        { label: 'Respostas Padrões', href: `/${lang}/admin/respostas-padroes` },
        { label: 'SLA', href: `/${lang}/admin/sla` },
        { label: 'Configurações da Conta', href: `/${lang}/admin/config-conta` },
        { label: 'Personalizar Chat', href: `/${lang}/admin/personalizar-chat` },
        { label: 'Rótulos', href: `/${lang}/admin/rotulos` },
        { label: 'Status de Chamado', href: `/${lang}/admin/status-chamado` },
        { label: 'Templates de Email', href: `/${lang}/admin/templates-email` },
        { label: 'Smart Views', href: `/${lang}/admin/smart-views` }
      ]
    },
    { name: 'Planos & Assinatura', icon: CreditCard, hasSubmenu: true, href: `/${lang}/assinatura` },
    { name: 'Ajuda & Suporte', icon: LifeBuoy, hasSubmenu: true, href: `/${lang}/ajuda` }
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .sidebar-aside {
          width: 260px;
          background: #252936;
          border-right: 1px solid #1a1e29;
          color: #8c9bb3;
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
          z-index: 100;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          overflow-y: auto;
          box-shadow: 2px 0 10px rgba(0,0,0,0.2);
        }
        .sidebar-aside::-webkit-scrollbar { width: 4px; }
        .sidebar-aside::-webkit-scrollbar-track { background: transparent; }
        .sidebar-aside::-webkit-scrollbar-thumb { background: #333848; border-radius: 4px; }

        .sidebar-header {
          padding: 24px 16px 16px 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }

        .logo-critel {
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
        }
        .logo-critel img {
          max-width: 140px;
          height: auto;
        }

        .btn-collapse {
          position: absolute;
          right: -12px;
          top: 60px;
          background: #252936;
          border: 1px solid #3f475e;
          color: #8c9bb3;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 10;
          transition: transform 0.3s;
        }

        .sidebar-aside.collapsed {
          width: 70px;
        }

        .sidebar-aside.collapsed .logo-critel img {
          display: none;
        }
        
        .sidebar-aside.collapsed .btn-novo-chamado span,
        .sidebar-aside.collapsed .btn-novo-chamado .btn-novo-icon {
          display: none;
        }
        .sidebar-aside.collapsed .btn-novo-chamado {
          padding: 12px 0;
          justify-content: center;
        }
        
        .sidebar-aside.collapsed .nav-category .nav-text,
        .sidebar-aside.collapsed .nav-category .chevron {
          display: none;
        }
        
        .sidebar-aside.collapsed .icon-wrap {
          justify-content: center;
          width: 100%;
        }

        .sidebar-aside.collapsed .nav-category {
          padding: 12px;
          justify-content: center;
        }
        
        .sidebar-aside.collapsed .submenu-list {
          display: none; /* Hide submenus when collapsed */
        }
        
        .sidebar-aside.collapsed .logout-btn span {
          display: none;
        }

        .btn-novo-chamado {
          width: 100%;
          background: #8b2cff;
          color: #fff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 15px rgba(139, 44, 255, 0.3);
        }
        .btn-novo-chamado:hover {
          background: #7c22e8;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          padding: 0 12px;
          gap: 4px;
          margin-top: 10px;
        }

        .nav-category {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          color: #7b8a9e;
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          border-radius: 8px;
          text-decoration: none;
        }
        .nav-category:hover {
          background: rgba(255,255,255,0.03);
          color: #9cb1c9;
        }
        .nav-category.active {
          color: #fff;
          background: rgba(255,255,255,0.05);
        }
        .nav-category .icon-wrap {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        
        .submenu-list {
          list-style: none;
          padding: 0;
          margin: 0;
          background: #252936;
        }
        
        .submenu-item {
          padding: 10px 16px 10px 48px;
          color: #7b8a9e;
          font-size: 0.85rem;
          cursor: pointer;
          transition: color 0.2s;
        }
        
        .submenu-item:hover {
          color: #fff;
        }

        .sidebar-footer {
          margin-top: auto;
          padding: 16px;
        }
        .logout-btn {
          width: 100%;
          background: transparent;
          color: #64748b;
          border: 1px solid rgba(255,255,255,0.1);
          padding: 10px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
        }

        @media (max-width: 768px) {
          .sidebar-aside {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            width: 260px;
            transform: translateX(-100%);
            transition: transform 0.3s ease;
            z-index: 1000;
          }
          .sidebar-aside.mobile-open {
            transform: translateX(0);
          }
          .btn-collapse {
            display: none;
          }
        }
        .sidebar-overlay {
          display: none;
        }
        @media (max-width: 768px) {
          .sidebar-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 999;
            display: block;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
          }
          .sidebar-overlay.mobile-open {
            opacity: 1;
            pointer-events: auto;
          }
        }
      `}} />
      <div className={`sidebar-overlay ${isMobileOpen ? 'mobile-open' : ''}`} onClick={() => setIsMobileOpen(false)} />
      <aside className={`sidebar-aside ${isCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-critel" style={{ minHeight: '40px' }}>
            {!isCollapsed && <img src="/critel-logo-light.svg" alt="Critel Tecnologia" />}
          </div>
          
          <button className="btn-collapse" onClick={() => setIsCollapsed(!isCollapsed)}>
            {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>

          <button className="btn-novo-chamado" onClick={() => setIsNovoChamadoModalOpen(true)}>
            {isCollapsed ? (
              <Plus size={20} />
            ) : (
              <>
                <span>Novo Chamado</span>
                <ChevronDown size={16} className="btn-novo-icon" />
              </>
            )}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navCategories.map(cat => {
            const Icon = cat.icon;
            const isActive = cat.href ? pathname.includes(cat.href.split('/').pop()!) : false;
            const isExpanded = expandedMenu === cat.name;
            
            const handleToggle = () => {
              if (cat.hasSubmenu && cat.subItems) {
                setExpandedMenu(isExpanded ? null : cat.name);
              }
            };
            
            const content = (
              <div 
                className={`nav-category ${isActive ? 'active' : ''}`}
                onClick={handleToggle}
              >
                <div className="icon-wrap" title={cat.name}>
                  <Icon size={18} opacity={isActive ? 1 : 0.8} />
                  <span className="nav-text">{cat.name}</span>
                </div>
                {cat.hasSubmenu && (
                  <ChevronDown 
                    size={16} 
                    opacity={0.5} 
                    className="chevron"
                    style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} 
                  />
                )}
              </div>
            );

            return (
              <div key={cat.name}>
                {cat.href ? (
                  <Link href={cat.href} style={{ textDecoration: 'none' }}>
                    {content}
                  </Link>
                ) : (
                  content
                )}
                {isExpanded && cat.subItems && (
                  <ul className="submenu-list">
                    {cat.subItems.map((sub, idx) => (
                      <li key={idx} className="submenu-item">
                        <Link href={sub.href} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                          {sub.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn" title="Sair do Sistema">
            {isCollapsed ? <Settings size={18} opacity={0.8} /> : <span>Sair do Sistema</span>}
          </button>
        </div>
      </aside>

      {/* Modal de Novo Chamado */}
      {isNovoChamadoModalOpen && (
        <NovoChamadoModal onClose={() => setIsNovoChamadoModalOpen(false)} />
      )}
    </>
  );
}
