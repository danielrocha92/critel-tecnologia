import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Search, Eye, Filter } from 'lucide-react';
import { SkeletonRow } from './SkeletonTicket';
import styles from '../../app/[lang]/(painel)/atendimento/atendimento.module.css';
import { ITicket, IPerfil } from '../../types/ticket';

interface DashboardTicketsProps {
  tickets: ITicket[];
  perfis: IPerfil[];
  operadorAtual: IPerfil | null;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilter?: string;
  isMeus?: boolean;
  onSelectTicket: (ticket: ITicket) => void;
  loading?: boolean;
}

export function DashboardTickets({ tickets, perfis, operadorAtual, searchTerm, setSearchTerm, activeFilter = 'todos', isMeus = false, onSelectTicket, loading }: DashboardTicketsProps) {
  const [openSections, setOpenSections] = useState({
    reminder: true,
    escalated: true,
    new: true,
    my: true,
    departments: true
  });

  // Limite de itens por seção
  const [limits, setLimits] = useState<Record<string, number>>({
    escalated: 50,
    new: 50,
    my: 50
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const loadMore = (section: string) => {
    setLimits(prev => ({ ...prev, [section]: (prev[section] || 50) + 50 }));
  };

  const renderBadge = (priority: string) => {
    const p = String(priority).toLowerCase();
    if (p === 'alta' || p === '1' || p === 'urgente') return <span className={styles.badgePrioHigh}>Alta</span>;
    if (p === 'media' || p === '2' || p === 'normal') return <span className={styles.badgePrioMedium}>Média</span>;
    if (p === 'baixa' || p === '3' || p === 'low') return <span className={styles.badgePrioLow}>Baixa</span>;
    return <span className={styles.badgePrioLow}>Normal</span>;
  };

  const searchedTickets = tickets.filter(t => {
    const termo = searchTerm.toLowerCase();
    if (!termo) return true;
    return (
      String(t.titulo || '').toLowerCase().includes(termo) ||
      String(t.cliente || '').toLowerCase().includes(termo) ||
      String(t.protocolo_origem || '').toLowerCase().includes(termo)
    );
  });

  let filteredTickets = searchedTickets;

  if (isMeus && operadorAtual) {
    filteredTickets = filteredTickets.filter(t => String(t.analista_id) === String(operadorAtual.user_id) || String(t.tecnico_id) === String(operadorAtual.user_id));
  } else if (isMeus && !operadorAtual) {
    // Prevent showing all tickets before operator is loaded
    filteredTickets = [];
  }

  if (activeFilter === 'abertos') {
    filteredTickets = filteredTickets.filter(t => t.status !== 'FECHADO' && t.status !== 'RESOLVIDO' && t.status !== 'CANCELADO');
  } else if (activeFilter === 'finalizados') {
    filteredTickets = filteredTickets.filter(t => t.status === 'FECHADO' || t.status === 'RESOLVIDO');
  } else if (activeFilter === 'cancelados') {
    filteredTickets = filteredTickets.filter(t => t.status === 'CANCELADO');
  }

  let title = 'Chamados';
  if (isMeus) {
    if (activeFilter === 'todos') title = 'Meus Chamados (Todos)';
    else if (activeFilter === 'abertos') title = 'Meus Chamados (Abertos)';
    else if (activeFilter === 'finalizados') title = 'Meus Chamados (Finalizados)';
  } else {
    if (activeFilter === 'todos') title = 'Todos os Chamados';
    else if (activeFilter === 'abertos') title = 'Todos os Chamados Abertos';
    else if (activeFilter === 'finalizados') title = 'Todos os Chamados Finalizados';
    else if (activeFilter === 'cancelados') title = 'Todos os Chamados Cancelados';
  }

  const renderTable = (data: ITicket[], sectionTitle: string, sectionKey: keyof typeof openSections) => {
    const isOpen = openSections[sectionKey];
    
    return (
      <div className={styles.accordionContainer}>
        <div className={styles.accordionHeader} onClick={() => toggleSection(sectionKey)}>
          {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          <h3>{sectionTitle} ({data.length} Registros)</h3>
          <div className={styles.accordionActions}>
             <Filter size={16} />
          </div>
        </div>
        
        {isOpen && (
          <div className={styles.accordionContent}>
            {data.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Nenhum ticket encontrado.</div>
            ) : (
              <table className={styles.otrsTable}>
                <thead>
                  <tr>
                    <th>Protocolo</th>
                    <th>Título</th>
                    <th>Departamento</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Cliente</th>
                    <th>Data/Hora</th>
                    <th>Última Situação</th>
                    <th>Atendente</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : (
                    data.slice(0, limits[sectionKey] || 50).map(ticket => (
                      <tr key={ticket.id} onClick={() => onSelectTicket(ticket)}>
                        <td>#{ticket.protocolo_origem}</td>
                        <td style={{ fontWeight: 500 }}>{ticket.titulo}</td>
                        <td>{ticket.departamento || '-'}</td>
                        <td>{renderBadge(ticket.prioridade)}</td>
                        <td>{ticket.status}</td>
                        <td>{ticket.cliente}</td>
                        <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {new Date(ticket.criado_em).toLocaleDateString()}<br/>
                          {new Date(ticket.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                          {ticket.atualizado_em ? new Date(ticket.atualizado_em).toLocaleDateString() : '-'}<br/>
                          {ticket.atualizado_em ? new Date(ticket.atualizado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </td>
                        <td style={{ color: '#94a3b8' }}>
                          {(ticket.analista_id || ticket.tecnico_id) 
                            ? (perfis?.find(p => String(p.user_id) === String(ticket.analista_id || ticket.tecnico_id))?.nome || 'Alocado') 
                            : 'Sem Atendente'}
                        </td>
                        <td>
                          <button className={styles.iconBtn}><Eye size={16} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
            
            {/* Load More Button */}
            {data.length > (limits[sectionKey] || 50) && (
              <div style={{ padding: '12px', textAlign: 'center', borderTop: '1px solid #334155' }}>
                <button 
                  onClick={() => loadMore(sectionKey)}
                  style={{
                    background: 'transparent',
                    border: '1px solid #475569',
                    color: '#e2e8f0',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = '#334155'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                >
                  Carregar Mais 50
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };




  return (
    <div className={styles.dashboardWrapper}>
      <div className={styles.dashboardToolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input 
            type="text" 
            placeholder="Buscar chamado..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.dashboardSections}>
        {renderTable(filteredTickets, title, 'my')}
      </div>
    </div>
  );
}
