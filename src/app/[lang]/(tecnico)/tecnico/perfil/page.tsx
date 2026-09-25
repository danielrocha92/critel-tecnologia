'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User, LogOut, Settings, Shield, Bell, Camera, MapPin } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import styles from './perfil.module.css';

export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const [configs, setConfigs] = useState({
    notificacoes: true,
    camera: true,
    localizacao: true
  });

  const toggleConfig = (key: keyof typeof configs) => {
    setConfigs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    document.cookie = "user_cargo=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push(`/${lang}/login`);
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Carregando perfil...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <h2 className={styles.pageTitle}>Meu Perfil</h2>
      
      <div className={styles.profileCard}>
        <div className={styles.avatarWrapper}>
          <User size={40} color="white" />
        </div>
        <h3 className={styles.profileName}>{profile?.nome || 'Técnico'}</h3>
        <p className={styles.profileRole}>
          <Shield size={14} /> {profile?.cargo} - {profile?.status}
        </p>
      </div>

      <div className={styles.settingsSection}>
      <div className={styles.settingsGroup}>
        <h4 className={styles.settingsGroupTitle}>Configurações do Dispositivo</h4>
        <div className={styles.settingsList}>
          {/* Notificações */}
          <div className={`${styles.settingItem} ${styles.settingItemBorder}`}>
            <div className={styles.settingInfo}>
              <div className={styles.iconWrapperNotificacoes}>
                <Bell size={20} color="#3b82f6" />
              </div>
              <div>
                <p className={styles.settingName}>Notificações Push</p>
                <p className={styles.settingDesc}>Novos chamados e alertas</p>
              </div>
            </div>
            <div onClick={() => toggleConfig('notificacoes')} className={`${styles.toggleSwitch} ${configs.notificacoes ? styles.toggleSwitchOn : styles.toggleSwitchOff}`}>
              <div className={`${styles.toggleThumb} ${configs.notificacoes ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
            </div>
          </div>
          
          {/* Câmera */}
          <div className={`${styles.settingItem} ${styles.settingItemBorder}`}>
            <div className={styles.settingInfo}>
              <div className={styles.iconWrapperCamera}>
                <Camera size={20} color="#a855f7" />
              </div>
              <div>
                <p className={styles.settingName}>Acesso à Câmera</p>
                <p className={styles.settingDesc}>Para fotos e anexos</p>
              </div>
            </div>
            <div onClick={() => toggleConfig('camera')} className={`${styles.toggleSwitch} ${configs.camera ? styles.toggleSwitchOn : styles.toggleSwitchOff}`}>
              <div className={`${styles.toggleThumb} ${configs.camera ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
            </div>
          </div>

          {/* Localização */}
          <div className={styles.settingItem}>
            <div className={styles.settingInfo}>
              <div className={styles.iconWrapperLocalizacao}>
                <MapPin size={20} color="#ef4444" />
              </div>
              <div>
                <p className={styles.settingName}>Localização (GPS)</p>
                <p className={styles.settingDesc}>Auditoria no check-in</p>
              </div>
            </div>
            <div onClick={() => toggleConfig('localizacao')} className={`${styles.toggleSwitch} ${configs.localizacao ? styles.toggleSwitchOn : styles.toggleSwitchOff}`}>
              <div className={`${styles.toggleThumb} ${configs.localizacao ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
            </div>
          </div>
        </div>
      </div>

        <button 
          onClick={handleLogout}
          className={styles.btnLogout}
        >
          <LogOut size={20} />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
