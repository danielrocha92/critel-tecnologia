'use client';

import { useState, useRef, useEffect } from 'react';
import { User, MessageSquare, ChevronUp, ChevronDown, Pencil, Menu } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import NotificacoesBell from './NotificacoesBell';
import styles from './Topbar.module.css';

export default function Topbar() {
  const params = useParams();
  const lang = params.lang as string;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<{ nome: string; email: string } | null>(null);
  
  // States for toggles
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isTvMode, setIsTvMode] = useState(false);

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
    document.cookie = "user_cargo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = `/${params.lang}/login`;
  };
  
  return (
    <header className={styles.topbarHeader}>
      <div className={styles.leftSection}>
        <button 
          className={styles.mobileMenuBtn} 
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
      </div>

      <div className={styles.rightSection}>
        <NotificacoesBell />
        <button className={styles.iconButton}>
          <MessageSquare size={20} />
        </button>
        
        <div ref={dropdownRef} className={styles.profileContainer}>
          <div 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className={`${styles.profileTrigger} ${isProfileOpen ? styles.profileTriggerOpen : ''}`}
          >
            <div className={styles.profileAvatar}>
              <User size={24} />
            </div>
            {isProfileOpen ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
          </div>

          {isProfileOpen && (
            <div className={styles.dropdownMenu}>
              <div className={styles.userInfoHeader}>
                <div className={styles.userInfoAvatarWrapper}>
                  <div className={styles.userInfoAvatar}>
                    <User size={30} />
                  </div>
                  <div className={styles.userInfoEdit}>
                    <Pencil size={12} color="#000" />
                  </div>
                </div>
                <div className={styles.userInfoText}>
                  <div className={styles.userInfoName}>
                    {userData ? userData.nome : 'Carregando...'}
                  </div>
                  <div className={styles.userInfoEmail}>
                    {userData ? userData.email : ''}
                  </div>
                </div>
              </div>

              <div className={styles.dropdownGroup}>
                <Link href={`/${lang}/tecnico/perfil`} className={styles.dropdownItem} onClick={() => setIsProfileOpen(false)}>Meus Dados</Link>
                <button className={styles.dropdownItem}>Alterar Senha</button>
                <button className={styles.dropdownItem}>Alterar Foto...</button>
                <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setIsDarkMode(!isDarkMode); }}>
                  <span>Modo Escuro</span>
                  <div className={`${styles.toggleSwitch} ${isDarkMode ? styles.toggleSwitchOn : styles.toggleSwitchOff}`}>
                    <div className={`${styles.toggleThumb} ${isDarkMode ? styles.toggleThumbOn : styles.toggleThumbOff}`}></div>
                  </div>
                </div>
                <button className={styles.dropdownItem}>Exibir Notificações</button>
              </div>

              <div className={styles.dropdownGroup}>
                <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setIsOnline(!isOnline); }}>
                  <span className={isOnline ? styles.boldText : styles.normalText}>Online</span>
                  <div className={`${styles.toggleSwitch} ${isOnline ? styles.toggleSwitchOn : styles.toggleSwitchOff}`}>
                    <div className={`${styles.toggleThumb} ${isOnline ? styles.toggleThumbOn : styles.toggleThumbOff}`}></div>
                  </div>
                </div>
                <div className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); setIsTvMode(!isTvMode); }}>
                  <span className={isTvMode ? styles.boldText : styles.normalText}>Modo TV</span>
                  <div className={`${styles.toggleSwitch} ${isTvMode ? styles.toggleSwitchOn : styles.toggleSwitchOff}`}>
                    <div className={`${styles.toggleThumb} ${isTvMode ? styles.toggleThumbOn : styles.toggleThumbOff}`}></div>
                  </div>
                </div>
              </div>

              <div className={styles.dropdownGroup}>
                <button className={styles.dropdownItem}>Contatar Suporte</button>
                <button className={styles.dropdownItem}>Ajuda</button>
              </div>

              <div className={styles.dropdownGroup}>
                <button className={styles.dropdownItem} onClick={handleLogout}>Sair</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
