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
      <header style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#1a1a1a', margin: 0 }}>Portal de Acessos Critel</h1>
        <p style={{ color: '#666', marginTop: '0.5rem' }}>Acesse seus sistemas com apenas um clique.</p>
      </header>

      {/* Painel de Avisos (RF05) */}
      {comunicados.length > 0 && (
        <section style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid #ffeeba' }}>
          <h2 style={{ fontSize: '1.25rem', marginTop: 0 }}>⚠️ Comunicados Importantes</h2>
          <ul style={{ paddingLeft: '20px', margin: 0 }}>
            {comunicados.map(c => (
              <li key={c.id} style={{ marginBottom: '0.5rem' }}>
                <strong>{c.titulo}</strong>: {c.mensagem}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Grid de Sistemas SSO */}
      <section>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Sistemas Homologados</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
          {['Stoq', 'Milvus', 'Gmail'].map(sistema => (
            <div key={sistema} style={{ 
              border: '1px solid #ddd', 
              borderRadius: '8px', 
              padding: '1.5rem', 
              textAlign: 'center',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            }}>
              <h3 style={{ margin: '0 0 1rem 0' }}>{sistema}</h3>
              <form action={`/api/sso`} method="POST">
                <input type="hidden" name="sistema" value={sistema} />
                <button type="submit" style={{
                  backgroundColor: '#0052FF',
                  color: 'white',
                  border: 'none',
                  padding: '10px 15px',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  width: '100%',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}>
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
