'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowUpRight,
  Building2,
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  DollarSign,
  Headset,
  RefreshCw,
  Search,
  Wallet,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './DepartmentEnvironment.module.css';

type Department = 'financeiro' | 'comercial' | 'analista';

type FinancialEntry = {
  id: string;
  ticket_id: string | null;
  tecnico_id: string | null;
  valor_servico: number | string | null;
  valor_despesas: number | string | null;
  status_faturamento: string | null;
  criado_em: string | null;
};

type StoreContact = {
  nome_loja: string;
};

type SupportTicket = {
  id: string;
  protocolo_origem: string | null;
  titulo: string | null;
  cliente: string | null;
  status: string | null;
  prioridade: string | null;
  departamento: string | null;
  criado_em: string | null;
};

const departmentLabels: Record<Department, { title: string; description: string; eyebrow: string }> = {
  financeiro: {
    title: 'Painel Financeiro',
    description: 'Acompanhe faturamento, despesas e pendências registradas nas ordens de serviço.',
    eyebrow: 'AMBIENTE FINANCEIRO',
  },
  comercial: {
    title: 'Painel Comercial',
    description: 'Consulte os cadastros das lojas e encontre rapidamente a unidade desejada.',
    eyebrow: 'AMBIENTE COMERCIAL',
  },
  analista: {
    title: 'Painel do Analista',
    description: 'Monitore solicitações recebidas e encaminhe cada atendimento à equipe.',
    eyebrow: 'AMBIENTE DE ANÁLISE',
  },
};

function formatCurrency(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
    Number.isFinite(amount) ? amount : 0,
  );
}

function formatDate(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('pt-BR');
}

function statusClass(status: string | null | undefined) {
  const normalized = (status || '').trim().toUpperCase();
  if (['FINALIZADO', 'RESOLVIDO', 'FECHADO', 'PAGO', 'FATURADO'].includes(normalized)) {
    return styles.statusDone;
  }
  if (['PENDENTE', 'NOVO', 'ABERTO', 'FILA'].includes(normalized)) {
    return styles.statusPending;
  }
  return styles.statusActive;
}

export default function DepartmentEnvironment({ department }: { department: Department }) {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'pt';
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [financialEntries, setFinancialEntries] = useState<FinancialEntry[]>([]);
  const [contacts, setContacts] = useState<StoreContact[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [ticketTotal, setTicketTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [ticketStatus, setTicketStatus] = useState('abertos');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const copy = departmentLabels[department];

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      try {
        if (department === 'financeiro') {
          if (!/^\d{4}-\d{2}$/.test(month)) {
            throw new Error('Selecione um mês válido para consultar os lançamentos.');
          }

          const [year, monthNumber] = month.split('-').map(Number);
          const start = new Date(Date.UTC(year, monthNumber - 1, 1)).toISOString();
          const end = new Date(Date.UTC(year, monthNumber, 1)).toISOString();
          const entries: FinancialEntry[] = [];
          const pageSize = 1000;
          for (let offset = 0; ; offset += pageSize) {
            const { data, error: queryError } = await supabase
              .from('financeiro')
              .select('id, ticket_id, tecnico_id, valor_servico, valor_despesas, status_faturamento, criado_em')
              .gte('criado_em', start)
              .lt('criado_em', end)
              .order('criado_em', { ascending: false })
              .range(offset, offset + pageSize - 1);

            if (queryError) throw queryError;
            entries.push(...((data || []) as FinancialEntry[]));
            if (!data || data.length < pageSize) break;
          }
          if (isMounted) setFinancialEntries(entries);
        } else if (department === 'comercial') {
          const entries: StoreContact[] = [];
          const pageSize = 1000;
          for (let offset = 0; ; offset += pageSize) {
            const { data, error: queryError } = await supabase
              .from('lojas_contatos')
              .select('nome_loja')
              .order('nome_loja', { ascending: true })
              .range(offset, offset + pageSize - 1);

            if (queryError) throw queryError;
            entries.push(...((data || []) as StoreContact[]));
            if (!data || data.length < pageSize) break;
          }
          if (isMounted) setContacts(entries);
        } else {
          const { data, error: queryError, count } = await supabase
            .from('tickets')
            .select('id, protocolo_origem, titulo, cliente, status, prioridade, departamento, criado_em', { count: 'exact' })
            .like('protocolo_origem', 'OS-%')
            .order('criado_em', { ascending: false })
            .range(0, 299);

          if (queryError) throw queryError;
          if (isMounted) {
            setTickets((data || []) as SupportTicket[]);
            setTicketTotal(count);
          }
        }
      } catch (loadError) {
        if (!isMounted) return;

        const detail = loadError instanceof Error ? loadError.message : 'Erro desconhecido';
        const message = department === 'financeiro'
          ? 'Não foi possível carregar os lançamentos financeiros'
          : department === 'comercial'
            ? 'Não foi possível carregar os contatos das lojas'
            : 'Não foi possível carregar as solicitações';
        setError(`${message}: ${detail}`);

        if (department === 'financeiro') setFinancialEntries([]);
        if (department === 'comercial') setContacts([]);
        if (department === 'analista') {
          setTickets([]);
          setTicketTotal(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [department, month, refreshKey]);

  const filteredContacts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return contacts;
    return contacts.filter((contact) =>
      contact.nome_loja.toLocaleLowerCase('pt-BR').includes(term),
    );
  }, [contacts, search]);

  const filteredTickets = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return tickets.filter((ticket) => {
      const closed = ['FINALIZADO', 'RESOLVIDO', 'FECHADO', 'CONCLUIDO', 'CANCELADO'].includes(
        (ticket.status || '').trim().toUpperCase(),
      );
      if (ticketStatus === 'abertos' && closed) return false;
      if (ticketStatus === 'finalizados' && !closed) return false;
      if (!term) return true;
      return `${ticket.protocolo_origem || ''} ${ticket.titulo || ''} ${ticket.cliente || ''}`
        .toLocaleLowerCase('pt-BR')
        .includes(term);
    });
  }, [tickets, search, ticketStatus]);

  const financialTotals = useMemo(() => {
    const services = financialEntries.reduce((total, item) => total + Number(item.valor_servico || 0), 0);
    const expenses = financialEntries.reduce((total, item) => total + Number(item.valor_despesas || 0), 0);
    const pending = financialEntries.filter((item) =>
      ['PENDENTE', 'ABERTO'].includes((item.status_faturamento || '').toUpperCase()),
    ).length;
    const settled = financialEntries.filter((item) =>
      ['PAGO', 'FATURADO'].includes((item.status_faturamento || '').toUpperCase()),
    ).length;
    return { services, expenses, total: services + expenses, pending, settled };
  }, [financialEntries]);

  const analystOpenCount = tickets.filter(
    (ticket) => !['FINALIZADO', 'RESOLVIDO', 'FECHADO', 'CONCLUIDO'].includes((ticket.status || '').toUpperCase()),
  ).length;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}>{copy.eyebrow}</span>
          <h1 className={styles.title}>{copy.title}</h1>
          <p className={styles.description}>{copy.description}</p>
        </div>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={() => setRefreshKey((current) => current + 1)}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? styles.spinning : undefined} />
          Atualizar
        </button>
      </header>

      {error && (
        <div className={styles.errorNotice} role="alert">
          <CircleAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      {department === 'financeiro' && (
        <>
          <div className={styles.toolbar}>
            <label className={styles.monthFilter}>
              <CalendarDays size={17} />
              <span>Período</span>
              <input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
            </label>
            <Link href={`/${lang}/os`} className={styles.secondaryLink}>
              <ClipboardList size={16} />
              Ver ordens de serviço
              <ArrowUpRight size={15} />
            </Link>
          </div>

          <section className={styles.metricGrid} aria-label="Resumo financeiro do período">
            <MetricCard label="Total registrado" value={loading ? '—' : formatCurrency(financialTotals.total)} icon={<Wallet size={19} />} />
            <MetricCard label="Serviços" value={loading ? '—' : formatCurrency(financialTotals.services)} icon={<ClipboardList size={19} />} />
            <MetricCard label="Despesas reembolsáveis" value={loading ? '—' : formatCurrency(financialTotals.expenses)} icon={<DollarSign size={19} />} />
            <MetricCard label="Pendentes de faturamento" value={loading ? '—' : String(financialTotals.pending)} icon={<CircleAlert size={19} />} />
          </section>

          <section className={styles.panel} aria-labelledby="finance-entries-title">
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>MOVIMENTAÇÕES</span>
                <h2 id="finance-entries-title" className={styles.panelTitle}>Lançamentos recentes</h2>
              </div>
              <span className={styles.resultCount}>{financialEntries.length} registros</span>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.dataTable}>
                <thead>
                  <tr><th>Ordem</th><th>Data</th><th>Serviço</th><th>Despesas</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableMessage columns={5} message="Carregando lançamentos..." />
                  ) : financialEntries.length === 0 ? (
                    <TableMessage columns={5} message="Nenhum lançamento registrado neste período." />
                  ) : financialEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        {entry.ticket_id ? (
                          <Link href={`/${lang}/os/${entry.ticket_id}`} className={styles.tableLink}>
                            #{entry.ticket_id.slice(0, 8)}
                          </Link>
                        ) : '—'}
                      </td>
                      <td>{formatDate(entry.criado_em)}</td>
                      <td>{formatCurrency(entry.valor_servico)}</td>
                      <td>{formatCurrency(entry.valor_despesas)}</td>
                      <td><span className={`${styles.statusBadge} ${statusClass(entry.status_faturamento)}`}>{entry.status_faturamento || 'Sem status'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {department === 'comercial' && (
        <>
          <section className={styles.metricGrid} aria-label="Resumo comercial">
            <MetricCard label="Contatos cadastrados" value={loading ? '—' : String(contacts.length)} icon={<Building2 size={19} />} />
            <MetricCard label="Lojas encontradas" value={loading ? '—' : String(filteredContacts.length)} icon={<Building2 size={19} />} />
          </section>
          <section className={styles.panel} aria-labelledby="store-contacts-title">
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>RELACIONAMENTO</span>
                <h2 id="store-contacts-title" className={styles.panelTitle}>Contatos de lojas</h2>
              </div>
              <div className={styles.searchField}>
                <Search size={16} />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar loja"
                  aria-label="Buscar loja"
                />
              </div>
            </div>
            <div className={styles.contactGrid}>
              {loading ? (
                <div className={styles.emptyState}>Carregando contatos...</div>
              ) : filteredContacts.length === 0 ? (
                <div className={styles.emptyState}>
                  {contacts.length ? 'Nenhuma loja corresponde à busca.' : 'Ainda não há contatos cadastrados.'}
                </div>
              ) : filteredContacts.map((contact) => (
                  <article className={styles.contactCard} key={contact.nome_loja}>
                    <span className={styles.contactIcon}><Building2 size={19} /></span>
                    <div className={styles.contactCopy}>
                      <h3>{contact.nome_loja}</h3>
                      <p>Cadastro comercial</p>
                    </div>
                  </article>
              ))}
            </div>
          </section>
        </>
      )}

      {department === 'analista' && (
        <>
          <section className={`${styles.metricGrid} ${styles.metricGridCompact}`} aria-label="Resumo de solicitações">
            <MetricCard label="Solicitações no sistema" value={loading ? '—' : ticketTotal === null ? 'Indisponível' : String(ticketTotal)} icon={<ClipboardList size={19} />} />
            <MetricCard label="Em aberto na seleção" value={loading ? '—' : String(analystOpenCount)} icon={<Headset size={19} />} />
            <MetricCard label="Encerradas na seleção" value={loading ? '—' : String(tickets.length - analystOpenCount)} icon={<CheckCircle2 size={19} />} />
          </section>
          <section className={styles.panel} aria-labelledby="analyst-tickets-title">
            <div className={styles.panelHeader}>
              <div>
                <span className={styles.sectionEyebrow}>FILA DE ATENDIMENTO</span>
                <h2 id="analyst-tickets-title" className={styles.panelTitle}>Solicitações</h2>
                <p className={styles.panelDescription}>Mostrando até as 300 solicitações mais recentes para manter a consulta rápida.</p>
              </div>
              <div className={styles.tableControls}>
                <label className={styles.statusFilter}>
                  <span className={styles.visuallyHidden}>Filtrar solicitações</span>
                  <select value={ticketStatus} onChange={(event) => setTicketStatus(event.target.value)}>
                    <option value="abertos">Em aberto</option>
                    <option value="finalizados">Encerrados</option>
                    <option value="todos">Todos os status</option>
                  </select>
                </label>
                <label className={styles.searchField}>
                  <Search size={16} />
                  <span className={styles.visuallyHidden}>Buscar solicitações</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar protocolo, título ou cliente"
                  />
                </label>
              </div>
            </div>
            <div className={styles.tableScroll}>
              <table className={styles.dataTable}>
                <thead>
                  <tr><th>Protocolo</th><th>Solicitação</th><th>Cliente</th><th>Departamento</th><th>Prioridade</th><th>Status</th><th>Ação</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableMessage columns={7} message="Carregando solicitações..." />
                  ) : filteredTickets.length === 0 ? (
                    <TableMessage columns={7} message={tickets.length ? 'Nenhuma solicitação corresponde aos filtros.' : 'Nenhuma solicitação disponível.'} />
                  ) : filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{ticket.protocolo_origem || `#${ticket.id.slice(0, 8)}`}</td>
                      <td>{ticket.titulo || 'Sem título'}</td>
                      <td>{ticket.cliente || '—'}</td>
                      <td>{ticket.departamento || '—'}</td>
                      <td>{ticket.prioridade || '—'}</td>
                      <td><span className={`${styles.statusBadge} ${statusClass(ticket.status)}`}>{ticket.status || 'Sem status'}</span></td>
                      <td>
                        <Link
                          href={`/${lang}/atendimento?ticket_id=${encodeURIComponent(ticket.id)}`}
                          className={styles.openTicketLink}
                        >
                          Abrir atendimento
                          <ArrowUpRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <article className={styles.metricCard}>
      <span className={styles.metricIcon}>{icon}</span>
      <div className={styles.metricCopy}>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

function TableMessage({ columns, message }: { columns: number; message: string }) {
  return <tr><td colSpan={columns} className={styles.tableMessage}>{message}</td></tr>;
}
