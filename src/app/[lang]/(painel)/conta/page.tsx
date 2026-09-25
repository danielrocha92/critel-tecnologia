import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { redirect } from 'next/navigation';
import { User, Mail, Briefcase, Shield } from 'lucide-react';
import styles from './conta.module.css';

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
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Minha Conta</h1>
        <p className={styles.subtitle}>Gerencie suas informações de perfil e segurança.</p>
      </header>

      <div className={styles.card}>
        {/* Avatar Area */}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            <User size={50} />
          </div>
          <div>
            <h2 className={styles.userName}>{perfil?.nome || 'Usuário Critel'}</h2>
            <div className={styles.userEmail}>
              <Mail size={16} />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <Briefcase size={18} />
              <span className={styles.infoLabelText}>Cargo / Departamento</span>
            </div>
            <div className={styles.infoValue}>{perfil?.cargo || 'Não definido'}</div>
          </div>

          <div className={styles.infoItem}>
            <div className={styles.infoLabel}>
              <Shield size={18} />
              <span className={styles.infoLabelText}>Nível de Acesso</span>
            </div>
            <div className={styles.infoValue}>
              {perfil?.cargo === 'ADMIN' ? 'Acesso Total (Admin)' : 'Acesso Padrão'}
            </div>
          </div>
        </div>

        {/* Security / Password section placeholder */}
        <div className={styles.actionsSection}>
          <button className={styles.btnAction}>
            Alterar Senha (Em Breve)
          </button>
        </div>
      </div>
    </div>
  );
}
