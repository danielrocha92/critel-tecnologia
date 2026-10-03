import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { createClient } from '../utils/supabase/client';
import type { ITicket, IPerfil } from '../types/ticket';

const PAGE_SIZE = 250;
type TicketRealtimeRow = ITicket & { tomticket_id?: string | null } & Record<string, unknown>;
const supabase = createClient();

export function useCentralAtendimento() {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [perfis, setPerfis] = useState<IPerfil[]>([]);
  const [operadorAtual, setOperadorAtual] = useState<IPerfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMoreTickets, setLoadingMoreTickets] = useState(false);
  const [hasMoreTickets, setHasMoreTickets] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const loadInitialData = async () => {
      try {
        const [ticketResult, profilesResult, authResult] = await Promise.all([
          supabase
            .from('tickets')
            .select('*')
            .is('tomticket_id', null)
            .not('protocolo_origem', 'ilike', 'DEBUG-%')
            .order('criado_em', { ascending: false })
            .range(0, PAGE_SIZE - 1),
          supabase.from('perfis').select('id, nome, cargo, user_id, status').order('nome'),
          supabase.auth.getUser(),
        ]);

        if (!isMounted.current) return;
        if (ticketResult.error) throw ticketResult.error;
        setTickets((ticketResult.data || []) as ITicket[]);
        setHasMoreTickets((ticketResult.data || []).length === PAGE_SIZE);

        if (profilesResult.error) {
          setError(`Não foi possível carregar os perfis: ${profilesResult.error.message}`);
        } else {
          const profileRows = (profilesResult.data || []) as Array<IPerfil & { status: string }>;
          setPerfis(profileRows);

          if (!authResult.error && authResult.data.user) {
            const profile = profileRows.find(
              (item) => item.user_id === authResult.data.user.id && item.status === 'ATIVO',
            );
            if (profile) setOperadorAtual(profile);
          }
        }

        if (authResult.error) {
          setError(`Não foi possível verificar a sessão: ${authResult.error.message}`);
        }
      } catch (loadError) {
        if (!isMounted.current) return;
        const detail = loadError instanceof Error ? loadError.message : 'Erro desconhecido';
        setError(`Não foi possível carregar a Central de Atendimento: ${detail}`);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    void loadInitialData();

    const channel = supabase
      .channel('realtime_tickets_atendimento')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tickets' },
        (payload: RealtimePostgresChangesPayload<TicketRealtimeRow>) => {
        if (payload.eventType === 'DELETE') {
          const deletedId = String((payload.old as { id?: unknown }).id || '');
          setTickets((current) => current.filter((ticket) => ticket.id !== deletedId));
          return;
        }

        const ticket = payload.new as TicketRealtimeRow;
        if (ticket.tomticket_id || ticket.protocolo_origem?.toUpperCase().startsWith('DEBUG-')) {
          setTickets((current) => current.filter((item) => item.id !== ticket.id));
          return;
        }

        setTickets((current) => {
          const merged = [ticket, ...current.filter((item) => item.id !== ticket.id)];
          merged.sort((a, b) => new Date(b.criado_em || 0).getTime() - new Date(a.criado_em || 0).getTime());
          return merged.slice(0, Math.max(PAGE_SIZE, current.length));
        });
        },
      )
      .subscribe((status: string, subscriptionError?: Error) => {
        if (status === 'CHANNEL_ERROR' && isMounted.current) {
          setError(`A atualização em tempo real está indisponível: ${subscriptionError?.message || status}`);
        }
      });

    return () => {
      isMounted.current = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  const loadMoreTickets = useCallback(async () => {
    if (!hasMoreTickets || loadingMoreTickets) return;

    setLoadingMoreTickets(true);
    try {
      const { data, error: queryError } = await supabase
        .from('tickets')
        .select('*')
        .is('tomticket_id', null)
        .not('protocolo_origem', 'ilike', 'DEBUG-%')
        .order('criado_em', { ascending: false })
        .range(tickets.length, tickets.length + PAGE_SIZE - 1);

      if (queryError) throw queryError;
      setTickets((current) => {
        const existingIds = new Set(current.map((ticket) => ticket.id));
        return [...current, ...((data || []) as ITicket[]).filter((ticket) => !existingIds.has(ticket.id))];
      });
      setHasMoreTickets((data || []).length === PAGE_SIZE);
    } catch (loadError) {
      const detail = loadError instanceof Error ? loadError.message : 'Erro desconhecido';
      setError(`Não foi possível carregar mais solicitações: ${detail}`);
    } finally {
      setLoadingMoreTickets(false);
    }
  }, [hasMoreTickets, loadingMoreTickets, tickets.length]);

  return {
    tickets,
    perfis,
    operadorAtual,
    loading,
    error,
    hasMoreTickets,
    loadingMoreTickets,
    loadMoreTickets,
  };
}
