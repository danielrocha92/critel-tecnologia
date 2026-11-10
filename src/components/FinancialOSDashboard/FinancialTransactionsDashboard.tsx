'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Check, Plus, RefreshCw, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import styles from './FinancialTransactionsDashboard.module.css';

type TransactionType = 'RECEITA' | 'DESPESA';
type PaymentMethod = 'PIX' | 'BOLETO' | 'TRANSFERENCIA';
type Transaction = {
  id: string;
  tipo: TransactionType;
  descricao: string;
  categoria: string;
  valor: number | string;
  data_competencia: string;
  data_vencimento: string;
  data_liquidacao: string | null;
  status: 'PENDENTE' | 'LIQUIDADO';
  metodo_pagamento: PaymentMethod | null;
  origem: 'MANUAL' | 'OS_TECNICO';
  ticket_id: string | null;
  tecnico_id: string | null;
  tecnico_nome?: string | null;
  pagamento_imediato: boolean;
  motivo_excecao: string | null;
};

type TransactionDraft = {
  tipo: TransactionType;
  descricao: string;
  categoria: string;
  valor: string;
  data_competencia: string;
  data_vencimento: string;
};

type ApiResult = { error?: string; transacao?: Transaction; transacoes?: Transaction[] };

const supabase = createClient();
function saoPauloDate(date: Date, includeDay = true) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    ...(includeDay ? { day: '2-digit' } : {}),
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const day = parts.find((part) => part.type === 'day')?.value;
  return includeDay ? `${year}-${month}-${day || ''}` : `${year}-${month}`;
}

const today = saoPauloDate(new Date());
const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: 'PIX', label: 'Pix' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'TRANSFERENCIA', label: 'Transferência' },
];

function monthStart(month: string) {
  return `${month}-01`;
}

function nextMonthStart(month: string) {
  const [year, value] = month.split('-').map(Number);
  return new Date(Date.UTC(year, value, 1)).toISOString().slice(0, 10);
}

function inMonth(date: string | null, month: string) {
  return Boolean(date && date >= monthStart(month) && date < nextMonthStart(month));
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function displayDate(value: string | null) {
  return value ? new Date(`${value}T00:00:00`).toLocaleDateString('pt-BR') : '—';
}

function statusLabel(transaction: Transaction) {
  if (transaction.status === 'LIQUIDADO') return transaction.tipo === 'RECEITA' ? 'Recebido' : 'Pago';
  if (transaction.data_vencimento < today) return 'Atrasado';
  return 'Pendente';
}

function statusClass(transaction: Transaction) {
  if (transaction.status === 'LIQUIDADO') return styles.statusSettled;
  return transaction.data_vencimento < today ? styles.statusOverdue : styles.statusPending;
}

export default function FinancialTransactionsDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [month, setMonth] = useState(() => saoPauloDate(new Date(), false));
  const [typeFilter, setTypeFilter] = useState<'TODOS' | TransactionType>('TODOS');
  const [technicianFilter, setTechnicianFilter] = useState('TODOS');
  const [draft, setDraft] = useState<TransactionDraft>({
    tipo: 'DESPESA',
    descricao: '',
    categoria: '',
    valor: '',
    data_competencia: today,
    data_vencimento: today,
  });
  const [settlementTarget, setSettlementTarget] = useState<Transaction | null>(null);
  const [settlementMethod, setSettlementMethod] = useState<PaymentMethod>('PIX');
  const [exceptionTarget, setExceptionTarget] = useState<Transaction | null>(null);
  const [exceptionReason, setExceptionReason] = useState('');

  const loadTransactions = useCallback(async () => {
    const response = await fetch('/api/financeiro/transacoes', { cache: 'no-store' });
    const result = await response.json() as ApiResult;
    if (!response.ok) throw new Error(result.error || 'Não foi possível carregar as transações.');
    setTransactions(result.transacoes || []);
  }, []);

  useEffect(() => {
    let active = true;
    const initialize = async () => {
      try {
        await loadTransactions();
      } catch (error) {
        console.error('Erro ao carregar o livro financeiro:', error);
        if (active) toast.error(error instanceof Error ? error.message : 'Não foi possível carregar as transações.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void initialize();

    const channel = supabase.channel('transacoes_financeiras_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transacoes_financeiras' }, () => {
        void loadTransactions().catch((error: unknown) => {
          console.error('Erro ao sincronizar transações financeiras:', error);
          toast.error('Não foi possível atualizar o livro financeiro em tempo real.');
        });
      })
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [loadTransactions]);

  const technicianOptions = useMemo(() => {
    const technicians = new Map<string, string>();
    transactions.forEach((transaction) => {
      if (transaction.tecnico_id) {
        technicians.set(
          transaction.tecnico_id,
          transaction.tecnico_nome || `Técnico ${transaction.tecnico_id.slice(-4)}`,
        );
      }
    });

    const nameCounts = new Map<string, number>();
    technicians.forEach((name) => nameCounts.set(name, (nameCounts.get(name) || 0) + 1));

    return [...technicians.entries()]
      .map(([id, name]) => ({
        id,
        label: nameCounts.get(name)! > 1 ? `${name} (${id.slice(-4)})` : name,
      }))
      .sort((left, right) => left.label.localeCompare(right.label, 'pt-BR'));
  }, [transactions]);

  const monthTransactions = useMemo(() => transactions.filter((transaction) => {
    const matchesType = typeFilter === 'TODOS' || transaction.tipo === typeFilter;
    const matchesTechnician = technicianFilter === 'TODOS' || transaction.tecnico_id === technicianFilter;
    return matchesType && matchesTechnician;
  }), [transactions, technicianFilter, typeFilter]);

  const dre = useMemo(() => {
    const competencyRevenue = transactions
      .filter((item) => item.tipo === 'RECEITA' && inMonth(item.data_competencia, month))
      .reduce((sum, item) => sum + Number(item.valor), 0);
    const competencyExpenses = transactions
      .filter((item) => item.tipo === 'DESPESA' && inMonth(item.data_competencia, month))
      .reduce((sum, item) => sum + Number(item.valor), 0);
    const cashRevenue = transactions
      .filter((item) => item.tipo === 'RECEITA' && item.status === 'LIQUIDADO' && inMonth(item.data_liquidacao, month))
      .reduce((sum, item) => sum + Number(item.valor), 0);
    const cashExpenses = transactions
      .filter((item) => item.tipo === 'DESPESA' && item.status === 'LIQUIDADO' && inMonth(item.data_liquidacao, month))
      .reduce((sum, item) => sum + Number(item.valor), 0);
    return {
      competencyRevenue,
      competencyExpenses,
      competencyResult: competencyRevenue - competencyExpenses,
      cashRevenue,
      cashExpenses,
      cashResult: cashRevenue - cashExpenses,
    };
  }, [transactions, month]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar as transações.');
    } finally {
      setRefreshing(false);
    }
  };

  const submitTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/financeiro/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'criar',
          ...draft,
          valor: Number(draft.valor.replace(',', '.')),
        }),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) throw new Error(result.error || 'Não foi possível cadastrar a transação.');
      if (result.transacao) setTransactions((current) => [result.transacao!, ...current]);
      setDraft((current) => ({ ...current, descricao: '', categoria: '', valor: '' }));
      toast.success('Transação cadastrada.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível cadastrar a transação.');
    } finally {
      setSaving(false);
    }
  };

  const settleTransaction = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!settlementTarget) return;
    setSaving(true);
    try {
      const response = await fetch('/api/financeiro/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'liquidar',
          transacao_id: settlementTarget.id,
          metodo_pagamento: settlementMethod,
          data_liquidacao: today,
        }),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) throw new Error(result.error || 'Não foi possível liquidar a transação.');
      setTransactions((current) => current.map((item) => item.id === settlementTarget.id
        ? { ...item, status: 'LIQUIDADO', data_liquidacao: today, metodo_pagamento: settlementMethod }
        : item));
      setSettlementTarget(null);
      toast.success(settlementTarget.tipo === 'RECEITA' ? 'Recebimento registrado.' : 'Pagamento registrado.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível liquidar a transação.');
    } finally {
      setSaving(false);
    }
  };

  const markImmediatePayment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!exceptionTarget || !exceptionReason.trim()) return;
    setSaving(true);
    try {
      const response = await fetch('/api/financeiro/transacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pagamento_imediato',
          transacao_id: exceptionTarget.id,
          motivo_excecao: exceptionReason,
        }),
      });
      const result = await response.json() as ApiResult;
      if (!response.ok) throw new Error(result.error || 'Não foi possível registrar a exceção.');
      setTransactions((current) => current.map((item) => item.id === exceptionTarget.id
        ? { ...item, data_vencimento: today, pagamento_imediato: true, motivo_excecao: exceptionReason.trim() }
        : item));
      setExceptionTarget(null);
      setExceptionReason('');
      toast.success('Exceção de pagamento imediato registrada pelo gestor.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível registrar a exceção.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.container} aria-labelledby="financial-transactions-title">
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>CONTAS A PAGAR E A RECEBER</span>
          <h2 className={styles.title} id="financial-transactions-title">Transações e DRE</h2>
          <p className={styles.description}>OSs validadas geram automaticamente um pagamento pendente ao técnico. O ciclo padrão fecha no dia 1, inicia no dia 2 e vence no dia 15.</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => void refresh()} disabled={refreshing || loading}>
          <RefreshCw size={16} className={refreshing ? styles.spinning : undefined} /> Atualizar
        </button>
      </header>

      <section className={styles.drePanel} aria-labelledby="dre-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle} id="dre-title">DRE em tempo real</h3>
            <p className={styles.description}>Resultado por competência e por caixa, separados para o período selecionado.</p>
          </div>
          <label className={styles.monthFilter}>
            <CalendarDays size={16} />
            <span className={styles.visuallyHidden}>Mês do demonstrativo</span>
            <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
          </label>
        </div>
        <div className={styles.dreGrid}>
          <DreCard title="Competência" revenue={dre.competencyRevenue} expenses={dre.competencyExpenses} result={dre.competencyResult} />
          <DreCard title="Caixa (liquidado)" revenue={dre.cashRevenue} expenses={dre.cashExpenses} result={dre.cashResult} />
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="new-transaction-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle} id="new-transaction-title">Novo lançamento manual</h3>
            <p className={styles.description}>Cadastre outras receitas ou despesas. Pagamentos de OS são gerados automaticamente.</p>
          </div>
        </div>
        <form className={styles.form} onSubmit={(event) => void submitTransaction(event)}>
          <label>Tipo
            <select value={draft.tipo} onChange={(event) => setDraft((current) => ({ ...current, tipo: event.target.value as TransactionType }))}>
              <option value="DESPESA">Conta a pagar</option>
              <option value="RECEITA">Conta a receber</option>
            </select>
          </label>
          <label>Descrição
            <input required maxLength={250} value={draft.descricao} onChange={(event) => setDraft((current) => ({ ...current, descricao: event.target.value }))} />
          </label>
          <label>Categoria
            <input required maxLength={100} value={draft.categoria} onChange={(event) => setDraft((current) => ({ ...current, categoria: event.target.value }))} />
          </label>
          <label>Valor (R$)
            <input required min="0.01" step="0.01" type="number" value={draft.valor} onChange={(event) => setDraft((current) => ({ ...current, valor: event.target.value }))} />
          </label>
          <label>Competência
            <input required type="date" value={draft.data_competencia} onChange={(event) => setDraft((current) => ({ ...current, data_competencia: event.target.value }))} />
          </label>
          <label>Vencimento
            <input required type="date" value={draft.data_vencimento} onChange={(event) => setDraft((current) => ({ ...current, data_vencimento: event.target.value }))} />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={saving}>
            <Plus size={16} /> {saving ? 'Salvando...' : 'Cadastrar lançamento'}
          </button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="transactions-list-title">
        <div className={styles.panelHeader}>
          <div>
            <h3 className={styles.panelTitle} id="transactions-list-title">Livro financeiro</h3>
            <p className={styles.description}>{monthTransactions.length} transação(ões) · status atrasado calculado pelo vencimento</p>
          </div>
          <div className={styles.filters}>
            <label className={styles.typeFilter}>
              <span className={styles.visuallyHidden}>Filtrar por tipo de transação</span>
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as typeof typeFilter)}>
                <option value="TODOS">Todas</option>
                <option value="RECEITA">Contas a receber</option>
                <option value="DESPESA">Contas a pagar</option>
              </select>
            </label>
            <label className={styles.technicianFilter}>
              <span className={styles.visuallyHidden}>Filtrar por técnico</span>
              <select value={technicianFilter} onChange={(event) => setTechnicianFilter(event.target.value)}>
                <option value="TODOS">Todos os técnicos</option>
                {technicianOptions.map((technician) => (
                  <option key={technician.id} value={technician.id}>{technician.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {loading ? (
          <p className={styles.stateMessage} role="status">Carregando transações...</p>
        ) : monthTransactions.length === 0 ? (
          <p className={styles.stateMessage}>Nenhuma transação cadastrada. Os pagamentos de OS surgirão aqui após a validação do analista.</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr><th>Tipo / descrição</th><th>Categoria</th><th>Técnico / OS</th><th>Competência</th><th>Vencimento</th><th>Valor</th><th>Status</th><th>Liquidação</th></tr>
              </thead>
              <tbody>
                {monthTransactions.map((transaction) => (
                  <tr key={transaction.id}>
                    <td data-label="Tipo / descrição">
                      <strong>{transaction.tipo === 'RECEITA' ? 'A receber' : 'A pagar'}</strong>
                      <span>{transaction.descricao}</span>
                    </td>
                    <td data-label="Categoria">{transaction.categoria}</td>
                    <td data-label="Técnico / OS">{transaction.tecnico_nome || (transaction.ticket_id ? `OS ${transaction.ticket_id.slice(0, 8)}` : '—')}</td>
                    <td data-label="Competência">{displayDate(transaction.data_competencia)}</td>
                    <td data-label="Vencimento">
                      {displayDate(transaction.data_vencimento)}
                      {transaction.pagamento_imediato && <span className={styles.exceptionTag} title={transaction.motivo_excecao || 'Exceção aprovada'}>Imediato</span>}
                    </td>
                    <td data-label="Valor" className={styles.currency}>{currency(Number(transaction.valor))}</td>
                    <td data-label="Status"><span className={`${styles.statusBadge} ${statusClass(transaction)}`}>{statusLabel(transaction)}</span></td>
                    <td data-label="Liquidação" className={styles.rowActions}>
                      {transaction.status === 'LIQUIDADO' ? (
                        <span>{displayDate(transaction.data_liquidacao)} · {transaction.metodo_pagamento}</span>
                      ) : (
                        <>
                          <button type="button" className={styles.secondaryButton} onClick={() => setSettlementTarget(transaction)}>
                            <Check size={14} /> {transaction.tipo === 'RECEITA' ? 'Registrar recebimento' : 'Registrar pagamento'}
                          </button>
                          {transaction.tipo === 'DESPESA' && transaction.origem === 'OS_TECNICO' && !transaction.pagamento_imediato && (
                            <button type="button" className={styles.textButton} onClick={() => setExceptionTarget(transaction)}>Antecipar exceção</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {settlementTarget && (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSettlementTarget(null); }}>
          <form className={styles.modal} onSubmit={(event) => void settleTransaction(event)} role="dialog" aria-modal="true" aria-labelledby="settlement-title">
            <h3 id="settlement-title">{settlementTarget.tipo === 'RECEITA' ? 'Registrar recebimento' : 'Registrar pagamento'}</h3>
            <p>{settlementTarget.descricao} · {currency(Number(settlementTarget.valor))}</p>
            <label>Data de liquidação
              <input type="date" value={today} readOnly />
            </label>
            <label>Método de pagamento
              <select value={settlementMethod} onChange={(event) => setSettlementMethod(event.target.value as PaymentMethod)}>
                {paymentMethods.map((method) => <option key={method.value} value={method.value}>{method.label}</option>)}
              </select>
            </label>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setSettlementTarget(null)}>Cancelar</button>
              <button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar liquidação'}</button>
            </div>
          </form>
        </div>
      )}

      {exceptionTarget && (
        <div className={styles.modalOverlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setExceptionTarget(null); }}>
          <form className={styles.modal} onSubmit={(event) => void markImmediatePayment(event)} role="dialog" aria-modal="true" aria-labelledby="exception-title">
            <h3 id="exception-title">Aprovar pagamento imediato</h3>
            <p>{exceptionTarget.descricao} · {currency(Number(exceptionTarget.valor))}</p>
            <label>Motivo da exceção
              <textarea required maxLength={500} value={exceptionReason} onChange={(event) => setExceptionReason(event.target.value)} />
            </label>
            <div className={styles.modalActions}>
              <button type="button" className={styles.secondaryButton} onClick={() => setExceptionTarget(null)}>Cancelar</button>
              <button type="submit" className={styles.primaryButton} disabled={saving || !exceptionReason.trim()}>{saving ? 'Salvando...' : 'Aprovar exceção'}</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function DreCard({ title, revenue, expenses, result }: { title: string; revenue: number; expenses: number; result: number }) {
  return (
    <article className={styles.dreCard}>
      <h4>{title}</h4>
      <dl>
        <div><dt>Receitas</dt><dd>{currency(revenue)}</dd></div>
        <div><dt>Despesas</dt><dd>{currency(expenses)}</dd></div>
      </dl>
      <p className={styles.resultRow}><Wallet size={16} /> Resultado <strong>{currency(result)}</strong></p>
    </article>
  );
}
