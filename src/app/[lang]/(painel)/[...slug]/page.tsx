import { Search, Filter, MoreHorizontal } from 'lucide-react';

export default async function GenericPage({ params }: { params: Promise<{ lang: string; slug: string[] }> }) {
  const { lang, slug } = await params;
  
  // Create a readable title from the slug array (e.g., ['meus-chamados', 'abertos'] -> 'Meus Chamados / Abertos')
  const readableTitle = slug
    .map(s => s.replace(/-/g, ' '))
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' / ');

  return (
    <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#f8fafc', margin: 0 }}>
          {readableTitle}
        </h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button style={{ background: '#32394c', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Filter size={16} /> Filtros
          </button>
          <button style={{ background: '#10b981', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}>
            Novo Registro
          </button>
        </div>
      </div>

      <div style={{ background: '#1a1d26', borderRadius: '8px', border: '1px solid #32394c', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #32394c', display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '10px', color: '#64748b' }} />
            <input 
              type="text" 
              placeholder="Pesquisar registros..." 
              style={{
                width: '100%', background: '#161922', border: '1px solid #32394c', color: '#fff',
                padding: '8px 12px 8px 36px', borderRadius: '6px', outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1e2230', borderBottom: '1px solid #32394c' }}>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 500, fontSize: '0.85rem' }}>ID</th>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 500, fontSize: '0.85rem' }}>Descrição</th>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 500, fontSize: '0.85rem' }}>Data</th>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 500, fontSize: '0.85rem' }}>Status</th>
                <th style={{ padding: '16px', color: '#94a3b8', fontWeight: 500, fontSize: '0.85rem', width: '60px' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <tr key={item} style={{ borderBottom: '1px solid #32394c' }}>
                  <td style={{ padding: '16px', color: '#fff', fontSize: '0.9rem' }}>#{2300 + item}</td>
                  <td style={{ padding: '16px', color: '#e2e8f0', fontSize: '0.9rem' }}>Registro de exemplo gerado dinamicamente ({readableTitle})</td>
                  <td style={{ padding: '16px', color: '#94a3b8', fontSize: '0.9rem' }}>16/09/2026</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Ativo</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div style={{ padding: '16px', borderTop: '1px solid #32394c', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          <div>Mostrando 1 a 7 de 7 registros</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button style={{ background: '#252a38', border: '1px solid #32394c', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Anterior</button>
            <button style={{ background: '#3b82f6', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>1</button>
            <button style={{ background: '#252a38', border: '1px solid #32394c', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}
