'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, AlertCircle, Bookmark, Tag, User, Activity } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';

export type TicketFilter = 'all' | 'my-all' | 'my-opened' | 'my-closed';

export default function TicketList({ filterTitle, filterType, excludeTomTicket }: { filterTitle: string, filterType: TicketFilter, excludeTomTicket?: boolean }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [perfis, setPerfis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
    };

    fetchTickets();
  }, [excludeTomTicket, filterType]);

  const filteredTickets = tickets.filter(t => {
    // 1. Filtro de Cliente
    if (clientFilter && t.cliente !== clientFilter) return false;

    // 2. Filtros por Status (Abertos / Finalizados)
    if (filterType === 'my-opened') {
      if (t.status === 'FINALIZADO' || t.status === 'CONCLUIDO') return false;
    } else if (filterType === 'my-closed') {
      if (t.status !== 'FINALIZADO' && t.status !== 'CONCLUIDO') return false;
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
    const p = perfis.find(p => String(p.id) === String(analista_id));
    return p ? p.nome : 'Alocado';
  };

  const renderBadge = (priority: string) => {
    const p = String(priority).toLowerCase();
    if (p === 'alta' || p === '1' || p === 'urgente') return <span style={{ color: '#ef4444', fontWeight: 600 }}>Alta</span>;
    if (p === 'media' || p === '2' || p === 'normal') return <span style={{ color: '#f59e0b', fontWeight: 600 }}>Média</span>;
    if (p === 'baixa' || p === '3' || p === 'low') return <span style={{ color: '#10b981', fontWeight: 600 }}>Baixa</span>;
    return <span style={{ color: '#64748b', fontWeight: 600 }}>Normal</span>;
  };

  return (
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>{filterTitle}</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Gerenciamento e acompanhamento de chamados</p>
      </div>

      <div style={{
        background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155',
        display: 'flex', gap: '16px', marginBottom: '2rem'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
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
        <div style={{ position: 'relative', width: '200px' }}>
          <select
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
            style={{
              width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8',
              padding: '10px', borderRadius: '8px', outline: 'none', appearance: 'none'
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
                  {getAtendenteNome(ticket.analista_id)}
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
