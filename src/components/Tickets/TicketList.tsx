'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, AlertCircle, Bookmark, Tag, User, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import styles from './TicketList.module.css';

export type TicketFilter = 'all' | 'my-all' | 'my-opened' | 'my-closed';

export default function TicketList({ filterTitle, filterType, excludeTomTicket }: { filterTitle: string, filterType: TicketFilter, excludeTomTicket?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [serverStatusFilter, setServerStatusFilter] = useState<'open' | 'closed' | 'all'>(
    filterType === 'my-closed' ? 'closed' : (filterType === 'all' || filterType === 'my-all') ? 'all' : 'open'
  );
  const [tickets, setTickets] = useState<any[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'pt';

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      let query = supabase.from('tickets').select('*').order('criado_em', { ascending: false });

      if (excludeTomTicket) {
        query = query.like('protocolo_origem', 'OS-%');
      }

      if (user && filterType !== 'all') {
        query = query.or(`tecnico_id.eq.${user.id},analista_id.eq.${user.id}`);
      }

      // Filtro de Status no Servidor (Contorna limite de 1000 linhas)
      if (serverStatusFilter === 'open') {
        query = query.neq('status', 'FECHADO')
                     .neq('status', 'RESOLVIDO')
                     .neq('status', 'CANCELADO')
                     .neq('status', 'CONCLUIDO')
                     .neq('status', 'FINALIZADO');
      } else if (serverStatusFilter === 'closed') {
        query = query.in('status', ['FECHADO', 'RESOLVIDO', 'CANCELADO', 'CONCLUIDO', 'FINALIZADO']);
      }

      const [resTickets, resPerfis] = await Promise.all([
        query,
        supabase.from('perfis').select('id, nome')
      ]);

      if (resTickets.error) {
        console.error('Erro ao buscar chamados:', resTickets.error);
      } else {
        setTickets(resTickets.data || []);
      }
      
      if (!resPerfis.error && resPerfis.data) {
        setPerfis(resPerfis.data);
      }
      
      setLoading(false);

      // Assinar as mudanças em tempo real (Supabase Realtime)
      const channel = supabase
        .channel('tickets-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tickets' },
          (payload: any) => {
            console.log('Alteração recebida via WebSocket:', payload);
            setTickets((currentTickets) => {
              if (payload.eventType === 'INSERT') {
                return [payload.new, ...currentTickets];
              }
              if (payload.eventType === 'UPDATE') {
                return currentTickets.map((t) => t.id === payload.new.id ? payload.new : t);
              }
              if (payload.eventType === 'DELETE') {
                return currentTickets.filter((t) => t.id !== payload.old.id);
              }
              return currentTickets;
            });
          }
        )
        .subscribe();

      // Cleanup
      return () => {
        supabase.removeChannel(channel);
      };
    };

    const cleanup = fetchTickets();
    
    return () => {
      cleanup.then(cleanFn => {
        if (cleanFn) cleanFn();
      });
    };
  }, [excludeTomTicket, filterType, serverStatusFilter]);

  const filteredTickets = tickets.filter(t => {
    // 1. Filtro de Cliente
    if (clientFilter && t.cliente !== clientFilter) return false;

    // 1.5 Filtro de Departamento
    if (departmentFilter && (t.departamento || 'Sem Departamento') !== departmentFilter) return false;

    // 2. Filtros por Status (Abertos / Finalizados)
    const closedStatuses = ['FECHADO', 'RESOLVIDO', 'CANCELADO', 'CONCLUIDO', 'FINALIZADO'];
    if (filterType === 'my-opened') {
      if (closedStatuses.includes(t.status)) return false;
    } else if (filterType === 'my-closed') {
      if (!closedStatuses.includes(t.status)) return false;
    }

    // 4. Termo de Pesquisa
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTerm = (
        (t.titulo && t.titulo.toLowerCase().includes(term)) ||
        (t.cliente && t.cliente.toLowerCase().includes(term)) ||
        (t.protocolo_origem && t.protocolo_origem.toLowerCase().includes(term))
      );
      if (!matchTerm) return false;
    }

    return true;
  });

  const getAtendenteNome = (analista_id: string) => {
    if (!analista_id) return 'Sem Atendente';
    const p = perfis.find(p => String(p.user_id) === String(analista_id));
    return p ? p.nome : 'Alocado';
  };

  const renderBadge = (priority: string) => {
    const p = String(priority).toLowerCase();
    if (p === 'alta' || p === '1' || p === 'urgente') return <span className={styles.priorityHigh}>Alta</span>;
    if (p === 'media' || p === '2' || p === 'normal') return <span className={styles.priorityMedium}>Média</span>;
    if (p === 'baixa' || p === '3' || p === 'low') return <span className={styles.priorityLow}>Baixa</span>;
    return <span className={styles.priorityNormal}>Normal</span>;
  };

  const renderDepartmentTotals = () => {
    if (filterType !== 'all') return null; // Apenas visível em todos os chamados

    // Conta os chamados abertos agrupados por departamento
    const openTickets = tickets.filter(t => t.status !== 'FECHADO' && t.status !== 'RESOLVIDO' && t.status !== 'CANCELADO');
    
    const deptoCounts: Record<string, number> = {};
    openTickets.forEach(t => {
      const depto = t.departamento || 'Sem Departamento';
      deptoCounts[depto] = (deptoCounts[depto] || 0) + 1;
    });

    const sortedDeptos = Object.entries(deptoCounts).sort((a, b) => a[0].localeCompare(b[0]));

    return (
      <div className={styles.deptContainer}>
        <div 
          onClick={() => setIsDepartmentsOpen(!isDepartmentsOpen)} 
          className={styles.deptHeader}
        >
          <div className={styles.deptIcon}>
            {isDepartmentsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <div className={styles.deptTitleContainer}>
            <h3 className={styles.deptTitle}>Total de Chamados Abertos por Departamento</h3>
            <span className={styles.deptSubtitle}>Lista com o total de chamados abertos por departamentos.</span>
          </div>
        </div>
        
        {isDepartmentsOpen && (
          <div className={styles.deptListContainer}>
            {sortedDeptos.length === 0 ? (
               <div className={styles.deptEmpty}>Nenhum chamado aberto.</div>
            ) : (
              <ul className={styles.deptList}>
                {sortedDeptos.map(([depto, count], i) => (
                  <li key={depto} 
                    onClick={() => setDepartmentFilter(departmentFilter === depto ? '' : depto)}
                    className={`${styles.deptItem} ${departmentFilter === depto ? styles.deptItemActive : (i % 2 === 0 ? styles.deptItemInactiveEven : styles.deptItemInactiveOdd)}`}
                  >
                    <span>{depto}</span>
                    <span className={departmentFilter === depto ? styles.deptCountActive : styles.deptCountInactive}>
                      {count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>{filterTitle}</h1>
        <p className={styles.subtitle}>Gerenciamento e acompanhamento de chamados</p>
      </div>

      <div className={styles.filtersContainer}>
        <div className={styles.searchContainer}>
          <Search size={18} color="#94a3b8" className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar por protocolo, cliente ou título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        {/* Filtro de Status (Servidor) - Somente mostrar se não estivermos nas abas travadas */}
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

        <div className={styles.clientSelectContainer}>
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            className={styles.selectInput}
          >
            <option value="">Todos os Clientes</option>
            <option value="Bacio di Latte">Bacio di Latte</option>
            <option value="Ofner">Ofner</option>
            <option value="KFC Brasil">KFC Brasil</option>
            <option value="Burger King">Burger King</option>
            <option value="Pizza Hut">Pizza Hut</option>
          </select>
        </div>
      </div>

      {renderDepartmentTotals()}

      {loading ? (
        <div className={styles.loading}>Carregando chamados...</div>
      ) : filteredTickets.length === 0 ? (
        <div className={styles.emptyState}>
          Nenhum chamado encontrado para este filtro.
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredTickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => router.push(`/${lang}/atendimento?ticket_id=${ticket.id}`)}
              className={styles.ticketCard}
            >
              <div className={`${styles.statusIndicator} ${ticket.status === 'NOVO' ? styles.statusNovo : ticket.status === 'FINALIZADO' ? styles.statusFinalizado : styles.statusDefault}`} />

              {/* Header: ID, Titulo, Status */}
              <div className={styles.ticketHeader}>
                <div className={styles.ticketInfo}>
                  <div className={styles.ticketId}>
                    #{ticket.protocolo_origem || ticket.id.split('-')[0]}
                  </div>
                  <div className={styles.ticketTitle}>
                    {ticket.titulo}
                  </div>
                </div>
                <span className={styles.statusBadge}>
                  {ticket.status}
                </span>
              </div>

              {/* Client & Info Badges */}
              <div className={styles.badgesContainer}>
                <div className={styles.badgeItem}>
                  <MapPin size={14} color="#60a5fa" />
                  <span className={styles.clientText}>{ticket.cliente}</span>
                </div>
                <div className={styles.badgeItem}>
                  <Bookmark size={14} color="#818cf8" />
                  <span>{ticket.departamento || '-'}</span>
                </div>
                <div className={styles.badgeItem}>
                  <Tag size={14} color="#f472b6" />
                  <span>{ticket.categoria || '-'}</span>
                </div>
              </div>
              
              {/* Prioridade e Atendente */}
              <div className={styles.priorityContainer}>
                <div className={styles.priorityInfo}>
                  <span className={styles.priorityLabel}>Prioridade:</span>
                  {renderBadge(ticket.prioridade)}
                </div>
                <div className={styles.assigneeInfo}>
                  <User size={14} color="#94a3b8" />
                  {getAtendenteNome(ticket.analista_id || ticket.tecnico_id)}
                </div>
              </div>

              {/* Footer: Datas */}
              <div className={styles.ticketFooter}>
                <div className={styles.timeInfo}>
                  <Clock size={14} /> 
                  <span>{new Date(ticket.criado_em).toLocaleString()}</span>
                </div>
                <div className={styles.timeInfo}>
                  <Activity size={14} />
                  <span>Atualizado: {ticket.atualizado_em ? new Date(ticket.atualizado_em).toLocaleDateString() : '-'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
