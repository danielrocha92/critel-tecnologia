'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { CheckCircle, Calendar } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function HistoricoPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('tecnico_id', userData.user.id)
        .eq('status', 'FINALIZADO')
        .order('atualizado_em', { ascending: false })
        .limit(20);

      setTickets(data || []);
      setLoading(false);
    };

    fetchHistory();
  }, [supabase]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando histórico...</div>;
  }

  return (
    <div style={{ padding: '1rem', paddingBottom: '6rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#f8fafc' }}>Histórico</h2>
      
      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <Calendar size={48} style={{ color: '#64748b', margin: '0 auto 1rem' }} />
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Nenhum serviço</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Você ainda não finalizou nenhum chamado.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} style={{
              background: 'rgba(30, 41, 59, 0.4)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
              position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#10b981', borderTopLeftRadius: '12px', borderBottomLeftRadius: '12px' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: '#f8fafc', fontSize: '1.1rem' }}>{ticket.cliente}</strong>
                <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <CheckCircle size={14} /> Concluído
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                {ticket.titulo}
              </p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {new Date(ticket.atualizado_em).toLocaleDateString('pt-BR')}
                </span>
                <Link 
                  href={`/${lang}/tecnico/os/${ticket.id}`}
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#00d2ff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                >
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
