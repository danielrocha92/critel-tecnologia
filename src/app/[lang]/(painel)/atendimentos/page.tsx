'use client';

import React, { useState } from 'react';
import { Search, Plus, MapPin, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function OrdensDeServicoPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const ordens = [
    { id: 'OS-1001', cliente: 'Bacio di Latte - Morumbi', tecnico: 'João Silva', status: 'Em Rota', data: '17/09/2026', hora: '14:30', problema: 'Troca de Fonte do PDV 2' },
    { id: 'OS-1002', cliente: 'KFC - Shopping Tatuapé', tecnico: 'Carlos Mendes', status: 'No Local', data: '17/09/2026', hora: '16:00', problema: 'Revisão de Rede' },
    { id: 'OS-1003', cliente: 'Ofner - Jardins', tecnico: 'Não Atribuído', status: 'Aguardando', data: '18/09/2026', hora: '09:00', problema: 'Instalação de Impressora Fiscal' },
  ];

  return (
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>Ordens de Serviço</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Gerenciamento de chamados em campo para os técnicos</p>
        </div>
        <button style={{ 
          background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', 
          borderRadius: '8px', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' 
        }}>
          <Plus size={18} /> Nova Ordem de Serviço
        </button>
      </div>

      <div style={{ 
        background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155',
        display: 'flex', gap: '16px', marginBottom: '2rem'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por OS, cliente ou técnico..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff',
              padding: '10px 10px 10px 40px', borderRadius: '8px', outline: 'none'
            }}
          />
        </div>
        <select style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0 16px', borderRadius: '8px', outline: 'none' }}>
          <option>Todos os Status</option>
          <option>Aguardando</option>
          <option>Em Rota</option>
          <option>No Local</option>
          <option>Concluído</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '16px' }}>
        {ordens.map(os => (
          <div key={os.id} style={{ 
            background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', overflow: 'hidden'
          }}>
            <div style={{ 
              position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', 
              background: os.status === 'Aguardando' ? '#f59e0b' : os.status === 'Concluído' ? '#10b981' : '#3b82f6' 
            }} />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 'bold', color: '#e2e8f0', fontSize: '1.1rem' }}>{os.id}</span>
              <span style={{ 
                background: os.status === 'Aguardando' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)', 
                color: os.status === 'Aguardando' ? '#fbbf24' : '#60a5fa', 
                padding: '4px 12px', borderRadius: '999px', fontSize: '0.85rem', fontWeight: 600 
              }}>
                {os.status}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
              <MapPin size={16} color="#94a3b8" /> {os.cliente}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1' }}>
              <AlertCircle size={16} color="#94a3b8" /> {os.problema}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #334155' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>
                  {os.tecnico !== 'Não Atribuído' ? os.tecnico.charAt(0) : '?'}
                </div>
                <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{os.tecnico}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                <Clock size={14} /> {os.data} {os.hora}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
