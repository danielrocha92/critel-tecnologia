'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, Receipt, TrendingUp, Wallet } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './ResumoFinanceiro.module.css';

type TechnicianTransaction = {
  id: string;
  descricao: string;
  valor: number | string;
  valor_servico: number | string;
  valor_despesas: number | string;
  data_vencimento: string;
  data_liquidacao: string | null;
  status: 'PENDENTE' | 'LIQUIDADO';
  metodo_pagamento: string | null;
};

function getCycle(paymentMonth: string) {
  const [year, month] = paymentMonth.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 2, 2));
  const end = new Date(Date.UTC(year, month - 1, 1));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    payout: `${paymentMonth}-15`,
    label: `Ciclo ${start.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })}–${end.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })} · pagamento 15/${String(month).padStart(2, '0')}`,
  };
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function currentPaymentMonth() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}`;
}

const supabase = createClient();

export default function ResumoFinanceiro({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TechnicianTransaction[]>([]);
  const [paymentMonth, setPaymentMonth] = useState(currentPaymentMonth);

  const periods = useMemo(() => {
    const [year, month] = paymentMonth.split('-').map(Number);
    return Array.from({ length: 14 }, (_, index) => {
      const date = new Date(Date.UTC(year, month - 1 + index - 7, 1));
      const value = date.toISOString().slice(0, 7);
      return { value, label: getCycle(value).label };
    });
  }, [paymentMonth]);

  const cycle = useMemo(() => getCycle(paymentMonth), [paymentMonth]);

  useEffect(() => {
    let active = true;
    const fetchTransactions = async () => {
      try {
        const response = await fetch(`/api/tecnico/financeiro?inicio=${cycle.start}&fim=${cycle.end}`, { cache: 'no-store' });
        const result = await response.json() as { error?: string; transacoes?: TechnicianTransaction[] };
        if (!response.ok) throw new Error(result.error || 'Não foi possível carregar os lançamentos.');
        if (active) setTransactions(result.transacoes || []);
      } catch (error) {
        console.error('Não foi possível carregar os valores do ciclo do técnico:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchTransactions();
    const channel = supabase
      .channel(`resumo_financeiro_tecnico_${userId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `tecnico_id=eq.${userId}` }, () => {
        void fetchTransactions();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_financeiras', filter: `tecnico_id=eq.${userId}` }, () => {
        void fetchTransactions();
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [userId, cycle.start, cycle.end]);

  const totals = useMemo(() => transactions.reduce((sum, transaction) => {
    const amount = Number(transaction.valor || 0);
    sum.total += amount;
    sum.servicos += Number(transaction.valor_servico || 0);
    sum.despesas += Number(transaction.valor_despesas || 0);
    if (transaction.status === 'LIQUIDADO') sum.pago += amount;
    else sum.pendente += amount;
    return sum;
  }, { total: 0, servicos: 0, despesas: 0, pendente: 0, pago: 0 }), [transactions]);

  if (loading) {
    return <div className={styles.loadingContainer}>Carregando balanço...</div>;
  }

  return (
    <section className={styles.container} aria-labelledby="technician-financial-summary-title">
      <header className={styles.header}>
        <h2 className={styles.title} id="technician-financial-summary-title">Balanço Financeiro</h2>
        <div className={styles.selectWrapper}>
          <Calendar size={14} className={styles.calendarIcon} />
          <select value={paymentMonth} onChange={(event) => setPaymentMonth(event.target.value)} className={styles.periodSelect} aria-label="Ciclo de pagamento">
            {periods.map((period) => <option key={period.value} value={period.value} className={styles.periodOption}>{period.label}</option>)}
          </select>
        </div>
      </header>

      <div className={styles.cycleNotice}>
        <span>{cycle.label}</span>
        <strong>Vencimento padrão: {new Date(`${cycle.payout}T00:00:00`).toLocaleDateString('pt-BR')}</strong>
      </div>

      <div className={styles.card}>
        <div className={styles.totalRow}>
          <div className={styles.iconBox}><Wallet size={24} /></div>
          <div>
            <p className={styles.totalLabel}>Total do ciclo</p>
            <h3 className={styles.totalValue}>{currency(totals.total)}</h3>
          </div>
        </div>

        <div className={styles.detailsGrid}>
          <div>
            <p className={styles.detailLabel}><TrendingUp size={12} className={styles.servicesIcon} /> Serviços (OS)</p>
            <strong className={styles.detailValue}>{currency(totals.servicos)}</strong>
          </div>
          <div>
            <p
              className={styles.detailLabel}
              title="Soma das despesas das ordens de serviço validadas pelo analista."
              aria-label="Reembolsos extras aprovados pelo analista"
            >
              <Receipt size={12} className={styles.expensesIcon} /> Reembolsos extras
            </p>
            <strong className={styles.detailValue}>{currency(totals.despesas)}</strong>
          </div>
          <div>
            <p className={styles.detailLabel}>Pendente de pagamento</p>
            <strong className={styles.detailValue}>{currency(totals.pendente)}</strong>
          </div>
          <div>
            <p className={styles.detailLabel}>Já pago</p>
            <strong className={styles.detailValue}>{currency(totals.pago)}</strong>
          </div>
        </div>
      </div>

      {transactions.length > 0 && (
        <ul className={styles.transactionList} aria-label="Lançamentos deste ciclo">
          {transactions.map((transaction) => (
            <li key={transaction.id}>
              <span>
                <strong>{transaction.descricao}</strong>
                <small>{transaction.status === 'LIQUIDADO'
                  ? `Pago em ${new Date(`${transaction.data_liquidacao}T00:00:00`).toLocaleDateString('pt-BR')} via ${transaction.metodo_pagamento}`
                  : `Vencimento ${new Date(`${transaction.data_vencimento}T00:00:00`).toLocaleDateString('pt-BR')}`}</small>
              </span>
              <strong>{currency(Number(transaction.valor))}</strong>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
