'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, FileText, CheckCircle, Car, Search } from 'lucide-react';
import styles from './OsList.module.css';

import ResumoFinanceiro from '@/components/Tecnico/ResumoFinanceiro';

export default function OsList({ lang }: { lang: string }) {
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

      const normalizedCargo = perfilData?.cargo?.trim().toUpperCase().replace('É', 'E');
      const isTecnico = normalizedCargo === 'TECNICO';
      
      if (!perfilData || !isTecnico || perfilData.status !== 'ATIVO') {
        router.push('/pt/login');
        return;
      }

      // Buscar os chamados atribuídos a esse técnico (Status ABERTO, EM_ANDAMENTO)
      let query = supabase
        .from('tickets')
        .select('*')
        .or(`tecnico_id.eq.${userData.user.id},analista_id.eq.${userData.user.id}`)
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
    return <div className={styles.loadingContainer}>Carregando seus serviços...</div>;
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
    <div className={styles.pageContainer}>
      {userId && <ResumoFinanceiro userId={userId} />}
      
      <h2 className={styles.pageTitle}>Meus Serviços pendentes</h2>

      <div className={styles.filtersContainer}>
        <div className={styles.searchWrapper}>
          <Search size={18} color="#94a3b8" className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar chamado..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div>
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className={styles.filterSelect}
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
            className={styles.dateInput}
          />
        </div>
      </div>
      
      {filteredTickets.length === 0 ? (
        <div className={styles.emptyState}>
          <CheckCircle size={48} className={styles.emptyStateIcon} />
          <h3 className={styles.emptyStateTitle}>Tudo limpo!</h3>
          <p className={styles.emptyStateDesc}>Você não tem nenhum serviço pendente.</p>
        </div>
      ) : (
        <div className={styles.ticketsList}>
          {filteredTickets.map(ticket => (
            <div key={ticket.id} className={styles.ticketCard}>
              {ticket.status === 'NOVO' && (
                <div className={styles.newTicketIndicator}></div>
              )}
              <div className={styles.ticketHeader}>
                <strong className={styles.ticketClient}>{ticket.cliente}</strong>
                <span className={styles.ticketProtocol}>#{ticket.protocolo_origem}</span>
              </div>
              <p className={styles.ticketTitle}>
                {ticket.titulo}
              </p>
              
              <div className={styles.ticketDetails}>
                <div 
                  onClick={() => handleNavigate(ticket.endereco)}
                  className={styles.addressLink}
                >
                  <MapPin size={16} className={styles.addressIcon} /> 
                  <span>{ticket.endereco || 'Endereço não informado'}</span>
                </div>
                <div className={styles.priorityDetail}>
                  <Clock size={14} /> {ticket.prioridade || 'Normal'}
                </div>
              </div>

              <Link 
                href={`/${lang}/tecnico/os/?ticket_id=${ticket.id}`}
                className={styles.actionButton}>
                <FileText size={18} /> iniciar/executar chamado
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
