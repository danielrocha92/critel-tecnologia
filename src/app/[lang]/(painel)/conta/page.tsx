import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { User, Mail, Briefcase, Shield } from 'lucide-react';

export default async function ContaPage({
  params,
}: {
  params: any;
}) {
  const resolvedParams = await params;
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${resolvedParams.lang}/login`);
  }

  // Buscar perfil estendido
  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('user_id', user.id)
    .single();

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#f8fafc', margin: 0 }}>Minha Conta</h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Gerencie suas informações de perfil e segurança.</p>
      </header>

      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '2.5rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* Avatar Area */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', flexWrap: 'wrap' }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00d2ff 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 20px rgba(0, 210, 255, 0.4)'
          }}>
            <User size={50} />
          </div>
          <div>
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.75rem', color: '#f8fafc' }}>{perfil?.nome || 'Usuário Critel'}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8' }}>
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', marginBottom: '0.5rem' }}>
              <Briefcase size={18} />
              <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Cargo / Departamento</span>
            </div>
            <div style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: '500' }}>{perfil?.cargo || 'Não definido'}</div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1.5rem', borderRadius: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', marginBottom: '0.5rem' }}>
              <Shield size={18} />
              <span style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Nível de Acesso</span>
            </div>
            <div style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: '500' }}>
              {perfil?.cargo === 'ADMIN' ? 'Acesso Total (Admin)' : 'Acesso Padrão'}
            </div>
          </div>
        </div>

        {/* Security / Password section placeholder */}
        <div style={{ marginTop: '1rem' }}>
          <button style={{
            background: 'transparent',
            color: '#f8fafc',
            border: '1px solid rgba(255,255,255,0.2)',
            padding: '12px 24px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'not-allowed',
            opacity: 0.7
          }}>
            Alterar Senha (Em Breve)
          </button>
        </div>
      </div>
    </div>
  );
}
