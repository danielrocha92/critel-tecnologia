import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/auditoria';
import styles from './dashboard.module.css';
import { ShieldAlert, Server, Boxes, Inbox } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | Intranet Critel',
  description: 'Central Unificada de Acessos',
};

async function getComunicados() {
  const { data, error } = await supabaseAdmin
    .from('comunicados')
    .select('*')
    .eq('ativo', true)
    .order('criado_em', { ascending: false })
    .limit(5);

  if (error) {
    // A tabela 'comunicados' ainda não existe no banco de dados.
    return [];
  }
  return data || [];
}

export default async function DashboardPage() {
  const comunicados = await getComunicados();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Portal de Acessos Critel</h1>
        <p className={styles.subtitle}>Acesse seus sistemas com apenas um clique.</p>
      </header>

      {/* Painel de Avisos (RF05) */}
      {comunicados.length > 0 && (
        <section className={styles.warningSection}>
          <h2 className={styles.warningTitle}>
            <ShieldAlert size={20} /> Comunicados Importantes
          </h2>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            {comunicados.map(c => (
              <li key={c.id} style={{ marginBottom: '0.5rem' }}>
                <strong style={{ color: '#fff' }}>{c.titulo}</strong>: {c.mensagem}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Grid de Sistemas SSO */}
      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#f8fafc', fontWeight: 600 }}>Sistemas Homologados</h2>
        <div className={styles.systemGrid}>
          
          <div className={styles.systemCard}>
            <div className={styles.systemIcon} style={{ background: 'rgba(2, 132, 199, 0.1)', color: '#0ea5e9' }}>
              <Inbox size={32} />
            </div>
            <h3 className={styles.systemTitle}>Stoq</h3>
            <p className={styles.systemDesc}>Gestão de PDVs, Faturamento e Retaguarda.</p>
            <form action="/api/sso" method="POST" style={{ width: '100%' }}>
              <input type="hidden" name="sistema" value="Stoq" />
              <button type="submit" className={styles.accessBtn}>Acessar Plataforma</button>
            </form>
          </div>

          <div className={styles.systemCard}>
            <div className={styles.systemIcon} style={{ background: 'rgba(139, 44, 255, 0.1)', color: '#a855f7' }}>
              <Server size={32} />
            </div>
            <h3 className={styles.systemTitle}>Milvus</h3>
            <p className={styles.systemDesc}>Gestão de Atendimentos e Parque de Máquinas.</p>
            <form action="/api/sso" method="POST" style={{ width: '100%' }}>
              <input type="hidden" name="sistema" value="Milvus" />
              <button type="submit" className={styles.accessBtn}>Acessar Plataforma</button>
            </form>
          </div>

          <div className={styles.systemCard}>
            <div className={styles.systemIcon} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
              <Boxes size={32} />
            </div>
            <h3 className={styles.systemTitle}>Workspace</h3>
            <p className={styles.systemDesc}>Correio Eletrônico Corporativo e Docs.</p>
            <form action="/api/sso" method="POST" style={{ width: '100%' }}>
              <input type="hidden" name="sistema" value="Gmail" />
              <button type="submit" className={styles.accessBtn}>Acessar Plataforma</button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
