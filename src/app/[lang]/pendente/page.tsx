'use client';
import { useEffect } from 'react';

import { LogOut, Clock } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import styles from '../login/login.module.css';

export default function PendentePage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}/login`);
  };

  useEffect(() => {
    const checkStatus = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        const { data: perfilData } = await supabase
          .from('perfis')
          .select('cargo, status')
          .eq('user_id', userData.user.id)
          .single();
          
        if (perfilData?.status === 'ATIVO') {
          if (perfilData.cargo === 'TECNICO') {
            router.push(`/${lang}/tecnico`);
          } else {
            router.push(`/${lang}/dashboard`);
          }
        }
      }
    };
    checkStatus();
  }, [router, lang, supabase]);

  return (
    <div className={styles.container}>
      <div className={styles.loginBox} style={{ textAlign: 'center', maxWidth: '450px' }}>
        <div className={styles.logoArea}>
          <div className={styles.logoIcon} style={{ background: '#f59e0b', color: '#fff' }}>
            <Clock size={28} />
          </div>
          <h1 className={styles.title}>Conta em Análise</h1>
          <p className={styles.subtitle} style={{ marginTop: '1rem', color: '#64748b' }}>
            Seu cadastro foi realizado com sucesso, mas a sua conta ainda precisa ser aprovada pelo administrador para acessar o Portal do Técnico.
          </p>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <button 
            onClick={handleLogout}
            className={styles.loginBtn}
            style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', background: '#e2e8f0', color: '#0f172a' }}
          >
            <LogOut size={18} />
            Sair e voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
}
