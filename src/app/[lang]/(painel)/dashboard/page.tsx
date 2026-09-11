import { Metadata } from 'next';
import { supabaseAdmin } from '@/lib/auditoria';

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
    console.error('Erro ao buscar comunicados', error);
    return [];
  }
  return data || [];
}

export default async function DashboardPage() {
  const comunicados = await getComunicados();

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
      <header style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#f8fafc', margin: 0 }}>Portal de Acessos Critel</h1>
        <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>Acesse seus sistemas com apenas um clique.</p>
      </header>

      {/* Painel de Avisos (RF05) */}
      {comunicados.length > 0 && (
        <section style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>⚠️ Comunicados Importantes</h2>
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
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f8fafc' }}>Sistemas Homologados</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {['Stoq', 'Milvus', 'Gmail'].map(sistema => (
            <div key={sistema} style={{ 
              border: '1px solid rgba(255, 255, 255, 0.08)', 
              borderRadius: '12px', 
              padding: '1.5rem', 
              textAlign: 'center',
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              transition: 'transform 0.2s',
            }}
            onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <h3 style={{ margin: '0 0 1rem 0', color: '#f8fafc' }}>{sistema}</h3>
              <form action={`/api/sso`} method="POST">
                <input type="hidden" name="sistema" value={sistema} />
                <button type="submit" style={{
                  background: 'linear-gradient(135deg, #00d2ff 0%, #0284c7 100%)',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  width: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0, 210, 255, 0.3)'
                }}
                onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 210, 255, 0.5)')}
                onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 210, 255, 0.3)')}
                >
                  Acessar
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
