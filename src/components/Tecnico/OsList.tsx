'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Clock, FileText, CheckCircle, Search, ClipboardList, Activity, Sparkles } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './OsList.module.css';

import ResumoFinanceiro from '@/components/Tecnico/ResumoFinanceiro';
import { getTicketAddress } from '@/utils/tickets/description';
import UnassignedTicketsFeed from '@/components/Tecnico/UnassignedTicketsFeed';
import type { ITicket } from '@/types/ticket';

const supabase = createClient();

export default function OsList({ lang }: { lang: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<ITicket[]>([]);
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

      // A lista pessoal deve conter somente chamados vinculados ao técnico atual.
      let query = supabase
        .from('tickets')
        .select('*')
        .like('protocolo_origem', 'OS-%')
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
        console.error('Erro ao carregar chamados do técnico:', error);
      }
      setTickets(data || []);
      setLoading(false);
    };

    fetchTickets();
  }, [router, dateFilter, clientFilter]);

  if (loading) {
    return <div className={styles.loadingContainer}>Carregando seus serviços...</div>;
  }

  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.toLowerCase();
    const address = getTicketAddress(t);
    return (
      (t.titulo && t.titulo.toLowerCase().includes(term)) ||
      (t.cliente && t.cliente.toLowerCase().includes(term)) ||
      (t.protocolo_origem && t.protocolo_origem.toLowerCase().includes(term)) ||
      address.toLowerCase().includes(term)
    );
  });

  const newTicketsCount = tickets.filter(ticket => ticket.status === 'NOVO').length;
  const inProgressCount = tickets.filter(ticket => ticket.status === 'EM_ANDAMENTO').length;

  return (
    <div className={styles.pageContainer}>
      <header className={styles.dashboardHeader}>
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}><Sparkles size={14} /> Área do técnico</span>
          <h2 className={styles.pageTitle}>Painel de serviços</h2>
          <p className={styles.pageSubtitle}>Acompanhe e organize suas ordens de serviço.</p>
        </div>
        <Link href={`/${lang}/tecnico/historico`} className={styles.historyLink}>
          <ClipboardList size={17} />
          Histórico
        </Link>
      </header>

      <section className={styles.metricsGrid} aria-label="Resumo dos chamados ativos">
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconBlue}`}><ClipboardList size={18} /></span>
          <div>
            <span className={styles.metricLabel}>Chamados ativos</span>
            <strong className={styles.metricValue}>{tickets.length}</strong>
          </div>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconAmber}`}><Sparkles size={18} /></span>
          <div>
            <span className={styles.metricLabel}>Novos</span>
            <strong className={styles.metricValue}>{newTicketsCount}</strong>
          </div>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.metricIconGreen}`}><Activity size={18} /></span>
          <div>
            <span className={styles.metricLabel}>Em andamento</span>
            <strong className={styles.metricValue}>{inProgressCount}</strong>
          </div>
        </article>
      </section>

      {userId && <ResumoFinanceiro userId={userId} />}

      {userId && (
        <UnassignedTicketsFeed
          onAccepted={(ticket) => {
            setTickets((current) => [ticket, ...current.filter((item) => item.id !== ticket.id)]);
          }}
        />
      )}

      <section className={styles.listSection} aria-labelledby="active-tickets-title">
        <div className={styles.sectionHeader}>
          <div>
            <h3 id="active-tickets-title" className={styles.sectionTitle}>Chamados em aberto</h3>
            <p className={styles.sectionSubtitle}>Somente serviços que ainda precisam de atendimento.</p>
          </div>
          <span className={styles.resultCount}>{filteredTickets.length}</span>
        </div>

      <div className={styles.filtersContainer} aria-label="Filtros dos chamados">
        <div className={styles.searchWrapper}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar chamado..."
            aria-label="Buscar chamado por cliente, endereço ou protocolo"
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
            aria-label="Filtrar chamados por cliente"
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
            aria-label="Filtrar chamados pela data de abertura"
          />
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyStateIcon}><CheckCircle size={25} /></span>
          <h3 className={styles.emptyStateTitle}>{tickets.length ? 'Nenhum chamado encontrado' : 'Tudo em dia!'}</h3>
          <p className={styles.emptyStateDesc}>
            {tickets.length
              ? 'Tente ajustar a busca ou os filtros selecionados.'
              : 'Você não tem serviços pendentes no momento.'}
          </p>
          {!tickets.length && (
            <Link href={`/${lang}/tecnico/historico`} className={styles.emptyHistoryLink}>
              Consultar chamados finalizados
            </Link>
          )}
        </div>
      ) : (
        <div className={styles.ticketsList}>
          {filteredTickets.map(ticket => {
            const endereco = getTicketAddress(ticket);
            return (
              <article key={ticket.id} className={styles.ticketCard}>
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketIdentity}>
                    <strong className={styles.ticketClient}>{ticket.cliente}</strong>
                    <span className={styles.ticketProtocol}>OS #{ticket.protocolo_origem}</span>
                  </div>
                  <span className={`${styles.statusBadge} ${ticket.status === 'EM_ANDAMENTO' ? styles.statusInProgress : styles.statusNew}`}>
                    {ticket.status === 'EM_ANDAMENTO' ? 'Em andamento' : ticket.status === 'NOVO' ? 'Novo' : ticket.status}
                  </span>
                </div>
                <h3 className={styles.ticketTitle}>
                  {ticket.titulo}
                </h3>

                <div className={styles.ticketDetails}>
                  <button
                    type="button"
                    onClick={() => handleNavigate(endereco)}
                    disabled={!endereco}
                    className={endereco ? styles.addressLink : styles.addressUnavailable}
                  >
                    <MapPin size={16} className={styles.addressIcon} />
                    <span>{endereco || 'Endereço não informado'}</span>
                  </button>
                  <span className={styles.priorityDetail}>
                    <Clock size={14} /> Prioridade: {ticket.prioridade || 'Normal'}
                  </span>
                </div>

                <Link
                  href={`/${lang}/tecnico/os/?ticket_id=${ticket.id}`}
                  className={styles.actionButton}>
                  <FileText size={18} /> Abrir ordem de serviço
                </Link>
              </article>
            );
          })}
        </div>
      )}
      </section>
    </div>
  );
}
