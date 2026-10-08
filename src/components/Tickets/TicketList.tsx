'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bookmark, Tag, User, Activity, CalendarDays, ChevronRight, Building2 } from 'lucide-react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { ITicket } from '@/types/ticket';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './TicketList.module.css';

export type TicketFilter = 'all' | 'my-all' | 'my-opened' | 'my-closed';
type TicketProfile = { nome: string; user_id: string };

export default function TicketList({ filterTitle, filterType, detailPath, displayMode = 'kanban' }: { filterTitle: string, filterType: TicketFilter, detailPath?: string, displayMode?: 'kanban' | 'list' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [serverStatusFilter, setServerStatusFilter] = useState<'open' | 'closed' | 'all'>(
    filterType === 'my-closed' ? 'closed' : (filterType === 'all' || filterType === 'my-all') ? 'all' : 'open'
  );
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [perfis, setPerfis] = useState<TicketProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'pt';

  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    let unsubscribeTickets: () => void;

    const initialize = async () => {
      setLoading(true);

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch perfis from Supabase (Auth source of truth)
      const { data: perfisData } = await supabase.from('perfis').select('id, nome, user_id');
      if (perfisData) {
        setPerfis(perfisData);
      }

      // Realtime listener do Supabase
      const fetchInitial = async () => {
        const { data } = await supabase.from('tickets').select('*').like('protocolo_origem', 'OS-%').order('criado_em', { ascending: false });
        if (data) setTickets(data as ITicket[]);
        setLoading(false);
      };

      fetchInitial();

      // eslint-disable-next-line react-hooks/exhaustive-deps
      const channel = supabase.channel(`ticketlist_realtime_${Date.now()}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const ticket = payload.new as ITicket;
            if (ticket.protocolo_origem?.toUpperCase().startsWith('OS-')) {
              setTickets(prev => [ticket, ...prev]);
            }
          } else if (payload.eventType === 'UPDATE') {
            const ticket = payload.new as ITicket;
            setTickets(prev => ticket.protocolo_origem?.toUpperCase().startsWith('OS-')
              ? prev.map(item => item.id === ticket.id ? ticket : item)
              : prev.filter(item => item.id !== ticket.id));
          } else if (payload.eventType === 'DELETE') {
            setTickets(prev => prev.filter(t => t.id !== payload.old.id));
          }
        })
        .subscribe();

      unsubscribeTickets = () => supabase.removeChannel(channel);
    };

    initialize();

    return () => {
      if (unsubscribeTickets) unsubscribeTickets();
    };
  }, []);

  const handleAssumir = async (e: React.MouseEvent, ticketId: string) => {
    e.stopPropagation();
    if (!currentUser) return;
    try {
      const supabase = createClient();
      const { error } = await supabase.from('tickets').update({
        tecnico_id: currentUser.id,
        status: 'ABERTO'
      }).eq('id', ticketId).in('status', ['FILA', 'NOVO']);

      if (error) throw error;

      await supabase.from('ticket_transitions').insert({
        ticket_id: ticketId,
        from_status: 'NOVO',
        to_status: 'ABERTO',
        changed_by: currentUser.id,
        reason: 'Técnico assumiu o chamado na fila.'
      });
    } catch (error) {
      console.error("Erro ao assumir chamado:", error);
      alert("Não foi possível assumir o chamado. Ele pode já ter sido assumido por outro técnico.");
    }
  };

  const scopedTickets = tickets.filter(t => {
    // Filtros por usuário
    if (filterType === 'my-opened' || filterType === 'my-all' || filterType === 'my-closed') {
      if (currentUser && t.tecnico_id !== currentUser.id && t.analista_id !== currentUser.id) {
        return false;
      }
    }

    if (searchTerm) {
      const term = searchTerm.trim().toLocaleLowerCase('pt-BR');
      const matchTerm = (
        (t.titulo && t.titulo.toLocaleLowerCase('pt-BR').includes(term)) ||
        (t.id && t.id.toLocaleLowerCase('pt-BR').includes(term)) ||
        (t.cliente && t.cliente.toLocaleLowerCase('pt-BR').includes(term))
      );
      if (!matchTerm) return false;
    }

    return true;
  });

  const closedStatuses = ['FECHADO', 'RESOLVIDO'];
  const isClosed = (status: string) => closedStatuses.includes(status);
  const statusFilter = filterType === 'my-opened' ? 'open' : filterType === 'my-closed' ? 'closed' : serverStatusFilter;
  const filteredTickets = scopedTickets.filter(ticket => {
    if (statusFilter === 'open') return !isClosed(ticket.status);
    if (statusFilter === 'closed') return isClosed(ticket.status);
    return true;
  });
  const openCount = scopedTickets.filter(ticket => !isClosed(ticket.status)).length;
  const closedCount = scopedTickets.filter(ticket => isClosed(ticket.status)).length;

  const getTicketHref = (ticketId: string) => detailPath
    ? `/${lang}${detailPath}/${ticketId}`
    : `/${lang}/os/${ticketId}`;

  const getStatusLabel = (status: string) => ({
    FILA: 'Na fila',
    NOVO: 'Novo',
    ABERTO: 'Em andamento',
    EM_ANDAMENTO: 'Em andamento',
    PENDENTE: 'Pendente',
    RESOLVIDO: 'Resolvido',
    FECHADO: 'Fechado',
  }[status] || status.replaceAll('_', ' '));

  const getStatusClass = (status: string) => isClosed(status)
    ? styles.statusBadgeDone
    : ['FILA', 'NOVO', 'PENDENTE'].includes(status)
      ? styles.statusBadgePending
      : styles.statusBadgeActive;

  const formatCreatedDate = (value: ITicket['criado_em']) => {
    if (!value) return 'Data não informada';
    const date = value instanceof Date ? value : new Date(typeof value === 'number' && value < 1_000_000_000_000 ? value * 1000 : value);
    if (Number.isNaN(date.getTime())) return 'Data não informada';
    return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  };

  const getAtendenteNome = (userId: string | null | undefined) => {
    if (!userId) return 'Fila';
    const p = perfis.find(p => p.user_id === userId);
    return p ? p.nome : 'Alocado';
  };

  const renderBadge = (priority?: string) => {
    const p = String(priority).toLowerCase();
    if (p === 'alta' || p === '1' || p === 'urgente') return <span className={styles.priorityHigh}>Alta</span>;
    if (p === 'media' || p === '2' || p === 'normal') return <span className={styles.priorityMedium}>Média</span>;
    if (p === 'baixa' || p === '3' || p === 'low') return <span className={styles.priorityLow}>Baixa</span>;
    return <span className={styles.priorityNormal}>Normal</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <span className={styles.eyebrow}>GESTÃO OPERACIONAL</span>
          <h1 className={styles.title}>{filterTitle}</h1>
          <p className={styles.subtitle}>{displayMode === 'list' ? 'Acompanhe prioridades, responsáveis e andamento em uma lista clara.' : 'Quadro Kanban nativo atualizado em tempo real.'}</p>
        </div>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={18} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por ID ou título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {displayMode === 'list' && (filterType === 'all' || filterType === 'my-all') ? (
          <div className={styles.listFilters} role="group" aria-label="Filtrar ordens de serviço por status">
            <button type="button" className={serverStatusFilter === 'all' ? styles.listFilterActive : styles.listFilter} onClick={() => setServerStatusFilter('all')} aria-pressed={serverStatusFilter === 'all'}>
              Todas <span>{scopedTickets.length}</span>
            </button>
            <button type="button" className={serverStatusFilter === 'open' ? styles.listFilterActive : styles.listFilter} onClick={() => setServerStatusFilter('open')} aria-pressed={serverStatusFilter === 'open'}>
              Em aberto <span>{openCount}</span>
            </button>
            <button type="button" className={serverStatusFilter === 'closed' ? styles.listFilterActive : styles.listFilter} onClick={() => setServerStatusFilter('closed')} aria-pressed={serverStatusFilter === 'closed'}>
              Concluídas <span>{closedCount}</span>
            </button>
          </div>
        ) : (filterType === 'all' || filterType === 'my-all') && (
          <div className={styles.selectContainer}>
            <select
              value={serverStatusFilter}
              onChange={e => setServerStatusFilter(e.target.value as 'open' | 'closed' | 'all')}
              className={styles.selectInput}
            >
              <option value="open">Somente Abertos</option>
              <option value="closed">Somente Fechados</option>
              <option value="all">Todos os Status</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className={styles.loading}>Sincronizando com Supabase...</div>
      ) : firebaseError ? (
        <div className={styles.emptyState} role="alert">{firebaseError}</div>
      ) : filteredTickets.length === 0 ? (
        <div className={styles.emptyState}>
          {searchTerm ? 'Nenhuma ordem corresponde à busca.' : 'Nenhuma ordem de serviço encontrada.'}
        </div>
      ) : displayMode === 'list' ? (
        <section className={styles.listPanel} aria-label="Ordens de serviço">
          <div className={styles.listPanelHeader}>
            <div><h2>Ordens de serviço</h2><p>{filteredTickets.length} {filteredTickets.length === 1 ? 'registro' : 'registros'} nesta visualização</p></div>
            <span className={styles.liveIndicator}><span /> Atualizado em tempo real</span>
          </div>
          <div className={styles.ticketList}>
            {filteredTickets.map(ticket => {
              const priority = String(ticket.prioridade || '').toLocaleLowerCase('pt-BR');
              const priorityClass = ['alta', '1', 'urgente'].includes(priority)
                ? styles.priorityHigh
                : ['media', 'média', '2'].includes(priority)
                  ? styles.priorityMedium
                  : ['baixa', '3', 'low'].includes(priority)
                    ? styles.priorityLow
                    : styles.priorityNormal;
              const ticketStatusClass = ticket.status === 'FILA' ? styles.rowStatusQueue : isClosed(ticket.status) ? styles.rowStatusClosed : styles.rowStatusOpen;
              return (
                <article className={styles.ticketRow} key={ticket.id}>
                  <Link className={styles.ticketRowMain} href={getTicketHref(ticket.id)}>
                    <div className={`${styles.rowStatusMark} ${ticketStatusClass}`} aria-hidden="true" />
                    <div className={styles.ticketPrimary}>
                      <div className={styles.ticketKicker}><span>{ticket.protocolo_origem || `OS-${String(ticket.id).slice(0, 8)}`}</span><span className={`${styles.statusBadge} ${getStatusClass(ticket.status)}`}>{getStatusLabel(ticket.status)}</span></div>
                      <h3>{ticket.titulo || 'Ordem de serviço sem título'}</h3>
                      <div className={styles.ticketMeta}>
                        <span><Building2 size={14} /> {ticket.cliente || ticket.departamento || 'Cliente não informado'}</span>
                        <span><Bookmark size={14} /> {ticket.categoria || ticket.departamento || 'Sem categoria'}</span>
                        <span><CalendarDays size={14} /> {formatCreatedDate(ticket.criado_em)}</span>
                      </div>
                    </div>
                    <div className={styles.ticketSecondary}>
                      <div className={styles.rowPriority}><span>Prioridade</span><strong className={priorityClass}>{renderBadge(ticket.prioridade)}</strong></div>
                      <div className={styles.rowAssignee}><User size={15} /><span><small>Responsável</small><strong>{getAtendenteNome(ticket.tecnico_id || '')}</strong></span></div>
                    </div>
                    <ChevronRight className={styles.rowArrow} size={19} aria-hidden="true" />
                  </Link>
                  {['FILA', 'NOVO'].includes(String(ticket.status)) && !ticket.tecnico_id && (
                    <button type="button" onClick={(event) => handleAssumir(event, ticket.id)} className={styles.listAssumeButton}>Assumir</button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      ) : (
        <div className={styles.kanbanBoard}>
          {[
            { id: 'fila', title: 'Fila (Novos)', statuses: ['FILA'] },
            { id: 'andamento', title: 'Em Andamento', statuses: ['ABERTO', 'EM_ANDAMENTO'] },
            { id: 'pendente', title: 'Pendentes', statuses: ['PENDENTE'] },
            ...(serverStatusFilter === 'closed' || serverStatusFilter === 'all' ? [{ id: 'finalizado', title: 'Finalizados', statuses: ['RESOLVIDO', 'FECHADO'] }] : [])
          ].map(col => {
            const colTickets = filteredTickets.filter(t => col.statuses.includes(t.status));
            return (
              <section key={col.id} className={styles.kanbanColumn}>
                <div className={styles.kanbanHeader}>
                  <span>{col.title}</span>
                  <span className={styles.kanbanBadge}>{colTickets.length}</span>
                </div>
                <div className={styles.kanbanBody}>
                  {colTickets.map(ticket => (
                    <article
                      key={ticket.id}
                      onClick={() => router.push(detailPath ? `/${lang}${detailPath}/${ticket.id}` : `/${lang}/os/${ticket.id}`)}
                      className={styles.ticketCard}
                    >
                      <div className={`${styles.statusIndicator} ${ticket.status === 'FILA' ? styles.statusNovo : ticket.status === 'FECHADO' ? styles.statusFinalizado : styles.statusDefault}`} />

                      <div className={styles.ticketHeader}>
                        <div className={styles.ticketInfo}>
                          <div className={styles.ticketId}>
                            #{String(ticket.id).substring(0, 6)}
                          </div>
                          <div className={styles.ticketTitle}>
                            {ticket.titulo}
                          </div>
                        </div>
                        <span className={`${styles.statusBadge} ${['FECHADO', 'RESOLVIDO'].includes(ticket.status) ? styles.statusBadgeDone : ['FILA', 'NOVO', 'PENDENTE'].includes(ticket.status) ? styles.statusBadgePending : styles.statusBadgeActive}`}>
                          {ticket.status}
                        </span>
                      </div>

                      <div className={styles.badgesContainer}>
                        <div className={styles.badgeItem}>
                          <Bookmark size={14} />
                          <span>{ticket.departamento}</span>
                        </div>
                        <div className={styles.badgeItem}>
                          <Tag size={14} />
                          <span>{ticket.categoria}</span>
                        </div>
                      </div>

                      <div className={styles.priorityContainer}>
                        <div className={styles.priorityInfo}>
                          <span className={styles.priorityLabel}>Prior:</span>
                          {renderBadge(ticket.prioridade)}
                        </div>
                        <div className={styles.assigneeInfo}>
                          <User size={14} />
                          {getAtendenteNome(ticket.tecnico_id || '')}
                        </div>
                      </div>

                      <div className={styles.ticketFooter}>
                        {['FILA', 'NOVO'].includes(String(ticket.status)) && !ticket.tecnico_id ? (
                          <button
                            onClick={(e) => handleAssumir(e, ticket.id)}
                            className={styles.assumirButton}
                          >
                            Assumir Chamado
                          </button>
                        ) : (
                          <div className={styles.timeInfo}>
                            <Activity size={14} />
                            <span>Ativo</span>
                          </div>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
