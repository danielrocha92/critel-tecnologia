'use client';

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Clock3,
  CircleDot,
  DollarSign,
  RefreshCw,
  Search,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import NovoChamadoModal from '@/components/Chamados/NovoChamadoModal';
import { getTicketTeamLabel } from '@/lib/tickets/problemCatalog';
import styles from './DepartmentEnvironment.module.css';

type Department = 'comercial' | 'analista';

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
  equipe_responsavel: string | null;
  criado_em: string | null;
};

type AnalystStatusCounts = {
  open: number | null;
  inProgress: number | null;
  finalized: number | null;
  pendingApproval: number | null;
};

const departmentLabels: Record<Department, { title: string; description: string; eyebrow: string }> = {
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

export default function DepartmentEnvironment({
  department,
  openCreateTicket = false,
}: {
  department: Department;
  openCreateTicket?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split('/')[1] || 'pt';
  const [contacts, setContacts] = useState<StoreContact[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [analystStatusCounts, setAnalystStatusCounts] = useState<AnalystStatusCounts>({
    open: null, inProgress: null, finalized: null, pendingApproval: null,
  });
  const [search, setSearch] = useState('');
  const [ticketStatus, setTicketStatus] = useState('abertos');
  const panelRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(openCreateTicket);
  const copy = departmentLabels[department];

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      try {
        if (department === 'comercial') {
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
          const [ticketsResult, openResult, progressResult, finalizedResult, approvalResult] = await Promise.all([
            supabase
              .from('tickets')
              .select('id, protocolo_origem, titulo, cliente, status, prioridade, departamento, equipe_responsavel, criado_em')
              .like('protocolo_origem', 'OS-%')
              .order('criado_em', { ascending: false })
              .range(0, 299),
            supabase.from('tickets').select('id', { count: 'exact', head: true }).like('protocolo_origem', 'OS-%').in('status', ['FILA', 'NOVO']),
            supabase.from('tickets').select('id', { count: 'exact', head: true }).like('protocolo_origem', 'OS-%').in('status', ['ABERTO', 'EM_ANDAMENTO']),
            supabase.from('tickets').select('id', { count: 'exact', head: true }).like('protocolo_origem', 'OS-%').in('status', ['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO']),
            supabase.from('tickets').select('id', { count: 'exact', head: true }).like('protocolo_origem', 'OS-%').eq('status', 'FINALIZADO').is('financeiro_aprovado_em', null),
          ]);

          if (ticketsResult.error) throw ticketsResult.error;
          if (isMounted) {
            setTickets((ticketsResult.data || []) as SupportTicket[]);
            setAnalystStatusCounts({
              open: openResult.error ? null : openResult.count,
              inProgress: progressResult.error ? null : progressResult.count,
              finalized: finalizedResult.error ? null : finalizedResult.count,
              pendingApproval: approvalResult.error ? null : approvalResult.count,
            });
            const countErrors = [openResult.error, progressResult.error, finalizedResult.error, approvalResult.error].filter(Boolean);
            if (countErrors.length) setError(`Alguns totais não puderam ser carregados: ${countErrors.map((item) => item?.message).join('; ')}`);
          }
        }
      } catch (loadError) {
        if (!isMounted) return;

        const detail = loadError instanceof Error ? loadError.message : 'Erro desconhecido';
        const message = department === 'comercial'
            ? 'Não foi possível carregar os contatos das lojas'
            : 'Não foi possível carregar as solicitações';
        setError(`${message}: ${detail}`);

        if (department === 'comercial') setContacts([]);
        if (department === 'analista') {
          setTickets([]);
          setAnalystStatusCounts({ open: null, inProgress: null, finalized: null, pendingApproval: null });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadData();
    return () => {
      isMounted = false;
    };
  }, [department, refreshKey]);

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
      const status = (ticket.status || '').trim().toUpperCase();
      if (ticketStatus === 'abertos' && !['FILA', 'NOVO'].includes(status)) return false;
      if (ticketStatus === 'andamento' && !['ABERTO', 'EM_ANDAMENTO'].includes(status)) return false;
      if (ticketStatus === 'finalizados' && !closed) return false;
      if (!term) return true;
      return `${ticket.protocolo_origem || ''} ${ticket.titulo || ''} ${ticket.cliente || ''}`
        .toLocaleLowerCase('pt-BR')
        .includes(term);
    });
  }, [tickets, search, ticketStatus]);

  const scrollToPanel = () => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

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

      {department === 'comercial' && (
        <>
          <section className={styles.metricGrid} aria-label="Resumo comercial">
            <MetricCard label="Contatos cadastrados" value={loading ? '—' : String(contacts.length)} icon={<Building2 size={19} />} onClick={() => { setSearch(''); scrollToPanel(); }} />
            <MetricCard label="Lojas encontradas" value={loading ? '—' : String(filteredContacts.length)} icon={<Building2 size={19} />} onClick={() => { scrollToPanel(); searchInputRef.current?.focus({ preventScroll: true }); }} />
          </section>
          <section className={styles.panel} aria-labelledby="store-contacts-title" ref={panelRef}>
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
                  ref={searchInputRef}
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
            <MetricCard label="Chamados em Aberto" value={loading ? '—' : String(analystStatusCounts.open ?? '—')} icon={<CircleDot size={19} />} onClick={() => { setTicketStatus('abertos'); scrollToPanel(); }} active={ticketStatus === 'abertos'} />
            <MetricCard label="Em Andamento" value={loading ? '—' : String(analystStatusCounts.inProgress ?? '—')} icon={<Clock3 size={19} />} onClick={() => { setTicketStatus('andamento'); scrollToPanel(); }} active={ticketStatus === 'andamento'} />
            <MetricCard label="Finalizados" value={loading ? '—' : String(analystStatusCounts.finalized ?? '—')} icon={<CheckCircle2 size={19} />} onClick={() => { setTicketStatus('finalizados'); scrollToPanel(); }} active={ticketStatus === 'finalizados'} />
            <MetricCard label="Pendente de Validação (Financeiro)" value={loading ? '—' : String(analystStatusCounts.pendingApproval ?? '—')} icon={<DollarSign size={19} />} onClick={() => router.push(`/${lang}/financeiro?filter=pendingValidation`)} />
          </section>
          <section className={styles.panel} aria-labelledby="analyst-tickets-title" ref={panelRef}>
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
                    <option value="abertos">Chamados em aberto</option>
                    <option value="andamento">Em andamento</option>
                    <option value="finalizados">Finalizados</option>
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
                  <tr><th>Protocolo</th><th>Solicitação</th><th>Cliente</th><th>Equipe / Departamento</th><th>Prioridade</th><th>Status</th><th>Ação</th></tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableMessage columns={7} message="Carregando solicitações..." />
                  ) : filteredTickets.length === 0 ? (
                    <TableMessage columns={7} message={tickets.length ? 'Nenhuma solicitação corresponde aos filtros.' : 'Nenhuma solicitação disponível.'} />
                  ) : filteredTickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td data-label="Protocolo">{ticket.protocolo_origem || `#${ticket.id.slice(0, 8)}`}</td>
                      <td data-label="Solicitação">{ticket.titulo || 'Sem título'}</td>
                      <td data-label="Cliente">{ticket.cliente || '—'}</td>
                      <td data-label="Equipe / Departamento">{getTicketTeamLabel(ticket.equipe_responsavel === null ? 'SUPORTE_TECNICO' : ticket.equipe_responsavel)}{ticket.departamento ? ` · ${ticket.departamento}` : ''}</td>
                      <td data-label="Prioridade">{ticket.prioridade || '—'}</td>
                      <td data-label="Status"><span className={`${styles.statusBadge} ${statusClass(ticket.status)}`}>{ticket.status || 'Sem status'}</span></td>
                      <td data-label="Ação">
                        <Link
                          href={`/${lang}/os/${encodeURIComponent(ticket.id)}`}
                          className={styles.openTicketLink}
                        >
                          Abrir chamado
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
      {department === 'analista' && isNewTicketOpen && (
        <NovoChamadoModal
          onClose={() => {
            setIsNewTicketOpen(false);
            router.replace(`/${lang}/analista`);
          }}
          onSuccess={() => {
            setIsNewTicketOpen(false);
            setRefreshKey((current) => current + 1);
            router.replace(`/${lang}/analista`);
          }}
        />
      )}
    </div>
  );
}

function MetricCard({ label, value, icon, onClick, active = false }: { label: string; value: string; icon: ReactNode; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" className={`${styles.metricCard} ${active ? styles.metricCardActive : ''}`} onClick={onClick} aria-pressed={active}>
      <span className={styles.metricIcon}>{icon}</span>
      <div className={styles.metricCopy}>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </button>
  );
}

function TableMessage({ columns, message }: { columns: number; message: string }) {
  return <tr className={styles.tableMessageRow}><td colSpan={columns} className={styles.tableMessage}>{message}</td></tr>;
}
