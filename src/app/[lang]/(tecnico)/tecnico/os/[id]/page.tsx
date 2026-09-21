'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, MapPin, Clock, CheckCircle } from 'lucide-react';
import FinalizarChamadoModal from '@/components/Tecnico/FinalizarChamadoModal';

export default function OrdemServicoMobilePage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const ticketId = params.id as string;
  
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchTicket = async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
        
      if (data) setTicket(data);
      setLoading(false);
    };
    fetchTicket();
  }, [ticketId, supabase]);

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados da OS...</div>;
  if (!ticket) return <div style={{ padding: '2rem', textAlign: 'center' }}>OS não encontrada.</div>;

  return (
    <div style={{ paddingBottom: '6rem' }}>
      <header style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#00d2ff', padding: '0.5rem', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#f8fafc' }}>OS #{ticket.protocolo_origem}</h2>
      </header>

      <div style={{ padding: '1.5rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', color: '#00d2ff', marginBottom: '0.5rem' }}>{ticket.cliente}</h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.5' }}>
            {ticket.titulo}
          </p>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Detalhes do Serviço</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Clock size={18} color="#00d2ff" style={{ marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#e2e8f0' }}>Abertura</strong>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{new Date(ticket.criado_em).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <MapPin size={18} color="#00d2ff" style={{ marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#e2e8f0' }}>Departamento</strong>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{ticket.departamento}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Descrição Reportada</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {ticket.descricao}
          </p>
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '1rem',
        background: 'rgba(11, 17, 32, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 50
      }}>
        <button 
          onClick={() => setShowModal(true)}
          style={{
            width: '100%',
            padding: '16px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '1.1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
            cursor: 'pointer'
        }}>
          <CheckCircle size={22} />
          Finalizar Chamado na Loja
        </button>
      </div>

      {showModal && (
        <FinalizarChamadoModal 
          ticket={ticket} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            router.push(`/${lang}/tecnico`);
          }}
        />
      )}
    </div>
  );
}
