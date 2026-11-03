'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { ChevronLeft, MapPin, Clock, CheckCircle, Navigation, AlertTriangle, Trash2, Pause, Play } from 'lucide-react';
import FinalizarChamadoModal from '@/components/Tecnico/FinalizarChamadoModal';
import PausarChamadoModal from '@/components/Tecnico/PausarChamadoModal';
import ServiceReportSection from '@/components/Tecnico/ServiceReportSection';
import { ITicket, TicketEvidence } from '@/types/ticket';
import { getPauseReasonLabel } from '@/lib/tickets/pauseReasons';
import { getClientLogo } from '@/utils/clientLogo';
import styles from './OsDetail.module.css';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type ActivePause = {
  id: string;
  reason_code: string;
  description: string | null;
  contact_name: string;
  contact_role: string;
  expected_return_at: string;
  evidence_url: string;
  started_at: string;
  resumed_at: string | null;
};

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
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [activePause, setActivePause] = useState<ActivePause | null>(null);
  const [isResuming, setIsResuming] = useState(false);
  const [pauseNow, setPauseNow] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [distanciaAtual, setDistanciaAtual] = useState<number | null>(null);
  const [evidences, setEvidences] = useState<TicketEvidence[]>([]);
  const [attachments, setAttachments] = useState<NonNullable<ITicket['anexos']>>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(true);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [loadingEvidences, setLoadingEvidences] = useState(true);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);

  const watchId = useRef<number | null>(null);
  const routeWatchId = useRef<number | null>(null);
  const lastRoutePointSentAt = useRef(0);

  useEffect(() => {
    let isMounted = true;
    setLoadingAttachments(true);
    setAttachments([]);
    setAttachmentError(null);
    const loadAttachments = async () => {
      const { data, error } = await supabase
        .from('ticket_anexos')
        .select('id, url, nome_arquivo, tipo_arquivo, tamanho_bytes, created_at')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('Erro ao carregar anexos da OS:', error.message);
        if (isMounted) setAttachmentError('Não foi possível carregar os anexos. Atualize a tela para tentar novamente.');
        return;
      }
      if (isMounted) {
        setAttachments(data || []);
        setAttachmentError(null);
      }
    };
    void loadAttachments().finally(() => {
      if (isMounted) setLoadingAttachments(false);
    });
    return () => { isMounted = false; };
  }, [ticketId]);

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

  useEffect(() => {
    const pauseId = ticket?.pausa_atual_id;
    if (!pauseId) return;
    let active = true;
    void supabase.from('ticket_pauses').select('*').eq('id', pauseId).maybeSingle().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        setGeoError('Não foi possível carregar os dados da pausa.');
        return;
      }
      setActivePause(data as ActivePause | null);
    });
    return () => { active = false; };
  }, [ticket?.pausa_atual_id]);

  useEffect(() => {
    if (ticket?.status !== 'PAUSADO' || !activePause) return;
    const interval = window.setInterval(() => setPauseNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [ticket?.status, activePause]);

  useEffect(() => {
    if (ticket?.status !== 'PAUSADO' || activePause?.id !== ticket.pausa_atual_id || activePause?.reason_code !== 'COMPRA_MATERIAL') return;
    if (!navigator.geolocation) return;
    lastRoutePointSentAt.current = 0;
    routeWatchId.current = navigator.geolocation.watchPosition(async (position) => {
      if (Date.now() - lastRoutePointSentAt.current < 15000) return;
      lastRoutePointSentAt.current = Date.now();
      try {
        await fetch('/api/tecnico/pausas/localizacao', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ticket_id: ticket.id, pause_id: activePause.id,
            latitude: position.coords.latitude, longitude: position.coords.longitude,
          }),
        });
      } catch (routeError) {
        console.error('Não foi possível enviar a posição do trajeto:', routeError);
      }
    }, (error) => {
      if (error.code === error.PERMISSION_DENIED) setGeoError('A permissão de GPS foi removida; o trajeto não será atualizado até reativá-la.');
    }, { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 });
    return () => {
      if (routeWatchId.current !== null) navigator.geolocation.clearWatch(routeWatchId.current);
      routeWatchId.current = null;
    };
  }, [ticket?.id, ticket?.status, ticket?.pausa_atual_id, activePause]);

  // Watch position para check-out automático
  useEffect(() => {
    if (ticket?.check_in_at && ticket?.status === 'EM_ANDAMENTO') {
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

  const handlePauseCreated = (pause: ActivePause) => {
    setActivePause(pause);
    setTicket((current) => current ? { ...current, status: 'PAUSADO', pausa_atual_id: pause.id } : current);
    setShowPauseModal(false);
  };

  const handleResumeTicket = async () => {
    if (!ticket || isResuming) return;
    setIsResuming(true);
    setGeoError(null);
    try {
      let position: GeolocationPosition | null = null;
      if (activePause?.reason_code === 'COMPRA_MATERIAL' && navigator.geolocation) {
        position = await new Promise<GeolocationPosition | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 });
        });
      }
      const response = await fetch('/api/tecnico/retomar-chamado', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          latitude: position?.coords.latitude,
          longitude: position?.coords.longitude,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível retomar o chamado.');
      setTicket(result.ticket as ITicket);
      setActivePause(null);
    } catch (resumeError) {
      setGeoError(resumeError instanceof Error ? resumeError.message : 'Não foi possível retomar o chamado.');
    } finally {
      setIsResuming(false);
    }
  };

  if (loading) return <div className={styles.loadingContainer}>Sincronizando OS com Supabase...</div>;
  if (!ticket) return <div className={styles.loadingContainer}>OS não encontrada.</div>;

  const isCheckedIn = !!ticket.check_in_at;
  const isFinalized = ['FECHADO', 'RESOLVIDO', 'FINALIZADO', 'CONCLUIDO'].includes(ticket.status);
  const canEditMedia = ticket.status === 'EM_ANDAMENTO';
  const isPaused = ticket.status === 'PAUSADO';
  const currentPauseSeconds = isPaused && activePause
    ? Math.max(0, Math.floor((pauseNow - new Date(activePause.started_at).getTime()) / 1000))
    : 0;
  const totalSlaPausedSeconds = Number(ticket.sla_pausado_segundos || 0) + currentPauseSeconds;
  const pausedHours = Math.floor(totalSlaPausedSeconds / 3600);
  const pausedMinutes = Math.floor((totalSlaPausedSeconds % 3600) / 60);
  const clientLogo = getClientLogo(ticket.cliente);

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
          {ticket.cliente && (
            <div className={styles.clientIdentity}>
              {clientLogo ? (
                <Image
                  src={clientLogo}
                  alt={`Logo de ${ticket.cliente}`}
                  width={44}
                  height={44}
                  loading="lazy"
                  className={styles.clientLogo}
                />
              ) : (
                <span className={styles.clientLogoFallback} aria-hidden="true">
                  {ticket.cliente.trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className={styles.clientIdentityText}>
                <strong>{ticket.cliente}</strong>
                <span>Cliente</span>
              </span>
            </div>
          )}
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

        {isPaused && activePause && <section className={styles.pauseCard} aria-labelledby="pause-status-heading">
          <div className={styles.pauseCardHeading}>
            <h3 id="pause-status-heading"><Pause size={17} /> SLA pausado</h3>
            <strong>{pausedHours}h {pausedMinutes}min</strong>
          </div>
          <p className={styles.pauseReason}>{getPauseReasonLabel(activePause.reason_code)}</p>
          <p className={styles.pauseDetail}>O cronômetro ficará suspenso até a retomada do atendimento.</p>
          <dl className={styles.pauseDetails}>
            <div><dt>Responsável local</dt><dd>{activePause.contact_name} · {activePause.contact_role}</dd></div>
            <div><dt>Previsão de retorno</dt><dd>{new Date(activePause.expected_return_at).toLocaleString('pt-BR')}</dd></div>
          </dl>
          {activePause.description && <p className={styles.pauseDetail}>{activePause.description}</p>}
          {activePause.reason_code === 'COMPRA_MATERIAL' && <p className={styles.routeTrackingStatus} role="status">Rastreamento do trajeto ativo. Mantenha esta tela aberta e o GPS ligado.</p>}
        </section>}

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
        <section className={styles.cardSection} aria-labelledby="ticket-attachments-heading">
          <h3 id="ticket-attachments-heading" className={styles.sectionHeading}>Arquivos anexados ao chamado</h3>
          {loadingAttachments ? (
            <p className={styles.detailValue} role="status">Carregando arquivos anexados...</p>
          ) : attachmentError ? (
            <p className={styles.evidenceError} role="alert">{attachmentError}</p>
          ) : attachments.length > 0 ? (
            <ul className={styles.attachmentList}>
              {attachments.map((attachment) => (
                <li key={attachment.id} className={styles.attachmentItem}>
                  <a href={attachment.url} target="_blank" rel="noopener noreferrer" className={styles.attachmentLink}>
                    <span>{attachment.nome_arquivo}</span>
                    <span className={styles.attachmentAction}>Abrir arquivo</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : ticket.attachments?.length ? (
            <ul className={styles.attachmentList}>
              {ticket.attachments.map((url, index) => {
                let fileName = `Arquivo ${index + 1}`;
                try {
                  fileName = decodeURIComponent(new URL(url).pathname.split('/').pop() || fileName);
                } catch {
                  // Mantém o nome genérico quando a URL antiga não puder ser interpretada.
                }
                return (
                  <li key={`${url}-${index}`} className={styles.attachmentItem}>
                    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.attachmentLink}>
                      <span>{fileName}</span>
                      <span className={styles.attachmentAction}>Abrir arquivo</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.detailValue}>Nenhum arquivo anexado a esta OS.</p>
          )}
        </section>
        {isFinalized && <ServiceReportSection ticket={ticket} />}
      </div>

      <div className={styles.bottomBar}>
        {isFinalized ? (
          <Link href={`/${lang}/tecnico/historico`} className={styles.btnHistory}>
            <CheckCircle size={20} />
            Chamado finalizado · Voltar ao histórico
          </Link>
        ) : isPaused ? (
          <div className={styles.actionsContainer}>
            {geoError && <p className={styles.geoError} role="alert">{geoError}</p>}
            <button type="button" onClick={() => void handleResumeTicket()} disabled={isResuming} className={styles.btnResume}>
              <Play size={20} /> {isResuming ? 'Retomando...' : 'Retomar atendimento'}
            </button>
          </div>
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
                <button type="button" onClick={() => setShowPauseModal(true)} className={styles.btnPause}>
                  <Pause size={19} /> Pausar chamado
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
      {showPauseModal && ticket.status === 'EM_ANDAMENTO' && (
        <PausarChamadoModal
          ticketId={ticket.id}
          lang={lang}
          onClose={() => setShowPauseModal(false)}
          onSuccess={handlePauseCreated}
        />
      )}
    </div>
  );
}
