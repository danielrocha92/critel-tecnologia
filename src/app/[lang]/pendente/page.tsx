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
          const normalizedCargo = perfilData.cargo
            ?.normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .trim()
            .toUpperCase();
          if (normalizedCargo === 'TECNICO') {
            router.push(`/${lang}/tecnico/os`);
          } else {
            router.push(`/${lang}/dashboard`);
          }
        } else if (perfilData?.status === 'BANIDO') {
          await supabase.auth.signOut();
          router.push(`/${lang}/login`);
        }
      }
    };
    checkStatus();
  }, [router, lang, supabase]);

  return (
    <div className={styles.container}>
      <div className={`${styles.loginBox} ${styles.pendenteBox}`}>
        <div className={styles.logoArea}>
          <div className={`${styles.logoIcon} ${styles.pendenteIcon}`}>
            <Clock size={28} />
          </div>
          <h1 className={styles.title}>Conta em Análise</h1>
          <p className={`${styles.subtitle} ${styles.pendenteSubtitle}`}>
            Seu cadastro foi recebido e está aguardando a aprovação de um analista. O acesso ao Portal do Técnico será liberado após a aprovação.
          </p>
        </div>

        <div className={styles.pendenteBtnWrapper}>
          <button 
            onClick={handleLogout}
            className={`${styles.loginBtn} ${styles.pendenteBtn}`}
          >
            <LogOut size={18} />
            Sair e voltar ao Login
          </button>
        </div>
      </div>
    </div>
  );
}
