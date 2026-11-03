'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { TrendingUp, Wallet, Receipt, Calendar } from 'lucide-react';
import styles from './ResumoFinanceiro.module.css';

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
        .from('tickets')
        .select('valor_pagamento, despesas_json')
        .eq('tecnico_id', userId)
        .eq('status', 'FINALIZADO')
        .not('financeiro_aprovado_em', 'is', null)
        .gte('financeiro_aprovado_em', dataInicio.toISOString())
        .lte('financeiro_aprovado_em', dataFim.toISOString());

      if (data && !error) {
        let sumServicos = 0;
        let sumDespesas = 0;

        data.forEach(item => {
          sumServicos += Number(item.valor_pagamento || 0);
          const expenses = Array.isArray(item.despesas_json) ? item.despesas_json : [];
          sumDespesas += expenses.reduce((total, expense) =>
            total + Number(expense.valor_numerico ?? expense.valor ?? 0), 0);
        });

        setTotais({
          servicos: sumServicos,
          despesas: sumDespesas,
          geral: sumServicos + sumDespesas
        });
      } else if (error) {
        console.error('Não foi possível carregar os valores aprovados do técnico:', error.message);
      }

      setLoading(false);
    };

    if (!userId) return;

    void fetchFinanceiro();
    const channel = supabase
      .channel(`resumo_financeiro_tecnico_${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `tecnico_id=eq.${userId}` }, () => {
        void fetchFinanceiro();
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [userId, selectedPeriod]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        Carregando balanço...
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Balanço Financeiro</h2>
        <div className={styles.selectWrapper}>
          <Calendar size={14} className={styles.calendarIcon} />
          <select 
            value={selectedPeriod} 
            onChange={(e) => { setLoading(true); setSelectedPeriod(e.target.value); }}
            className={styles.periodSelect}
          >
            {periodos.map(p => (
              <option key={p.value} value={p.value} className={styles.periodOption}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.totalRow}>
          <div className={styles.iconBox}>
            <Wallet size={24} />
          </div>
          <div>
            <p className={styles.totalLabel}>Total a Receber</p>
            <h3 className={styles.totalValue}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.geral)}
            </h3>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div>
            <p className={styles.detailLabel}>
              <TrendingUp size={12} className={styles.servicesIcon} /> Serviços (OS)
            </p>
            <strong className={styles.detailValue}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.servicos)}
            </strong>
          </div>
          <div>
            <p className={styles.detailLabel}>
              <Receipt size={12} className={styles.expensesIcon} /> Reembolsos Extras
            </p>
            <strong className={styles.detailValue}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totais.despesas)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
