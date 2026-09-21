'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, FileText, CheckCircle, Car } from 'lucide-react';

import ResumoFinanceiro from '@/components/Tecnico/ResumoFinanceiro';

export default function TecnicoDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchTickets = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        router.push('/pt/login');
        return;
      }
      setUserId(userData.user.id);

      const { data: perfilData } = await supabase
        .from('perfis')
        .select('cargo, status')
        .eq('user_id', userData.user.id)
        .single();

      if (!perfilData || perfilData.cargo !== 'TECNICO' || perfilData.status !== 'ATIVO') {
        router.push('/pt/login');
        return;
      }

      // Buscar os chamados atribuídos a esse técnico (Status ABERTO, EM_ANDAMENTO)
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('tecnico_id', userData.user.id)
        .neq('status', 'FINALIZADO')
        .order('criado_em', { ascending: false });
        
      if (error) {
        console.warn('Erro ao buscar tickets por tecnico_id (talvez a coluna ainda não exista):', error);
        // Fallback temporário caso a migration ainda não tenha rodado
        const fallback = await supabase
          .from('tickets')
          .select('*')
          .neq('status', 'FINALIZADO')
          .order('criado_em', { ascending: false });
        setTickets(fallback.data || []);
      } else {
        setTickets(data || []);
      }
      setLoading(false);
    };

    fetchTickets();
  }, [router]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando seus serviços...</div>;
  }

  return (
    <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
      {userId && <ResumoFinanceiro userId={userId} />}
      
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#f8fafc' }}>Meus Serviços pendentes</h2>
      
      {tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Tudo limpo!</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Você não tem nenhum serviço pendente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {tickets.map(ticket => (
            <div key={ticket.id} style={{
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '1rem',
              position: 'relative',
              overflow: 'hidden'
            }}>
              {ticket.status === 'NOVO' && (
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ef4444' }}></div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <strong style={{ color: '#00d2ff', fontSize: '1.1rem' }}>{ticket.cliente}</strong>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>#{ticket.protocolo_origem}</span>
              </div>
              <p style={{ color: '#f8fafc', fontSize: '0.95rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                {ticket.titulo}
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <MapPin size={14} /> Presencial
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <Clock size={14} /> Urgente
                </div>
              </div>

              <Link 
                href={`/pt/tecnico/os/${ticket.id}`}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
                  cursor: 'pointer',
                  textDecoration: 'none'
              }}>
                <FileText size={18} /> Preencher OS e Finalizar
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
