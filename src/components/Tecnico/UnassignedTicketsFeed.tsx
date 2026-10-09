'use client';

import { useEffect, useState } from 'react';
import { Check, MapPin } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import type { ITicket } from '@/types/ticket';
import { acceptTicket, TicketAcceptanceError } from '@/utils/tickets/acceptTicket';
import { getTicketAddress } from '@/utils/tickets/description';
import styles from './UnassignedTicketsFeed.module.css';

const closedStatuses = new Set(['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO', 'CANCELADO']);

function isAvailable(ticket: ITicket) {
  return Boolean(ticket.analista_id)
    && (!ticket.equipe_responsavel || ticket.equipe_responsavel === 'SUPORTE_TECNICO')
    && ticket.protocolo_origem?.toUpperCase().startsWith('OS-') === true
    && !ticket.tecnico_id
    && !closedStatuses.has(ticket.status.toUpperCase());
}

export default function UnassignedTicketsFeed({
  onAccepted,
}: {
  onAccepted: (ticket: ITicket) => void;
}) {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [acceptingIds, setAcceptingIds] = useState<Set<string>>(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const supabase = createClient();

    const loadTickets = async () => {
      const { data, error: queryError } = await supabase
        .from('tickets')
        .select('*')
        .not('analista_id', 'is', null)
        .is('tecnico_id', null)
        .like('protocolo_origem', 'OS-%')
        .not('status', 'in', '("RESOLVIDO","FECHADO","FINALIZADO","CONCLUIDO","CANCELADO")')
        .order('criado_em', { ascending: false });

      if (!isMounted) return;
      if (queryError) {
        setError('Não foi possível carregar a fila de chamados.');
      } else {
        const availableTickets = (data || []) as ITicket[];
        setTickets(availableTickets.filter(isAvailable));
      }
      setLoading(false);
    };

    void loadTickets();

    const channel = supabase
      .channel(`unassigned-tickets-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload: {
        eventType: string;
        new: Record<string, unknown>;
        old: Record<string, unknown>;
      }) => {
        if (!isMounted) return;
        if (payload.eventType === 'DELETE') {
          const deletedId = String(payload.old.id ?? '');
          setTickets((current) => current.filter((ticket) => ticket.id !== deletedId));
          return;
        }

        const updatedTicket = payload.new as unknown as ITicket;
        setTickets((current) => {
          if (!isAvailable(updatedTicket)) {
            return current.filter((ticket) => ticket.id !== updatedTicket.id);
          }
          return [updatedTicket, ...current.filter((ticket) => ticket.id !== updatedTicket.id)];
        });
      })
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const handleAccept = async (ticket: ITicket) => {
    setError(null);
    setTickets((current) => current.filter((item) => item.id !== ticket.id));
    setAcceptingIds((current) => new Set(current).add(ticket.id));

    try {
      const acceptedTicket = await acceptTicket(ticket.id);
      onAccepted(acceptedTicket);
    } catch (acceptError) {
      const isConflict = acceptError instanceof TicketAcceptanceError && acceptError.status === 409;
      if (!isConflict) {
        setTickets((current) => [ticket, ...current.filter((item) => item.id !== ticket.id)]);
      }
      setError(acceptError instanceof Error ? acceptError.message : 'Não foi possível aceitar este chamado.');
    } finally {
      setAcceptingIds((current) => {
        const next = new Set(current);
        next.delete(ticket.id);
        return next;
      });
    }
  };

  return (
    <section className={styles.feed} aria-labelledby="unassigned-tickets-title" aria-busy={loading}>
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Fila compartilhada</p>
          <h2 className={styles.title} id="unassigned-tickets-title">Chamados sem vínculo</h2>
        </div>
        <span className={styles.count} aria-label={`${tickets.length} chamados disponíveis`}>{tickets.length}</span>
      </header>

      {error && <p className={styles.error} role="alert">{error}</p>}
      {loading ? (
        <p className={styles.message} role="status">Carregando chamados disponíveis...</p>
      ) : tickets.length === 0 ? (
        <p className={styles.message}>Não há chamados sem vínculo no momento.</p>
      ) : (
        <ul className={styles.list}>
          {tickets.map((ticket) => {
            const address = getTicketAddress(ticket);
            const isAccepting = acceptingIds.has(ticket.id);

            return (
              <li key={ticket.id}>
                <article className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.identity}>
                      <strong>{ticket.cliente || 'Cliente não informado'}</strong>
                      <span>OS #{ticket.protocolo_origem || ticket.id.slice(0, 8)}</span>
                    </div>
                    <span className={styles.status}>{ticket.status}</span>
                  </div>
                  <h3 className={styles.ticketTitle}>{ticket.titulo || 'Chamado sem título'}</h3>
                  {address && (
                    <p className={styles.address}>
                      <MapPin size={15} aria-hidden="true" />
                      <span>{address}</span>
                    </p>
                  )}
                  <button
                    className={styles.acceptButton}
                    type="button"
                    onClick={() => void handleAccept(ticket)}
                    disabled={isAccepting}
                    aria-busy={isAccepting}
                  >
                    <Check size={17} aria-hidden="true" />
                    {isAccepting ? 'Aceitando...' : 'Aceitar chamado'}
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
