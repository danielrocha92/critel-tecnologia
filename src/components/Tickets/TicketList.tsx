'use client';

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Clock, AlertCircle } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export type TicketFilter = 'all' | 'my-all' | 'my-opened' | 'my-closed';

export default function TicketList({ filterTitle, filterType }: { filterTitle: string, filterType: TicketFilter }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTickets = async () => {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase.from('tickets').select('*').order('criado_em', { ascending: false });

      if (clientFilter) {
        query = query.eq('cliente', clientFilter);
      }

      if (dateFilter) {
        // Assume dateFilter is YYYY-MM-DD
        const nextDay = new Date(dateFilter);
        nextDay.setDate(nextDay.getDate() + 1);

        query = query.gte('criado_em', `${dateFilter}T00:00:00.000Z`)
          .lt('criado_em', nextDay.toISOString());
      }

      if (user && filterType !== 'all') {
        // Assume column 'tecnico_id' ou 'analista_id'. If not present, might need to adapt.
        query = query.eq('tecnico_id', user.id);

        if (filterType === 'my-opened') {
          query = query.neq('status', 'FINALIZADO').neq('status', 'CONCLUIDO');
        } else if (filterType === 'my-closed') {
          query = query.in('status', ['FINALIZADO', 'CONCLUIDO']);
        }
      }

      const res = await query;
      let data = res.data;
      let error = res.error;

      if (error) {
        console.error('Erro ao buscar chamados com tecnico_id:', error);
        // Fallback temporário caso a coluna tecnico_id não exista
        let fallbackQuery = supabase.from('tickets').select('*').order('criado_em', { ascending: false });
        
        if (clientFilter) {
          fallbackQuery = fallbackQuery.eq('cliente', clientFilter);
        }

        if (dateFilter) {
          const nextDay = new Date(dateFilter);
          nextDay.setDate(nextDay.getDate() + 1);
          fallbackQuery = fallbackQuery.gte('criado_em', `${dateFilter}T00:00:00.000Z`)
                                       .lt('criado_em', nextDay.toISOString());
        }

        if (user && filterType !== 'all') {
          if (filterType === 'my-opened') {
            fallbackQuery = fallbackQuery.neq('status', 'FINALIZADO').neq('status', 'CONCLUIDO');
          } else if (filterType === 'my-closed') {
            fallbackQuery = fallbackQuery.in('status', ['FINALIZADO', 'CONCLUIDO']);
          }
        }

        const fallbackRes = await fallbackQuery;
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (error) {
        console.error('Erro ao buscar chamados (fallback):', error);
      } else {
        setTickets(data || []);
      }
      setLoading(false);
    };

    fetchTickets();
  }, [filterType, dateFilter, clientFilter]);

  const filteredTickets = tickets.filter(t => {
    const term = searchTerm.toLowerCase();
    return (
      (t.titulo && t.titulo.toLowerCase().includes(term)) ||
      (t.cliente && t.cliente.toLowerCase().includes(term)) ||
      (t.protocolo_origem && t.protocolo_origem.toLowerCase().includes(term))
    );
  });

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
        <div style={{ position: 'relative', width: '200px' }}>
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{
              width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#94a3b8',
              padding: '10px', borderRadius: '8px', outline: 'none'
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center' }}>Carregando chamados...</div>
      ) : filteredTickets.length === 0 ? (
        <div style={{ color: '#94a3b8', padding: '2rem', textAlign: 'center', background: '#1e293b', borderRadius: '12px', border: '1px solid #334155' }}>
          Nenhum chamado encontrado para este filtro.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
          {filteredTickets.map(ticket => (
            <div key={ticket.id} style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px',
              display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
                background: ticket.status === 'NOVO' ? '#f59e0b' : ticket.status === 'FINALIZADO' ? '#10b981' : '#3b82f6'
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '1.1rem' }}>{ticket.protocolo_origem || ticket.id.split('-')[0]}</span>
                <span style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  padding: '4px 12px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600
                }}>
                  {ticket.status}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontWeight: 600 }}>
                <MapPin size={16} color="#94a3b8" /> {ticket.cliente}
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
                <AlertCircle size={16} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {ticket.titulo}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                  <Clock size={14} /> {new Date(ticket.criado_em).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
