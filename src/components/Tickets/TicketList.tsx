'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, AlertCircle, Bookmark, Tag, User, Activity, ChevronDown, ChevronRight } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

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
    if (p === 'alta' || p === '1' || p === 'urgente') return <span style={{ color: '#ef4444', fontWeight: 600 }}>Alta</span>;
    if (p === 'media' || p === '2' || p === 'normal') return <span style={{ color: '#f59e0b', fontWeight: 600 }}>Média</span>;
    if (p === 'baixa' || p === '3' || p === 'low') return <span style={{ color: '#10b981', fontWeight: 600 }}>Baixa</span>;
    return <span style={{ color: '#64748b', fontWeight: 600 }}>Normal</span>;
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
      <div style={{
        background: '#162032',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px',
        overflow: 'hidden',
        marginBottom: '2rem'
      }}>
        <div 
          onClick={() => setIsDepartmentsOpen(!isDepartmentsOpen)} 
          style={{ 
            display: 'flex', alignItems: 'flex-start', padding: '16px',
            background: '#1e293b', cursor: 'pointer', userSelect: 'none',
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div style={{ marginTop: '2px', color: '#94a3b8' }}>
            {isDepartmentsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '8px', flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f8fafc' }}>Total de Chamados Abertos por Departamento</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px', fontWeight: 'normal' }}>Lista com o total de chamados abertos por departamentos.</span>
          </div>
        </div>
        
        {isDepartmentsOpen && (
          <div style={{ padding: '0', maxHeight: '400px', overflowY: 'auto', background: '#162032' }}>
            {sortedDeptos.length === 0 ? (
               <div style={{ padding: '16px', color: '#94a3b8', fontSize: '13px' }}>Nenhum chamado aberto.</div>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {sortedDeptos.map(([depto, count], i) => (
                  <li key={depto} 
                    onClick={() => setDepartmentFilter(departmentFilter === depto ? '' : depto)}
                    style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    background: departmentFilter === depto ? 'rgba(96, 165, 250, 0.15)' : (i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'transparent'),
                    borderLeft: departmentFilter === depto ? '4px solid #3b82f6' : '4px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '13px',
                    color: departmentFilter === depto ? '#60a5fa' : '#e2e8f0',
                    fontWeight: departmentFilter === depto ? 'bold' : 'normal'
                  }}>
                    <span>{depto}</span>
                    <span style={{ 
                      background: departmentFilter === depto ? '#3b82f6' : 'rgba(255,255,255,0.1)', 
                      color: '#fff',
                      padding: '2px 8px', 
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      minWidth: '24px',
                      textAlign: 'center'
                    }}>{count}</span>
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
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>{filterTitle}</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Gerenciamento e acompanhamento de chamados</p>
      </div>

      <div style={{
        background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155',
        display: 'flex', gap: '16px', marginBottom: '2rem', flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Buscar por protocolo, cliente ou título..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff',
              padding: '10px 10px 10px 40px', borderRadius: '8px', outline: 'none'
            }}
          />
        </div>

        {/* Filtro de Status (Servidor) - Somente mostrar se não estivermos nas abas travadas */}
        {(filterType === 'all' || filterType === 'my-all') && (
          <div style={{ position: 'relative', width: '180px' }}>
            <select
              value={serverStatusFilter}
              onChange={e => setServerStatusFilter(e.target.value as 'open' | 'closed' | 'all')}
              style={{
                width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8',
                padding: '10px', borderRadius: '8px', outline: 'none'
              }}
            >
              <option value="open">Somente Abertos</option>
              <option value="closed">Somente Fechados</option>
              <option value="all">Todos os Status</option>
            </select>
          </div>
        )}

        <div style={{ position: 'relative', width: '200px' }}>
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            style={{
              width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8',
              padding: '10px', borderRadius: '8px', outline: 'none'
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
      </div>

      {renderDepartmentTotals()}

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>Carregando chamados...</div>
      ) : filteredTickets.length === 0 ? (
        <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
          Nenhum chamado encontrado para este filtro.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '16px' }}>
          {filteredTickets.map(ticket => (
            <div 
              key={ticket.id} 
              onClick={() => router.push(`/${lang}/atendimento?ticket_id=${ticket.id}`)}
              style={{
                background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px',
                display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', overflow: 'hidden',
                cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.borderColor = '#475569';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = '#334155';
              }}
            >
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                background: ticket.status === 'NOVO' ? '#f59e0b' : ticket.status === 'FINALIZADO' ? '#10b981' : '#3b82f6'
              }} />

              {/* Header: ID, Titulo, Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>
                    #{ticket.protocolo_origem || ticket.id.split('-')[0]}
                  </div>
                  <div style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '1.1rem', lineHeight: '1.4' }}>
                    {ticket.titulo}
                  </div>
                </div>
                <span style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0
                }}>
                  {ticket.status}
                </span>
              </div>

              {/* Client & Info Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', color: '#94a3b8', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="#60a5fa" />
                  <span style={{ color: '#cbd5e1' }}>{ticket.cliente}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Bookmark size={14} color="#818cf8" />
                  <span>{ticket.departamento || '-'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Tag size={14} color="#f472b6" />
                  <span>{ticket.categoria || '-'}</span>
                </div>
              </div>
              
              {/* Prioridade e Atendente */}
              <div style={{ display: 'flex', justifyContent: 'space-between', background: '#0f172a', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#64748b' }}>Prioridade:</span>
                  {renderBadge(ticket.prioridade)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#cbd5e1' }}>
                  <User size={14} color="#94a3b8" />
                  {getAtendenteNome(ticket.analista_id || ticket.tecnico_id)}
                </div>
              </div>

              {/* Footer: Datas */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #334155', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
                  <Clock size={14} /> 
                  <span>{new Date(ticket.criado_em).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#64748b' }}>
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
