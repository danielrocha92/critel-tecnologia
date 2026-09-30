'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clock, AlertCircle, Bookmark, Tag, User, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { db } from '@/utils/firebase/client';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { assumirChamado } from '@/lib/firebase/ticket-service';
import { Ticket } from '@/types/ticket';
import { useRouter, usePathname } from 'next/navigation';
import styles from './TicketList.module.css';

export type TicketFilter = 'all' | 'my-all' | 'my-opened' | 'my-closed';

export default function TicketList({ filterTitle, filterType, detailPath }: { filterTitle: string, filterType: TicketFilter, detailPath?: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [serverStatusFilter, setServerStatusFilter] = useState<'open' | 'closed' | 'all'>(
    filterType === 'my-closed' ? 'closed' : (filterType === 'all' || filterType === 'my-all') ? 'all' : 'open'
  );
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'pt';

  const [currentUser, setCurrentUser] = useState<any>(null);

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

      // Realtime listener do Firestore
      const ticketsRef = collection(db, 'tickets');
      const q = query(ticketsRef, orderBy('createdAt', 'desc'));
      
      unsubscribeTickets = onSnapshot(q, (snapshot) => {
        const fetchedTickets: Ticket[] = [];
        snapshot.forEach((doc) => {
          fetchedTickets.push({ id: doc.id, ...doc.data() } as Ticket);
        });
        setTickets(fetchedTickets);
        setLoading(false);
      }, (error) => {
        console.error("Erro no onSnapshot do Firebase:", error);
        setLoading(false);
      });
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
      await assumirChamado(ticketId, currentUser.id);
      // O onSnapshot se encarrega de atualizar a UI instantaneamente
    } catch (error) {
      console.error("Erro ao assumir chamado:", error);
      alert("Não foi possível assumir o chamado. Ele pode já ter sido assumido por outro técnico.");
    }
  };

  const filteredTickets = tickets.filter(t => {
    if (departmentFilter && t.department !== departmentFilter) return false;

    // Filtros por usuário
    if (filterType === 'my-opened' || filterType === 'my-all' || filterType === 'my-closed') {
      if (currentUser && t.assigneeId !== currentUser.id && t.requesterId !== currentUser.id) {
        return false;
      }
    }

    const closedStatuses = ['FECHADO', 'RESOLVIDO'];
    
    if (serverStatusFilter === 'open' || filterType === 'my-opened') {
      if (closedStatuses.includes(t.status)) return false;
    } else if (serverStatusFilter === 'closed' || filterType === 'my-closed') {
      if (!closedStatuses.includes(t.status)) return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTerm = (
        (t.title && t.title.toLowerCase().includes(term)) ||
        (t.id && t.id.toLowerCase().includes(term))
      );
      if (!matchTerm) return false;
    }

    return true;
  });

  const getAtendenteNome = (userId: string | null) => {
    if (!userId) return 'Fila';
    const p = perfis.find(p => String(p.user_id) === String(userId));
    return p ? p.nome : 'Alocado';
  };

  const renderBadge = (priority: string) => {
    const p = String(priority).toLowerCase();
    if (p === 'alta' || p === '1' || p === 'urgente') return <span className={styles.priorityHigh}>Alta</span>;
    if (p === 'media' || p === '2' || p === 'normal') return <span className={styles.priorityMedium}>Média</span>;
    if (p === 'baixa' || p === '3' || p === 'low') return <span className={styles.priorityLow}>Baixa</span>;
    return <span className={styles.priorityNormal}>Normal</span>;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{filterTitle}</h1>
        <p className={styles.subtitle}>Quadro Kanban Nativo (Firestore Real-time)</p>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={18} color="#94a3b8" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por ID ou título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {(filterType === 'all' || filterType === 'my-all') && (
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
        <div className={styles.loading}>Sincronizando com Firestore...</div>
      ) : filteredTickets.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum chamado encontrado.
        </div>
      ) : (
        <div className={styles.kanbanBoard}>
          {[
            { id: 'fila', title: 'Fila (Novos)', statuses: ['FILA'] },
            { id: 'andamento', title: 'Em Andamento', statuses: ['EM_ANDAMENTO'] },
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
                      onClick={() => router.push(detailPath ? `/${lang}${detailPath}/${ticket.id}` : `/${lang}/atendimento?ticket_id=${ticket.id}`)}
                      className={styles.ticketCard}
                    >
                      <div className={`${styles.statusIndicator} ${ticket.status === 'FILA' ? styles.statusNovo : ticket.status === 'FECHADO' ? styles.statusFinalizado : styles.statusDefault}`} />

                      <div className={styles.ticketHeader}>
                        <div className={styles.ticketInfo}>
                          <div className={styles.ticketId}>
                            #{ticket.id.substring(0, 6)}
                          </div>
                          <div className={styles.ticketTitle}>
                            {ticket.title}
                          </div>
                        </div>
                        <span className={styles.statusBadge}>
                          {ticket.status}
                        </span>
                      </div>

                      <div className={styles.badgesContainer}>
                        <div className={styles.badgeItem}>
                          <Bookmark size={14} color="#818cf8" />
                          <span>{ticket.department}</span>
                        </div>
                        <div className={styles.badgeItem}>
                          <Tag size={14} color="#f472b6" />
                          <span>{ticket.category}</span>
                        </div>
                      </div>
                      
                      <div className={styles.priorityContainer}>
                        <div className={styles.priorityInfo}>
                          <span className={styles.priorityLabel}>Prior:</span>
                          {renderBadge(ticket.priority)}
                        </div>
                        <div className={styles.assigneeInfo}>
                          <User size={14} color="#94a3b8" />
                          {getAtendenteNome(ticket.assigneeId)}
                        </div>
                      </div>

                      <div className={styles.ticketFooter}>
                        {ticket.status === 'FILA' ? (
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
