'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { TrendingUp, Wallet, Receipt, Calendar } from 'lucide-react';

export default function ResumoFinanceiro({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [totais, setTotais] = useState({
    servicos: 0,
    despesas: 0,
    geral: 0
  });

  // Gera os últimos 6 meses de quinzenas
  const [periodos] = useState(() => {
    const list = [];
    const curr = new Date();
    let m = curr.getMonth();
    let y = curr.getFullYear();
    for (let i = 0; i < 6; i++) {
      const monthName = new Date(y, m, 1).toLocaleString('pt-BR', { month: 'long' });
      const capMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      
      list.push({ label: `2ª Quinzena de ${capMonth}/${y}`, value: `${y}-${m}-2` });
      list.push({ label: `1ª Quinzena de ${capMonth}/${y}`, value: `${y}-${m}-1` });

      m--;
      if (m < 0) { m = 11; y--; }
    }
    return list;
  });

  const hoje = new Date();
  const defVal = `${hoje.getFullYear()}-${hoje.getMonth()}-${hoje.getDate() <= 15 ? 1 : 2}`;
  const [selectedPeriod, setSelectedPeriod] = useState(defVal);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchFinanceiro = async () => {
      // Extrai ano, mês e quinzena
      const [yStr, mStr, qStr] = selectedPeriod.split('-');
      const y = parseInt(yStr);
      const m = parseInt(mStr);
      const q = parseInt(qStr);
      const isPrimeira = q === 1;

      // Definir limites de data para a quinzena atual
      const dataInicio = new Date(y, m, isPrimeira ? 1 : 16);
      dataInicio.setHours(0, 0, 0, 0);
      
      const dataFim = isPrimeira 
        ? new Date(y, m, 15, 23, 59, 59, 999)
        : new Date(y, m + 1, 0, 23, 59, 59, 999);

      const { data, error } = await supabase
        .from('financeiro')
        .select('valor_servico, valor_despesas')
        .eq('tecnico_id', userId)
        .gte('criado_em', dataInicio.toISOString())
        .lte('criado_em', dataFim.toISOString());

      if (data && !error) {
        let sumServicos = 0;
        let sumDespesas = 0;

        data.forEach(item => {
          sumServicos += Number(item.valor_servico || 0);
          sumDespesas += Number(item.valor_despesas || 0);
        });

        setTotais({
          servicos: sumServicos,
          despesas: sumDespesas,
          geral: sumServicos + sumDespesas
        });
      }

      setLoading(false);
    };

    if (userId) {
      fetchFinanceiro();
    }
  }, [userId, selectedPeriod]);

  if (loading) {
    return (
      <div style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.4)', borderRadius: '16px', marginBottom: '1.5rem', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
        Carregando balanço...
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#f8fafc' }}>Balanço Financeiro</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '12px' }}>
          <Calendar size={14} color="#94a3b8" />
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            style={{ 
              background: 'transparent', border: 'none', color: '#94a3b8', 
              fontSize: '0.8rem', outline: 'none', appearance: 'none', cursor: 'pointer' 
            }}
          >
            {periodos.map(p => (
              <option key={p.value} value={p.value} style={{ background: '#1e293b' }}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ 
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.2) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '16px', 
        padding: '1.2rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1rem' }}>
          <div style={{ background: '#10b981', padding: '10px', borderRadius: '12px', display: 'flex' }}>
            <Wallet size={24} color="white" />
          </div>
          <div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.85rem' }}>Total a Receber</p>
            <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.8rem', fontWeight: 700 }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.geral)}
            </h3>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '1rem', borderTop: '1px solid rgba(16,185,129,0.1)', paddingTop: '1rem' }}>
          <div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={12} color="#10b981" /> Serviços (OS)
            </p>
            <strong style={{ color: '#f8fafc', fontSize: '1.1rem' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.servicos)}
            </strong>
          </div>
          <div>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Receipt size={12} color="#3b82f6" /> Reembolsos Extras
            </p>
            <strong style={{ color: '#f8fafc', fontSize: '1.1rem' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.despesas)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
