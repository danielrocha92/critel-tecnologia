'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, User } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '../../utils/supabase/client';
import NotificacoesBell from './NotificacoesBell';
import styles from './Topbar.module.css';

type UserData = { nome: string; email: string };

export default function Topbar() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang as string;
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        console.error('[Topbar] Não foi possível carregar o usuário:', authError);
        return;
      }
      if (!user) return;

      const { data: profile, error: profileError } = await supabase
        .from('perfis')
        .select('nome')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('[Topbar] Não foi possível carregar o perfil:', profileError);
      }

      if (isMounted) {
        setUserData({
          nome: profile?.nome || user.email?.split('@')[0] || 'Usuário',
          email: user.email || '',
        });
      }
    };

    void fetchUser();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[Topbar] Não foi possível encerrar a sessão:', error);
      return;
    }
    document.cookie = 'user_cargo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    router.push(`/${lang}/login`);
  };

  return (
    <header className={styles.topbarHeader}>
      <div className={styles.leftSection}>
        <button
          type="button"
          className={styles.mobileMenuBtn}
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-menu'))}
          aria-label="Abrir menu de navegação"
        >
          <Menu size={22} />
        </button>
        <span className={styles.productLabel}>Critel Core</span>
      </div>

      <div className={styles.rightSection}>
        <NotificacoesBell />

        <div ref={dropdownRef} className={styles.profileContainer}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((open) => !open)}
            className={`${styles.profileTrigger} ${isProfileOpen ? styles.profileTriggerOpen : ''}`}
            aria-label="Abrir menu da conta"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
          >
            <span className={styles.profileAvatar}><User size={19} /></span>
            <span className={styles.profileName}>{userData?.nome || 'Minha conta'}</span>
            <ChevronDown size={15} className={isProfileOpen ? styles.chevronOpen : ''} />
          </button>

          {isProfileOpen && (
            <div className={styles.dropdownMenu} role="menu">
              <div className={styles.userInfo}>
                <strong>{userData?.nome || 'Usuário Critel'}</strong>
                <span>{userData?.email || 'Sessão ativa'}</span>
              </div>
              <Link
                href={`/${lang}/conta`}
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setIsProfileOpen(false)}
              >
                Minha conta
              </Link>
              <Link
                href={`/${lang}/atendimento`}
                className={styles.dropdownItem}
                role="menuitem"
                onClick={() => setIsProfileOpen(false)}
              >
                Central de atendimento
              </Link>
              <button type="button" className={styles.logoutButton} role="menuitem" onClick={handleLogout}>
                Sair do sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
