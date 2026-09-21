'use client';

import { useState, useRef, useEffect } from 'react';
import { User, MessageSquare, ChevronUp, ChevronDown, Pencil, Menu } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import NotificacoesBell from './NotificacoesBell';

export default function Topbar() {
  const params = useParams();
  const lang = params.lang as string;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<{ nome: string; email: string } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await supabase.from('perfis').select('nome').eq('user_id', user.id).single();
        setUserData({
          nome: perfil?.nome || user.email?.split('@')[0] || 'Usuário',
          email: user.email || ''
        });
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = `/${params.lang}/login`;
  };
  return (
    <header className="topbar-header" style={{
      height: '70px',
      background: 'transparent',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button 
          className="mobile-menu-btn" 
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        {/* Espaço para Search bar futuramente se necessário */}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <NotificacoesBell />
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}>
          <MessageSquare size={20} />
        </button>
        
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
              background: isProfileOpen ? 'rgba(255,255,255,0.1)' : 'transparent',
              padding: '4px 8px', borderRadius: '8px', transition: 'background 0.2s'
            }}
          >
            <div style={{
              width: '35px',
              height: '35px',
              borderRadius: '50%',
              background: '#e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94a3b8'
            }}>
              <User size={24} />
            </div>
            {isProfileOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
          </div>

          {isProfileOpen && (
            <div style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '10px',
              width: '280px',
              background: '#1a1d26',
              border: '1px solid #32394c',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #32394c' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                    <User size={30} />
                  </div>
                  <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#fff', borderRadius: '50%', padding: '4px', display: 'flex', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', cursor: 'pointer' }}>
                    <Pencil size={12} color="#000" />
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {userData ? userData.nome : 'Carregando...'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {userData ? userData.email : ''}
                  </div>
                </div>
              </div>

              <div style={{ padding: '8px 0', borderBottom: '1px solid #32394c' }}>
                <Link href={`/${lang}/tecnico/perfil`} className="topbar-dropdown-item" style={{ display: 'block', textDecoration: 'none' }} onClick={() => setIsProfileOpen(false)}>Meus Dados</Link>
                <button className="topbar-dropdown-item">Alterar Senha</button>
                <button className="topbar-dropdown-item">Alterar Foto...</button>
                <div className="topbar-dropdown-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Modo Escuro</span>
                  <div style={{ width: '36px', height: '20px', background: '#3b82f6', borderRadius: '10px', position: 'relative' }}>
                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }}></div>
                  </div>
                </div>
                <button className="topbar-dropdown-item">Exibir Notificações</button>
              </div>

              <div style={{ padding: '8px 0', borderBottom: '1px solid #32394c' }}>
                <div className="topbar-dropdown-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 'bold' }}>Online</span>
                  <div style={{ width: '36px', height: '20px', background: '#3b82f6', borderRadius: '10px', position: 'relative' }}>
                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', right: '2px' }}></div>
                  </div>
                </div>
                <div className="topbar-dropdown-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Modo TV</span>
                  <div style={{ width: '36px', height: '20px', background: '#475569', borderRadius: '10px', position: 'relative' }}>
                    <div style={{ width: '16px', height: '16px', background: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: '2px' }}></div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '8px 0', borderBottom: '1px solid #32394c' }}>
                <button className="topbar-dropdown-item">Contatar Suporte</button>
                <button className="topbar-dropdown-item">Ajuda</button>
              </div>

              <div style={{ padding: '8px 0' }}>
                <button className="topbar-dropdown-item" onClick={handleLogout}>Sair</button>
              </div>
            </div>
          )}
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          .topbar-dropdown-item {
            width: 100%;
            text-align: left;
            background: transparent;
            border: none;
            color: #cbd5e1;
            padding: 10px 16px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
          }
          .topbar-dropdown-item:hover {
            background: rgba(255,255,255,0.05);
            color: #fff;
          }
          .mobile-menu-btn {
            display: none;
            background: transparent;
            border: none;
            color: #cbd5e1;
            cursor: pointer;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          @media (min-width: 769px) {
            .mobile-menu-btn {
              display: none !important;
            }
          }
        `}} />
      </div>
    </header>
  );
}
