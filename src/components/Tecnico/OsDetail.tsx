'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { ChevronLeft, MapPin, Clock, CheckCircle, Navigation, AlertTriangle, Trash2 } from 'lucide-react';
import FinalizarChamadoModal from '@/components/Tecnico/FinalizarChamadoModal';
import ServiceReportSection from '@/components/Tecnico/ServiceReportSection';
import { ITicket, TicketEvidence } from '@/types/ticket';
import styles from './OsDetail.module.css';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

// Helper: Haversine distance em metros
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Raio da terra em metros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export default function OsDetail({ ticketId, lang }: { ticketId: string, lang: string }) {
  const router = useRouter();

  const [ticket, setTicket] = useState<ITicket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [distanciaAtual, setDistanciaAtual] = useState<number | null>(null);
  const [evidences, setEvidences] = useState<TicketEvidence[]>([]);
  const [loadingEvidences, setLoadingEvidences] = useState(true);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadEvidences = async () => {
      try {
        const { data, error } = await supabase
          .from('ticket_evidences')
          .select('*')
          .eq('ticket_id', ticketId)
          .order('created_at', { ascending: false });
        if (error) {
          console.error('Erro ao carregar evidências da OS:', error.message);
          if (isMounted) setEvidenceError('Não foi possível carregar as fotos desta ordem de serviço.');
          return;
        }
        if (isMounted) setEvidences(data as TicketEvidence[]);
      } finally {
        if (isMounted) setLoadingEvidences(false);
      }
    };
    void loadEvidences();
    const channel = supabase
      .channel(`tecnico_evidencias_${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_evidences', filter: `ticket_id=eq.${ticketId}` }, (payload) => {
        const evidence = payload.new as TicketEvidence;
        setEvidences((previous) => previous.some((item) => item.id === evidence.id) ? previous : [evidence, ...previous]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ticket_evidences', filter: `ticket_id=eq.${ticketId}` }, (payload) => {
        const removedId = String((payload.old as { id?: string }).id || '');
        setEvidences((previous) => previous.filter((item) => item.id !== removedId));
      })
      .subscribe();
    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [ticketId]);

  const deleteEvidence = async (evidence: TicketEvidence) => {
    if (!window.confirm('Excluir esta foto permanentemente?')) return;
    setDeletingEvidenceId(evidence.id);
    try {
      const response = await fetch('/api/tecnico/excluir-evidencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence_id: evidence.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível excluir a foto.');
      setEvidences((previous) => previous.filter((item) => item.id !== evidence.id));
      setEvidenceError(null);
    } catch (deleteError) {
      setEvidenceError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir a foto.');
    } finally {
      setDeletingEvidenceId(null);
    }
  };

  // Fetch Auth User
  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (error) {
        setGeoError(`Não foi possível verificar a sessão: ${error.message}`);
        return;
      }
      setCurrentUser(data.user);
    };
    void loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Supabase Realtime Listener
  useEffect(() => {
    const fetchInitial = async () => {
      const { data } = await supabase.from('tickets').select('*').eq('id', ticketId).like('protocolo_origem', 'OS-%').single();
      if (data) setTicket(data as ITicket);
      setLoading(false);
    };

    void fetchInitial();

    const channel = supabase.channel(`ticket_${ticketId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets', filter: `id=eq.${ticketId}` }, (payload) => {
        setTicket(payload.new as ITicket);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketId, supabase]);

  // Watch position para check-out automático
  useEffect(() => {
    if (ticket?.check_in_at && ticket?.status !== 'RESOLVIDO' && ticket?.status !== 'FECHADO') {
      if ('geolocation' in navigator && ticket.check_in_lat && ticket.check_in_lng) {
        watchId.current = navigator.geolocation.watchPosition(
          async (position) => {
            const dist = getDistanceFromLatLonInMeters(
              ticket.check_in_lat!,
              ticket.check_in_lng!,
              position.coords.latitude,
              position.coords.longitude
            );
            setDistanciaAtual(dist);

            if (dist > 500) {
              navigator.geolocation.clearWatch(watchId.current!);
              alert('Atenção: Você se afastou mais de 500m do local do Check-in. O chamado está sendo fechado automaticamente por segurança.');

              // Executa Finalização Automática Nativa
              await supabase.from('tickets').update({
                status: 'RESOLVIDO',
                resolucao: { autoFinalizado: true, dist: dist }
              }).eq('id', ticket.id);
              await supabase.from('ticket_transitions').insert({
                ticket_id: ticket.id,
                from_status: ticket.status,
                to_status: 'RESOLVIDO',
                reason: 'Auto-finalizado devido a distanciamento do local do check-in.'
              });
              router.replace(`/${lang}/tecnico/historico`);
            }
          },
          (err) => console.warn(err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [ticket?.check_in_at, ticket?.status, ticket?.check_in_lat, ticket?.check_in_lng, ticket?.id, lang, router]);

  const handleAcceptTicket = async () => {
    if (!currentUser) return;
    setIsAccepting(true);
    try {
      const response = await fetch('/api/tecnico/aceitar-chamado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket!.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível aceitar o chamado.');
      setTicket(result.ticket as ITicket);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao aceitar chamado.');
    } finally {
      setIsAccepting(false);
    }
  };

  const handleCheckIn = () => {
    if (!currentUser) {
      setGeoError('Você precisa estar logado para fazer check-in.');
      return;
    }

    const activeTicket = ticket;
    if (!activeTicket) {
      setGeoError('A ordem de serviço ainda está carregando. Tente novamente.');
      return;
    }

    setIsCheckingIn(true);
    setGeoError(null);
    setCheckInMessage('Solicitando sua localização GPS...');

    if (!window.isSecureContext) {
      setGeoError('O GPS exige uma conexão segura (HTTPS). Abra o sistema pelo endereço HTTPS.');
      setCheckInMessage(null);
      setIsCheckingIn(false);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Este navegador não oferece suporte à localização GPS.');
      setCheckInMessage(null);
      setIsCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setCheckInMessage('Localização obtida. Registrando o check-in nativamente...');

          const response = await fetch('/api/tecnico/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticket_id: activeTicket.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });

          const result = await response.json();
          if (!response.ok) throw new Error(result.error || 'Não foi possível registrar o check-in.');

          setTicket((current) => current ? {
            ...current,
            check_in_at: result.check_in_at,
            check_in_lat: result.latitude,
            check_in_lng: result.longitude,
            status: result.status || 'EM_ANDAMENTO',
          } : current);

          setCheckInMessage(null);
        } catch (err) {
          setGeoError(err instanceof Error ? err.message : 'Erro inesperado ao registrar o check-in.');
          setCheckInMessage(null);
        } finally {
          setIsCheckingIn(false);
        }
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Permissão de localização negada. Autorize o acesso ao GPS nas configurações do navegador.',
          2: 'Não foi possível obter sua localização. Verifique se o GPS está ativado e tente novamente.',
          3: 'A localização demorou demais. Verifique o sinal do GPS e tente novamente.',
        };
        setGeoError(messages[err.code] || 'Falha ao obter a localização. Tente novamente.');
        setCheckInMessage(null);
        setIsCheckingIn(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (loading) return <div className={styles.loadingContainer}>Sincronizando OS com Supabase...</div>;
  if (!ticket) return <div className={styles.loadingContainer}>OS não encontrada.</div>;

  const isCheckedIn = !!ticket.check_in_at;
  const isFinalized = ['FECHADO', 'RESOLVIDO', 'FINALIZADO', 'CONCLUIDO'].includes(ticket.status);
  const canEditMedia = ticket.status === 'EM_ANDAMENTO';

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.btnBack}>
          <ChevronLeft size={24} />
        </button>
        <h2 className={styles.headerTitle}>OS #{ticket.id.substring(0, 6).toUpperCase()}</h2>
      </header>

      <div className={styles.contentWrapper}>
        <div className={styles.titleSection}>
          <h2 className={styles.clientTitle}>{ticket.departamento}</h2>
          <p className={styles.ticketTitle}>
            {ticket.titulo}
          </p>
        </div>

        <div className={styles.cardSection}>
          <h3 className={styles.sectionHeading}>Detalhes do Serviço</h3>

          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <Clock size={18} color="#00d2ff" className={styles.detailIcon} />
              <div>
                <strong className={styles.detailLabel}>Abertura</strong>
                <span className={styles.detailValue}>
                  {ticket.criado_em ? new Date(ticket.criado_em).toLocaleString('pt-BR') : '-'}
                </span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <MapPin size={18} color="#00d2ff" className={styles.detailIcon} />
              <div>
                <strong className={styles.detailLabel}>Departamento / Categoria</strong>
                <span className={styles.detailValue}>{ticket.departamento} - {ticket.categoria}</span>
              </div>
            </div>
          </div>
        </div>

        <section className={styles.cardSection} aria-labelledby="ticket-compensation-heading">
          <h3 id="ticket-compensation-heading" className={styles.sectionHeading}>Valor deste chamado</h3>
          {ticket.valor_pagamento != null ? (
            <p className={styles.detailValue}>
              <strong>{ticket.modalidade_pagamento === 'diaria' ? 'Diária' : 'Por chamado'}:</strong>{' '}
              {Number(ticket.valor_pagamento).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          ) : (
            <p className={styles.detailValue}>Valor ainda não informado para este chamado.</p>
          )}
        </section>

        <section className={styles.cardSection} aria-labelledby="ticket-evidence-heading">
          <h3 id="ticket-evidence-heading" className={styles.sectionHeading}>Fotos do atendimento</h3>
          {evidenceError && <p className={styles.evidenceError} role="alert">{evidenceError}</p>}
          {loadingEvidences ? (
            <p className={styles.detailValue} role="status">Carregando fotos da OS...</p>
          ) : evidences.length === 0 ? (
            <p className={styles.detailValue}>Nenhuma foto enviada para esta OS.</p>
          ) : (
            <div className={styles.evidenceGrid}>
              {evidences.map((evidence) => (
                <figure key={evidence.id} className={styles.evidenceItem}>
                  <a href={evidence.media_url} target="_blank" rel="noopener noreferrer">
                    {/\.(mp4|webm)(?:[?#]|$)/i.test(evidence.media_url) ? <video src={evidence.media_url} aria-label="Vídeo antes do atendimento" width={112} height={84} controls preload="metadata" /> : <img src={evidence.media_url} alt={evidence.caption || (evidence.type === 'BEFORE' ? 'Foto antes do atendimento' : 'Foto após o atendimento')} width={320} height={200} loading="lazy" />}
                  </a>
                  <figcaption>{evidence.caption || (evidence.type === 'BEFORE' ? 'Antes do atendimento' : 'Após o atendimento')}</figcaption>
                  {canEditMedia && <button type="button" className={styles.evidenceDeleteButton} onClick={() => void deleteEvidence(evidence)} disabled={Boolean(deletingEvidenceId)}>
                    <Trash2 size={14} /> Excluir mídia
                  </button>}
                </figure>
              ))}
            </div>
          )}
        </section>

        {(ticket.categoria || ticket.causa_raiz || ticket.resolucao?.causaRaiz) && (
          <section className={styles.cardSection} aria-labelledby="problem-cause-heading">
            <h3 id="problem-cause-heading" className={styles.sectionHeading}>Classificação do problema</h3>
            <p className={styles.detailValue}><strong>Categoria:</strong> {ticket.categoria || 'Não informada'}</p>
            <p className={styles.detailValue}>
              <strong>Causa raiz:</strong> {ticket.causa_raiz || ticket.resolucao?.causaRaiz || 'Não informada'}
              {(ticket.causa_raiz_detalhe || ticket.resolucao?.causaRaizDetalhe) && ` — ${ticket.causa_raiz_detalhe || ticket.resolucao?.causaRaizDetalhe}`}
            </p>
          </section>
        )}

        {ticket.descricao && (
          <section className={styles.cardSection}>
            <h3 className={`${styles.sectionHeading} ${styles.sectionHeadingDesc}`}>Descrição Reportada</h3>
            <p className={styles.descText} dangerouslySetInnerHTML={{__html: ticket.descricao}}></p>
          </section>
        )}
        {isFinalized && <ServiceReportSection ticket={ticket} />}
      </div>

      <div className={styles.bottomBar}>
        {isFinalized ? (
          <Link href={`/${lang}/tecnico/historico`} className={styles.btnHistory}>
            <CheckCircle size={20} />
            Chamado finalizado · Voltar ao histórico
          </Link>
        ) : (
          <>
            {checkInMessage && <p className={styles.checkInMessage} role="status">{checkInMessage}</p>}
            {geoError && <p className={styles.geoError}>{geoError}</p>}

            {!ticket.tecnico_id ? (
              <button
                onClick={handleAcceptTicket}
                disabled={isAccepting}
                className={`${styles.btnCheckIn} ${isAccepting ? styles.btnCheckInDisabled : ''}`}>
                <CheckCircle size={22} />
                {isAccepting ? 'Aceitando...' : 'Aceitar Chamado'}
              </button>
            ) : !isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className={`${styles.btnCheckIn} ${isCheckingIn ? styles.btnCheckInDisabled : ''}`}>
                <Navigation size={22} />
                {isCheckingIn ? 'Obtendo localização...' : 'Check-in (Cheguei no local)'}
              </button>
            ) : (
              <div className={styles.actionsContainer}>
                {distanciaAtual !== null && (
                  <div className={styles.distanceInfo}>
                    {distanciaAtual > 400 ? <AlertTriangle size={14} color="#f59e0b" /> : <MapPin size={14} />}
                    Distância do check-in: {Math.round(distanciaAtual)}m
                  </div>
                )}
                <button
                  onClick={() => setShowModal(true)}
                  className={styles.btnFinalize}>
                  <CheckCircle size={22} />
                  Finalizar Chamado na Loja
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showModal && (
        <FinalizarChamadoModal
          ticket={ticket}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            router.replace(`/${lang}/tecnico/historico`);
          }}
        />
      )}
    </div>
  );
}
