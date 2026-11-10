'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Calendar, CheckCircle, ClipboardList, Download, MapPin } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { getClientLogo } from '@/utils/clientLogo';
import { formatTicketDescription, getTicketAddress } from '@/utils/tickets/description';
import styles from './historico.module.css';

const supabase = createClient();
const CLOSED_STATUSES = ['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO'];

type Expense = { natureza?: string; valor?: number | string; valor_numerico?: number | string };

type HistoryTicket = {
  id: string;
  cliente?: string | null;
  protocolo_origem?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  status: string;
  categoria?: string | null;
  causa_raiz?: string | null;
  causa_raiz_detalhe?: string | null;
  endereco?: string | null;
  checkout_at?: string | null;
  atualizado_em?: string | null;
  criado_em?: string | null;
  check_in_at?: string | null;
  check_in_lat?: number | null;
  check_in_lng?: number | null;
  checkout_lat?: number | null;
  checkout_lng?: number | null;
  despesas_json?: Expense[] | null;
};

type ServiceReport = {
  ticket_id: string;
  hora_inicio: string | null;
  hora_termino: string | null;
  descricao_servicos: string | null;
  materiais_utilizados: string | null;
  latitude: number | null;
  longitude: number | null;
  criado_em: string | null;
};

type PrintableAttendance = {
  id: string;
  protocolo: string | null;
  cliente: string | null;
  email_cliente: string | null;
  endereco: string | null;
  titulo: string | null;
  descricao: string | null;
  status: string;
  categoria: string | null;
  prioridade: string | null;
  causa_raiz: string | null;
  causa_raiz_detalhe: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
  check_in_at: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  checkout_at: string | null;
  checkout_lat: number | null;
  checkout_lng: number | null;
  assinatura_datahora: string | null;
  hora_inicio: string | null;
  hora_termino: string | null;
  descricao_servicos: string | null;
  materiais_utilizados: string | null;
  despesas: Array<{ natureza: string; valor: number }>;
};

type PrintableReport = {
  tecnico: string;
  inicio: string;
  fim: string;
  atendimentos: PrintableAttendance[];
};

function saoPauloDate() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return {
    year: parts.find((part) => part.type === 'year')?.value || '',
    month: parts.find((part) => part.type === 'month')?.value || '',
    day: parts.find((part) => part.type === 'day')?.value || '',
  };
}

const businessDate = saoPauloDate();
const today = `${businessDate.year}-${businessDate.month}-${businessDate.day}`;
const monthStart = `${businessDate.year}-${businessDate.month}-01`;

function formatDate(value?: string | null) {
  if (!value) return 'Não informado';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Não informado' : date.toLocaleString('pt-BR');
}

function currency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function isValidCoordinate(latitude: number | null | undefined, longitude: number | null | undefined): latitude is number {
  return typeof latitude === 'number' && typeof longitude === 'number'
    && Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90 && longitude >= -180 && longitude <= 180;
}

function expensesTotal(expenses?: Expense[] | null) {
  return (expenses || []).reduce((sum, expense) => sum + Number(expense.valor_numerico ?? expense.valor ?? 0), 0);
}

function mapLink(latitude: number, longitude: number) {
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}

function locationText(latitude: number | null | undefined, longitude: number | null | undefined) {
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !isValidCoordinate(latitude, longitude)) {
    return 'Localização não registrada';
  }
  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export default function HistoricoPage() {
  const [tickets, setTickets] = useState<HistoryTicket[]>([]);
  const [reports, setReports] = useState<Record<string, ServiceReport>>({});
  const [loading, setLoading] = useState(true);
  const [historyError, setHistoryError] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(today);
  const [printReport, setPrintReport] = useState<PrintableReport | null>(null);
  const params = useParams();
  const lang = params.lang as string;

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!userData.user) return;

        const { data: profile, error: profileError } = await supabase
          .from('perfis')
          .select('id')
          .eq('user_id', userData.user.id)
          .maybeSingle();
        if (profileError) throw profileError;

        const technicianIds = [...new Set([userData.user.id, profile?.id].filter((id): id is string => Boolean(id)))];
        const { data, error } = await supabase
          .from('tickets')
          .select('id,cliente,protocolo_origem,titulo,descricao,status,categoria,causa_raiz,causa_raiz_detalhe,endereco,checkout_at,atualizado_em,criado_em,check_in_at,check_in_lat,check_in_lng,checkout_lat,checkout_lng,despesas_json')
          .like('protocolo_origem', 'OS-%')
          .in('tecnico_id', technicianIds)
          .in('status', CLOSED_STATUSES)
          .order('atualizado_em', { ascending: false })
          .limit(50);

        if (error) throw error;
        const rows = (data || []) as HistoryTicket[];
        setTickets(rows);

        if (rows.length) {
          const { data: serviceReports, error: reportsError } = await supabase
            .from('servicos_concluidos')
            .select('ticket_id,hora_inicio,hora_termino,descricao_servicos,materiais_utilizados,latitude,longitude,criado_em')
            .in('ticket_id', rows.map((ticket) => ticket.id))
            .order('criado_em', { ascending: false });
          if (reportsError) throw reportsError;

          const latestReports: Record<string, ServiceReport> = {};
          for (const report of (serviceReports || []) as ServiceReport[]) {
            if (!latestReports[report.ticket_id]) latestReports[report.ticket_id] = report;
          }
          setReports(latestReports);
        }
      } catch (error) {
        console.error('Erro ao carregar serviços finalizados:', error);
        setHistoryError('Não foi possível carregar o histórico de atendimentos.');
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, []);

  useEffect(() => {
    if (!printReport) return;
    const previousTitle = document.title;
    document.title = `Relatório de atendimentos ${printReport.inicio} a ${printReport.fim}`;
    const finishPrint = () => {
      document.title = previousTitle;
      setPrintReport(null);
    };
    window.addEventListener('afterprint', finishPrint);
    const timeout = window.setTimeout(() => window.print(), 100);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener('afterprint', finishPrint);
    };
  }, [printReport]);

  const generateReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportError('');
    if (startDate > endDate) {
      setReportError('A data inicial deve ser anterior ou igual à data final.');
      return;
    }

    setReportLoading(true);
    try {
      const query = new URLSearchParams({ inicio: startDate, fim: endDate });
      const response = await fetch(`/api/tecnico/relatorio-atendimentos?${query}`, { cache: 'no-store' });
      const result = await response.json() as PrintableReport & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Não foi possível gerar o relatório.');
      setPrintReport(result);
    } catch (error) {
      setReportError(error instanceof Error ? error.message : 'Não foi possível gerar o relatório.');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Carregando histórico...</div>;
  }

  return (
    <main className={styles.pageContainer}>
      <div className={styles.screenContent}>
        <header className={styles.pageHeader}>
          <div>
            <span className={styles.eyebrow}><ClipboardList size={15} /> Suas ordens de serviço</span>
            <h1 className={styles.title}>Serviços finalizados</h1>
            <p className={styles.subtitle}>Confira os detalhes dos atendimentos concluídos ou gere um relatório em PDF por período.</p>
          </div>
          <Link href={`/${lang}/tecnico/os`} className={styles.backLink}>Ver serviços em aberto</Link>
        </header>

        <form className={styles.reportForm} onSubmit={(event) => void generateReport(event)}>
          <div className={styles.reportFormIntro}>
            <h2>Relatório de atendimentos</h2>
            <p>O PDF inclui os dados, laudos, horários, localizações e despesas, sem fotos, vídeos ou assinaturas.</p>
          </div>
          <label>De
            <input type="date" value={startDate} max={endDate} required onChange={(event) => setStartDate(event.target.value)} />
          </label>
          <label>Até
            <input type="date" value={endDate} min={startDate} max={today} required onChange={(event) => setEndDate(event.target.value)} />
          </label>
          <button type="submit" className={styles.reportButton} disabled={reportLoading}>
            <Download size={17} /> {reportLoading ? 'Preparando relatório...' : 'Gerar PDF'}
          </button>
          {reportError && <p className={styles.reportError} role="alert">{reportError}</p>}
        </form>

        {historyError ? (
          <p className={styles.historyError} role="alert">{historyError}</p>
        ) : tickets.length === 0 ? (
          <section className={styles.emptyState}>
            <Calendar size={42} className={styles.emptyIcon} aria-hidden="true" />
            <h2 className={styles.emptyTitle}>Nenhum serviço finalizado</h2>
            <p className={styles.emptySubtitle}>Os atendimentos concluídos aparecerão aqui.</p>
          </section>
        ) : (
          <section className={styles.ticketsList} aria-label="Lista de serviços finalizados">
            {tickets.map((ticket) => {
              const dateValue = ticket.checkout_at || ticket.atualizado_em || ticket.criado_em;
              const clientLogo = getClientLogo(ticket.cliente);
              const report = reports[ticket.id];
              const latitude = ticket.checkout_lat ?? report?.latitude;
              const longitude = ticket.checkout_lng ?? report?.longitude;
              const address = getTicketAddress(ticket);
              const requestDescription = formatTicketDescription(ticket.descricao).text;

              return (
                <article key={ticket.id} className={styles.ticketCard}>
                  <div className={styles.ticketStatusBorder} aria-hidden="true" />
                  <div className={styles.ticketHeader}>
                    <div className={styles.ticketIdentity}>
                      {clientLogo ? (
                        <Image
                          src={clientLogo}
                          alt={`Logo de ${ticket.cliente}`}
                          width={40}
                          height={40}
                          loading="lazy"
                          className={styles.clientLogo}
                        />
                      ) : (
                        <span className={styles.clientLogoFallback} aria-hidden="true">
                          {(ticket.cliente || 'C').trim().charAt(0).toUpperCase()}
                        </span>
                      )}
                      <strong className={styles.ticketClient}>{ticket.cliente || 'Cliente não informado'}</strong>
                      <span className={styles.ticketProtocol}>OS {ticket.protocolo_origem || `#${ticket.id.slice(0, 8).toUpperCase()}`}</span>
                    </div>
                    <span className={styles.ticketStatus}>
                      <CheckCircle size={14} /> {ticket.status === 'FECHADO' ? 'Encerrado' : 'Finalizado'}
                    </span>
                  </div>

                  <h2 className={styles.ticketTitle}>{ticket.titulo || 'Serviço técnico'}</h2>
                  <dl className={styles.ticketDetails}>
                    <div><dt>Data do atendimento</dt><dd>{formatDate(dateValue)}</dd></div>
                    <div><dt>Endereço</dt><dd>{address || 'Não informado'}</dd></div>
                    {report?.descricao_servicos && (
                      <div className={styles.detailWide}>
                        <dt>Serviço executado</dt>
                        <dd className={styles.descriptionSummary}>{report.descricao_servicos}</dd>
                      </div>
                    )}
                  </dl>

                  <details className={styles.moreDetails}>
                    <summary>Mais detalhes do atendimento</summary>
                    <dl className={styles.ticketDetails}>
                      {requestDescription && <div className={styles.detailWide}><dt>Solicitação</dt><dd>{requestDescription}</dd></div>}
                      {(ticket.categoria || ticket.causa_raiz || ticket.causa_raiz_detalhe) && (
                        <div><dt>Categoria / causa</dt><dd>{[ticket.categoria, ticket.causa_raiz, ticket.causa_raiz_detalhe].filter(Boolean).join(' · ')}</dd></div>
                      )}
                      {ticket.check_in_at && <div><dt>Horário do check-in</dt><dd>{formatDate(ticket.check_in_at)}</dd></div>}
                      {report?.hora_inicio && <div><dt>Início do serviço</dt><dd>{formatDate(report.hora_inicio)}</dd></div>}
                      {report?.hora_termino && <div><dt>Término do serviço</dt><dd>{formatDate(report.hora_termino)}</dd></div>}
                      <div><dt>Localização do encerramento</dt><dd>
                        {isValidCoordinate(latitude, longitude) && latitude != null && longitude != null ? (
                          <a href={mapLink(latitude, longitude)} target="_blank" rel="noopener noreferrer">
                            <MapPin size={14} /> {locationText(latitude, longitude)}
                          </a>
                        ) : 'Não registrada'}
                      </dd></div>
                      <div><dt>Localização do check-in</dt><dd>
                        {isValidCoordinate(ticket.check_in_lat, ticket.check_in_lng) && ticket.check_in_lat != null && ticket.check_in_lng != null ? (
                          <a href={mapLink(ticket.check_in_lat, ticket.check_in_lng)} target="_blank" rel="noopener noreferrer">
                            <MapPin size={14} /> {locationText(ticket.check_in_lat, ticket.check_in_lng)}
                          </a>
                        ) : 'Não registrada'}
                      </dd></div>
                      {report?.materiais_utilizados && <div className={styles.detailWide}><dt>Materiais utilizados</dt><dd>{report.materiais_utilizados}</dd></div>}
                      {ticket.despesas_json?.length ? (
                        <div><dt>Despesas registradas</dt><dd>{currency(expensesTotal(ticket.despesas_json))}</dd></div>
                      ) : null}
                    </dl>
                  </details>

                  <div className={styles.ticketFooter}>
                    <span className={styles.ticketDate}><Calendar size={15} /> {dateValue ? new Date(dateValue).toLocaleDateString('pt-BR') : 'Data não informada'}</span>
                    <Link href={`/${lang}/tecnico/os?ticket_id=${encodeURIComponent(ticket.id)}`} className={styles.btnDetails}>
                      Ver ordem de serviço
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {printReport && (
        <section className={styles.printReport} aria-label="Relatório de atendimentos para impressão">
          <header className={styles.printHeader}>
            <h1>Relatório de atendimentos</h1>
            <p><strong>Técnico:</strong> {printReport.tecnico}</p>
            <p><strong>Período:</strong> {new Date(`${printReport.inicio}T00:00:00`).toLocaleDateString('pt-BR')} a {new Date(`${printReport.fim}T00:00:00`).toLocaleDateString('pt-BR')}</p>
            <p><strong>Atendimentos:</strong> {printReport.atendimentos.length}</p>
          </header>
          {printReport.atendimentos.length === 0 ? (
            <p>Nenhum atendimento concluído encontrado no período selecionado.</p>
          ) : printReport.atendimentos.map((attendance, index) => (
            <article key={attendance.id} className={styles.printTicket}>
              <h2>{index + 1}. OS {attendance.protocolo || attendance.id.slice(0, 8)} — {attendance.cliente || 'Cliente não informado'}</h2>
              <dl>
                <div><dt>Título</dt><dd>{attendance.titulo || 'Não informado'}</dd></div>
                <div><dt>Status</dt><dd>{attendance.status}</dd></div>
                <div><dt>Categoria / prioridade</dt><dd>{[attendance.categoria, attendance.prioridade].filter(Boolean).join(' · ') || 'Não informado'}</dd></div>
                <div><dt>Endereço</dt><dd>{attendance.endereco || 'Não informado'}</dd></div>
                <div><dt>Contato do cliente</dt><dd>{attendance.email_cliente || 'Não informado'}</dd></div>
                <div><dt>Solicitação</dt><dd>{attendance.descricao || 'Não informado'}</dd></div>
                <div><dt>Causa raiz</dt><dd>{[attendance.causa_raiz, attendance.causa_raiz_detalhe].filter(Boolean).join(' — ') || 'Não informada'}</dd></div>
                <div><dt>Check-in</dt><dd>{formatDate(attendance.check_in_at)} · {locationText(attendance.check_in_lat, attendance.check_in_lng)}</dd></div>
                <div><dt>Encerramento</dt><dd>{formatDate(attendance.checkout_at)} · {locationText(attendance.checkout_lat, attendance.checkout_lng)}</dd></div>
                <div><dt>Horário inicial / final</dt><dd>{formatDate(attendance.hora_inicio)} / {formatDate(attendance.hora_termino)}</dd></div>
                <div><dt>Serviços executados</dt><dd>{attendance.descricao_servicos || 'Não informado'}</dd></div>
                <div><dt>Materiais utilizados</dt><dd>{attendance.materiais_utilizados || 'Não informado'}</dd></div>
                <div><dt>Assinatura registrada em</dt><dd>{formatDate(attendance.assinatura_datahora)}</dd></div>
                <div><dt>Despesas</dt><dd>{attendance.despesas.length
                  ? attendance.despesas.map((expense) => `${expense.natureza}: ${currency(expense.valor)}`).join(' · ')
                  : 'Nenhuma despesa registrada'}</dd></div>
              </dl>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
