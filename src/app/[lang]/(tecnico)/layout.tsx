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
    <div style={{ minHeight: '100vh', background: '#020617', width: '100%' }}>
      <div style={{ 
        minHeight: '100vh', 
        background: '#0b1120', 
        color: '#f8fafc',
        fontFamily: 'Inter, system-ui, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        maxWidth: '600px',
        margin: '0 auto',
        width: '100%',
        position: 'relative',
        boxShadow: '0 0 20px rgba(0,0,0,0.5)'
      }}>
        {/* Topbar minimalista para mobile */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}>
        <h1 style={{ fontSize: '1.2rem', margin: 0, color: '#00d2ff', fontWeight: 'bold' }}>Critel Mobile</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{primeiroNome}</span>
        </div>
      </header>

      {/* Conteúdo rolável */}
      <main style={{ flex: 1, overflowY: 'auto' }}>
        {children}
      </main>

      <BottomNav />
      </div>
    </div>
  );
}
