'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Clock, CalendarDays, Activity } from 'lucide-react';

export default function RelatoriosPage() {
  const kpis = [
    { title: 'Chamados no Mês', value: '1,248', trend: '+12%', color: '#3b82f6', icon: Activity },
    { title: 'Tempo Médio de Resposta', value: '15 min', trend: '-2 min', color: '#10b981', icon: Clock },
    { title: 'Ordens de Serviço (Campo)', value: '142', trend: '+5%', color: '#f59e0b', icon: Users },
    { title: 'Taxa de SLA Cumprido', value: '98.5%', trend: '+0.5%', color: '#8b5cf6', icon: TrendingUp },
  ];

  return (
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>Acompanhamento CRM</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Métricas, performance da equipe e saúde dos clientes</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ 
            background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '10px 16px', 
            borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' 
          }}>
            <CalendarDays size={18} /> Últimos 30 Dias
          </button>
          <button style={{ 
            background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600
          }}>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '2rem' }}>
        {kpis.map((kpi, i) => (
          <div key={i} style={{ 
            background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px',
            display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 500 }}>{kpi.title}</span>
              <div style={{ background: `${kpi.color}20`, padding: '8px', borderRadius: '8px' }}>
                <kpi.icon size={20} color={kpi.color} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f8fafc' }}>{kpi.value}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: kpi.trend.startsWith('+') ? '#10b981' : kpi.trend.startsWith('-') ? '#10b981' : '#f43f5e' }}>
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos Mockados */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', flex: 1 }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '1.1rem' }}>Volume de Chamados por Cliente</h3>
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '16px 0' }}>
            {/* Barras Mockadas */}
            {[
              { label: 'Bacio', height: '80%', color: '#3b82f6' },
              { label: 'Burger K.', height: '60%', color: '#60a5fa' },
              { label: 'Ofner', height: '40%', color: '#93c5fd' },
              { label: 'KFC', height: '50%', color: '#bfdbfe' },
            ].map((bar, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '100%', maxWidth: '60px', height: bar.height, background: bar.color, borderRadius: '6px 6px 0 0' }} />
                <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 500 }}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 16px 0', color: '#f8fafc', fontSize: '1.1rem' }}>Categorias Mais Frequentes</h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6' }} />
              <div style={{ flex: 1, color: '#e2e8f0', fontSize: '0.9rem' }}>Hardware / PDV</div>
              <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>45%</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10b981' }} />
              <div style={{ flex: 1, color: '#e2e8f0', fontSize: '0.9rem' }}>Redes e Conectividade</div>
              <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>30%</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#f59e0b' }} />
              <div style={{ flex: 1, color: '#e2e8f0', fontSize: '0.9rem' }}>Cartão Vexpenses</div>
              <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>15%</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#8b5cf6' }} />
              <div style={{ flex: 1, color: '#e2e8f0', fontSize: '0.9rem' }}>Outros</div>
              <div style={{ fontWeight: 'bold', color: '#f8fafc' }}>10%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
