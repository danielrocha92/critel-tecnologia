'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Calendar, ClipboardList } from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import styles from './historico.module.css';

const supabase = createClient();

type HistoryTicket = {
  id: string;
  cliente?: string | null;
  protocolo_origem?: string | null;
  titulo?: string | null;
  status: string;
  checkout_at?: string | null;
  atualizado_em?: string | null;
  criado_em?: string | null;
  resolucao?: { descricaoServicos?: string } | null;
};

export default function HistoricoPage() {
  const [tickets, setTickets] = useState<HistoryTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const lang = params.lang as string;

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .like('protocolo_origem', 'OS-%')
        .or(`tecnico_id.eq.${userData.user.id},analista_id.eq.${userData.user.id}`)
        .in('status', ['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO'])
        .order('atualizado_em', { ascending: false })
        .limit(50);

      if (error) console.error('Erro ao carregar serviços finalizados:', error);
      setTickets((data || []) as HistoryTicket[]);
      setLoading(false);
    };

    void fetchHistory();
  }, []);

  if (loading) {
    return <div className={styles.loadingContainer}>Carregando histórico...</div>;
  }

  return (
    <main className={styles.pageContainer}>
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}><ClipboardList size={15} /> Suas ordens de serviço</span>
          <h2 className={styles.title}>Serviços finalizados</h2>
          <p className={styles.subtitle}>Confira o resultado e os dados de cada atendimento concluído.</p>
        </div>
        <Link href={`/${lang}/tecnico/os`} className={styles.backLink}>Ver serviços em aberto</Link>
      </header>

      {tickets.length === 0 ? (
        <section className={styles.emptyState}>
          <Calendar size={42} className={styles.emptyIcon} aria-hidden="true" />
          <h2 className={styles.emptyTitle}>Nenhum serviço finalizado</h2>
          <p className={styles.emptySubtitle}>Os atendimentos concluídos aparecerão aqui.</p>
        </section>
      ) : (
        <section className={styles.ticketsList} aria-label="Lista de serviços finalizados">
          {tickets.map((ticket) => {
            const dateValue = ticket.checkout_at || ticket.atualizado_em || ticket.criado_em;
            const date = dateValue ? new Date(dateValue).toLocaleDateString('pt-BR') : 'Data não informada';

            return (
              <article key={ticket.id} className={styles.ticketCard}>
                <div className={styles.ticketStatusBorder} aria-hidden="true" />
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketIdentity}>
                    <strong className={styles.ticketClient}>{ticket.cliente || 'Cliente não informado'}</strong>
                    <span className={styles.ticketProtocol}>
                      OS {ticket.protocolo_origem || `#${ticket.id.slice(0, 8).toUpperCase()}`}
                    </span>
                  </div>
                  <span className={styles.ticketStatus}>
                    <CheckCircle size={14} /> {ticket.status === 'FECHADO' ? 'Encerrado' : 'Finalizado'}
                  </span>
                </div>

                <h2 className={styles.ticketTitle}>{ticket.titulo || 'Serviço técnico'}</h2>
                {ticket.resolucao?.descricaoServicos && (
                  <p className={styles.resolutionSummary}>{ticket.resolucao.descricaoServicos}</p>
                )}

                <div className={styles.ticketFooter}>
                  <span className={styles.ticketDate}><Calendar size={15} /> {date}</span>
                  <Link
                    href={`/${lang}/tecnico/os?ticket_id=${encodeURIComponent(ticket.id)}`}
                    className={styles.btnDetails}
                  >
                    Ver ordem de serviço
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
