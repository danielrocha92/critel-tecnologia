'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, FileText, CheckCircle, Car, Search } from 'lucide-react';

import ResumoFinanceiro from '@/components/Tecnico/ResumoFinanceiro';

export default function TecnicoDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const router = useRouter();

  const handleNavigate = (endereco: string) => {
    if (!endereco || endereco === 'Endereço não informado') return;
    let pref = localStorage.getItem('navAppPref');
    if (!pref) {
      const choice = window.confirm('Deseja usar o Waze? (Clique "OK" para Waze ou "Cancelar" para Google Maps)');
      pref = choice ? 'waze' : 'maps';
      localStorage.setItem('navAppPref', pref);
    }
    const query = encodeURIComponent(endereco);
    if (pref === 'waze') {
      window.open(`https://waze.com/ul?q=${query}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

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

      const isTecnico = perfilData?.cargo === 'TECNICO' || perfilData?.cargo === 'TÉCNICO';
      if (!perfilData || !isTecnico || perfilData.status !== 'ATIVO') {
        router.push('/pt/login');
        return;
      }

      // Buscar os chamados atribuídos a esse técnico (Status ABERTO, EM_ANDAMENTO)
      let query = supabase
        .from('tickets')
        .select('*')
        .eq('tecnico_id', userData.user.id)
        .neq('status', 'FINALIZADO')
        .neq('status', 'CONCLUIDO')
        .order('criado_em', { ascending: false });

      if (clientFilter) {
        query = query.eq('cliente', clientFilter);
      }

      if (dateFilter) {
        const nextDay = new Date(dateFilter);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.gte('criado_em', `${dateFilter}T00:00:00.000Z`)
                     .lt('criado_em', nextDay.toISOString());
      }
        
      const { data, error } = await query;
        
      if (error) {
        console.warn('Erro ao buscar tickets por tecnico_id (talvez a coluna ainda não exista):', error);
        // Fallback temporário caso a migration ainda não tenha rodado
        let fallbackQuery = supabase
          .from('tickets')
          .select('*')
          .neq('status', 'FINALIZADO')
          .order('criado_em', { ascending: false });
          
        if (clientFilter) {
          fallbackQuery = fallbackQuery.eq('cliente', clientFilter);
        }

        if (dateFilter) {
          const nextDay = new Date(dateFilter);
          nextDay.setDate(nextDay.getDate() + 1);
          fallbackQuery = fallbackQuery.gte('criado_em', `${dateFilter}T00:00:00.000Z`)
                                       .lt('criado_em', nextDay.toISOString());
        }
        
        const fallback = await fallbackQuery;
        setTickets(fallback.data || []);
      } else {
        setTickets(data || []);
      }
      setLoading(false);
    };

    fetchTickets();
  }, [router, dateFilter, clientFilter]);

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando seus serviços...</div>;
  }

  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      (t.titulo && t.titulo.toLowerCase().includes(term)) ||
      (t.cliente && t.cliente.toLowerCase().includes(term)) ||
      (t.protocolo_origem && t.protocolo_origem.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ padding: '1rem', paddingBottom: '5rem' }}>
      {userId && <ResumoFinanceiro userId={userId} />}
      
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#f8fafc' }}>Meus Serviços pendentes</h2>

      <div style={{ 
        background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '1.5rem'
      }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar chamado..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff',
              padding: '12px 12px 12px 40px', borderRadius: '8px', outline: 'none'
            }}
          />
        </div>
        <div>
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            style={{ 
              width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8',
              padding: '12px', borderRadius: '8px', outline: 'none', appearance: 'none'
            }}
          >
            <option value="">Todos os Clientes</option>
            <option value="Bacio di Latte">Bacio di Latte</option>
            <option value="Ofner">Ofner</option>
            <option value="KFC Brasil">KFC Brasil</option>
            <option value="Burger King">Burger King</option>
            <option value="Pizza Hut">Pizza Hut</option>
          </select>
        </div>
        <div>
          <input 
            type="date" 
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{ 
              width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8',
              padding: '12px', borderRadius: '8px', outline: 'none'
            }}
          />
        </div>
      </div>
      
      {filteredTickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
          <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
          <h3 style={{ margin: 0, color: '#f8fafc' }}>Tudo limpo!</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Você não tem nenhum serviço pendente.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredTickets.map(ticket => (
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
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '1rem' }}>
                <div 
                  onClick={() => handleNavigate(ticket.endereco)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', color: '#38bdf8', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  <MapPin size={16} style={{ flexShrink: 0, marginTop: '2px' }} /> 
                  <span>{ticket.endereco || 'Endereço não informado'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  <Clock size={14} /> {ticket.prioridade || 'Normal'}
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
                <FileText size={18} /> iniciar/executar chamado
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
