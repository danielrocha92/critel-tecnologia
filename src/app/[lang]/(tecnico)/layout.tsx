import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Portal do Técnico | Critel',
  description: 'App para execução de serviços técnicos',
};

export const viewport: Viewport = {
  themeColor: '#f4f6fa',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import BottomNav from '@/components/Tecnico/BottomNav';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { Suspense } from 'react';
import styles from './layout.module.css';

export default async function TecnicoLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    redirect(`/${lang || 'pt'}/login`);
  }

  const { data: perfilData } = await supabase
    .from('perfis')
    .select('nome, cargo, status')
    .eq('user_id', userData.user.id)
    .single();

  const normalizedCargo = perfilData?.cargo
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase();
  const isAdmin = normalizedCargo === 'ADMIN' || normalizedCargo === 'SUPER_ADMIN';
  const isTecnico = normalizedCargo === 'TECNICO';

  const normalizedStatus = perfilData?.status?.trim().toUpperCase();
  if (!perfilData || (!isTecnico && !isAdmin) || normalizedStatus !== 'ATIVO') {
    if (normalizedStatus === 'PENDENTE') {
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
        <p className={styles.title}>Critel Mobile</p>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{primeiroNome}</span>
          <ThemeToggle />
        </div>
      </header>

      {/* Conteúdo rolável */}
      <main className={styles.mainContent}>
        {children}
      </main>

      <Suspense fallback={null}>
        <BottomNav />
      </Suspense>
      </div>
    </div>
  );
}
