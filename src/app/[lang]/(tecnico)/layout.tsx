import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portal do Técnico | Critel',
  description: 'App para execução de serviços técnicos',
  themeColor: '#0b1120',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'
};

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BottomNav from '@/components/Tecnico/BottomNav';
import styles from './layout.module.css';

export default async function TecnicoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/${lang || 'pt'}/login`);
  }

  const { data: perfilData } = await supabase
    .from('perfis')
    .select('nome, cargo, status')
    .eq('user_id', userData.user.id)
    .single();

  const normalizedCargo = perfilData?.cargo?.trim().toUpperCase().replace('É', 'E');
  const isAdmin = normalizedCargo === 'ADMIN' || normalizedCargo === 'SUPER_ADMIN';
  const isTecnico = normalizedCargo === 'TECNICO';

  if (!perfilData || (!isTecnico && !isAdmin) || perfilData.status !== 'ATIVO') {
    if (perfilData?.status === 'PENDENTE') {
      redirect(`/${lang || 'pt'}/pendente`);
    } else {
      redirect(`/${lang || 'pt'}/login`);
    }
  }

  // Pegar apenas o primeiro nome se houver nome completo
  const primeiroNome = perfilData.nome ? perfilData.nome.split(' ')[0] : 'Técnico';

  return (
    <div className={styles.layoutWrapper}>
      <div className={styles.mobileContainer}>
        {/* Topbar minimalista para mobile */}
      <header className={styles.header}>
        <h1 className={styles.title}>Critel Mobile</h1>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{primeiroNome}</span>
        </div>
      </header>

      {/* Conteúdo rolável */}
      <main className={styles.mainContent}>
        {children}
      </main>

      <BottomNav />
      </div>
    </div>
  );
}
