'use client';

import { useEffect, useState, Suspense } from 'react';
import Image from 'next/image';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '../../../../utils/supabase/client';
import { useCentralAtendimento } from '../../../../hooks/useCentralAtendimento';
import styles from './atendimento.module.css';
import { User, Trash2, Printer, Pencil, History, X, ArrowLeft, ChevronDown, Pause, Play } from 'lucide-react';
import { DashboardTickets } from '../../../../components/Chamados/DashboardTickets';
import NovoChamadoModal from '../../../../components/Chamados/NovoChamadoModal';
import { ITicket, ITicketReply, TicketEvidence } from '../../../../types/ticket';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { File, Download } from 'lucide-react';
import ServiceReportSection from '@/components/Tecnico/ServiceReportSection';
import HistoricoPausasOS from '@/components/Tecnico/HistoricoPausasOS';
import PausarChamadoModal from '@/components/Tecnico/PausarChamadoModal';
import FinalizarChamadoModal from '@/components/Tecnico/FinalizarChamadoModal';
import { getClientLogo } from '@/utils/clientLogo';

const supabase = createClient();

type TicketAttachment = {
  url: string;
  nome_arquivo: string;
  tamanho_bytes?: number | null;
};

type TicketReplyRealtimeRow = Record<string, unknown> & {
  id: string;
  sender_type: 'customer' | 'agent' | 'system';
  sender: string;
  message: string;
  criado_em: string;
};

export default function CentralAtendimento({
  ticketId,
  openCreateTicket = false,
}: {
  ticketId?: string;
  openCreateTicket?: boolean;
}) {
  return (
    <Suspense fallback={<div className={styles.loadingEmpty}>Carregando chamados...</div>}>
      <CentralAtendimentoContent routeTicketId={ticketId} openCreateTicket={openCreateTicket} />
    </Suspense>
  );
}

function CentralAtendimentoContent({
  routeTicketId,
  openCreateTicket,
}: {
  routeTicketId?: string;
  openCreateTicket: boolean;
}) {
  const {
    tickets,
    perfis,
    operadorAtual,
    loading,
    error: ticketsError,
    hasMoreTickets,
    loadingMoreTickets,
    loadMoreTickets,
  } = useCentralAtendimento();

  const searchParams = useSearchParams();
  const [ticketAtivo, setTicketAtivo] = useState<ITicket | null>(null);
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(openCreateTicket);
  const [isMaisDropdownOpen, setIsMaisDropdownOpen] = useState(false);
  const safeDateValue = (value?: string | number | Date | null) => {
    if (value === undefined || value === null || value === '') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const [anexos, setAnexos] = useState<TicketAttachment[]>([]);
  const [evidences, setEvidences] = useState<TicketEvidence[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPauseModalOpen, setIsPauseModalOpen] = useState(false);
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);
  const [isTransitionLogOpen, setIsTransitionLogOpen] = useState(false);
  const [transitionLog, setTransitionLog] = useState<Array<Record<string, unknown>>>([]);
  const [isLoadingTransitionLog, setIsLoadingTransitionLog] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [activePause, setActivePause] = useState<{ id: string; reason_code: string } | null>(null);
  const [ticketHistory, setTicketHistory] = useState<ITicketReply[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null);

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
      toast.success('Foto excluída.');
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir a foto.');
    } finally {
      setDeletingEvidenceId(null);
    }
  };

  const getAtendenteNome = (id: string | null | undefined) => {
    if (!id) return 'Sem Atendente Vinculado';
    const p = perfis.find(p => String(p.id) === String(id) || String(p.user_id) === String(id));
    return p ? `${p.nome} - Critel Tecnologia` : 'Alocado';
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setSelectedImage((target as HTMLImageElement).src);
    } else if (target.tagName === 'A' && target.getAttribute('href')?.match(/\.(jpeg|jpg|gif|png)$/i)) {
      e.preventDefault();
      setSelectedImage(target.getAttribute('href')!);
    }
  };

  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split('/')[1] || 'pt';
  const activeFilter = pathname.includes('/my-tickets/opened')
    ? 'abertos'
    : pathname.includes('/my-tickets/closed')
      ? 'finalizados'
      : searchParams.get('filter') || 'todos';
  const isMeus = pathname.includes('/my-tickets')
    ? true
    : pathname.includes('/all-tickets')
      ? false
      : searchParams.get('meus') === 'true';
  const cargoAtual = operadorAtual?.cargo?.trim().toUpperCase().replace('É', 'E');
  const canCreateTicket = cargoAtual === 'ADMIN' || cargoAtual === 'SUPER_ADMIN' || cargoAtual === 'ANALISTA';
  const isTechnician = cargoAtual === 'TECNICO';
  const canDeleteTicket = cargoAtual === 'ADMIN' || cargoAtual === 'SUPER_ADMIN';
  const isAssignedTechnician = Boolean(isTechnician && ticketAtivo?.tecnico_id
    && (ticketAtivo.tecnico_id === operadorAtual?.user_id || ticketAtivo.tecnico_id === operadorAtual?.id));
  const canCancelTicket = canCreateTicket || isAssignedTechnician;
  const canViewPauseRoute = ['ANALISTA', 'ADMIN', 'SUPER_ADMIN'].includes(cargoAtual || '');
  const handleBackToTickets = () => {
    if (routeTicketId) {
      router.push(`/${lang}/os`);
      return;
    }
    setAnexos([]);
    setEvidences([]);
    setTicketAtivo(null);
  };

  useEffect(() => {
    const pauseId = ticketAtivo?.pausa_atual_id;
    if (!pauseId) return;
    let active = true;
    void supabase.from('ticket_pauses').select('id,reason_code').eq('id', pauseId).maybeSingle().then((result: { data: { id: string; reason_code: string } | null }) => {
      if (active) setActivePause(result.data);
    });
    return () => { active = false; };
  }, [ticketAtivo?.pausa_atual_id]);

  const handlePauseCreated = (pause: { id: string; reason_code: string }) => {
    if (!ticketAtivo) return;
    setActivePause(pause);
    setTicketAtivo({ ...ticketAtivo, status: 'PAUSADO', pausa_atual_id: pause.id });
    setIsPauseModalOpen(false);
    setIsMaisDropdownOpen(false);
    toast.success('Chamado pausado e SLA suspenso.');
  };

  const handleResumeTicket = async () => {
    if (!ticketAtivo) return;
    let position: GeolocationPosition | null = null;
    if (activePause?.reason_code === 'COMPRA_MATERIAL' && navigator.geolocation) {
      position = await new Promise<GeolocationPosition | null>((resolve) => {
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
      });
    }
    try {
      const response = await fetch('/api/tecnico/retomar-chamado', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketAtivo.id, latitude: position?.coords.latitude, longitude: position?.coords.longitude }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível retomar o chamado.');
      setTicketAtivo({ ...ticketAtivo, ...result.ticket, status: 'EM_ANDAMENTO', pausa_atual_id: null });
      setActivePause(null);
      setIsMaisDropdownOpen(false);
      toast.success('Atendimento retomado; o SLA voltou a contar.');
    } catch (resumeError) {
      toast.error(resumeError instanceof Error ? resumeError.message : 'Não foi possível retomar o chamado.');
    }
  };

  const handlePrintTicket = () => {
    setIsMaisDropdownOpen(false);
    window.setTimeout(() => window.print(), 0);
  };

  const handleOpenTransitionLog = async () => {
    if (!ticketAtivo) return;
    setIsMaisDropdownOpen(false);
    setIsTransitionLogOpen(true);
    setIsLoadingTransitionLog(true);
    const { data, error } = await supabase.from('ticket_transitions').select('*')
      .eq('ticket_id', ticketAtivo.id).order('created_at', { ascending: false });
    if (error) toast.error('Não foi possível carregar o log de alterações.');
    setTransitionLog((data || []) as Array<Record<string, unknown>>);
    setIsLoadingTransitionLog(false);
  };

  const handleTicketAction = async (action: 'cancelar' | 'excluir') => {
    if (!ticketAtivo) return;
    const message = action === 'excluir'
      ? 'Excluir permanentemente esta ordem de serviço? Esta ação não pode ser desfeita.'
      : 'Cancelar esta ordem de serviço?';
    if (!window.confirm(message)) return;
    try {
      const response = await fetch('/api/tickets/gerenciar', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ticket_id: ticketAtivo.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível concluir a ação.');
      if (action === 'excluir') {
        toast.success('Ordem de serviço excluída.');
        handleBackToTickets();
      } else {
        setTicketAtivo({ ...ticketAtivo, status: 'CANCELADO', pausa_atual_id: null });
        setActivePause(null);
        toast.success('Ordem de serviço cancelada.');
      }
      setIsMaisDropdownOpen(false);
    } catch (actionError) {
      toast.error(actionError instanceof Error ? actionError.message : 'Não foi possível concluir a ação.');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !ticketAtivo) return;
    setIsSendingReply(true);

    try {
      const { error } = await supabase.from('ticket_replies').insert({
        ticket_id: ticketAtivo.id,
        sender_type: 'agent',
        sender: operadorAtual?.nome || 'Você',
        message: replyText,
      });

      if (error) throw error;

      setReplyText('');
      toast.success('Resposta enviada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar a resposta.');
    } finally {
      setIsSendingReply(false);
    }
  };

  useEffect(() => {
    const resolveTicket = async () => {
      const tid = routeTicketId ?? searchParams.get('ticket_id');
      if (tid && ticketAtivo?.id !== tid) {
        const found = tickets.find((ticket) => ticket.id === tid);
        if (loading && !found) return;
        const supabase = createClient();
        const { data, error } = await supabase
          .from('tickets')
          .select('*')
          .eq('id', tid)
          .like('protocolo_origem', 'OS-%')
          .maybeSingle();
        if (data && !error) {
          setTicketAtivo(data);
        } else if (found) {
          setTicketAtivo(found);
        } else {
          toast.error(`Falha ao buscar chamado: ${error?.message || 'registro não encontrado'}`);
        }
      }
    };

    void resolveTicket();
  }, [routeTicketId, searchParams, tickets, ticketAtivo, loading]);
  // Edit Form States
  const [editForm, setEditForm] = useState({
    titulo: '',
    descricao: '',
    departamento: '',
    categoria: '',
    prioridade: ''
  });

  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Fetch anexos when ticketAtivo changes
  useEffect(() => {
    if (!ticketAtivo) return;

    const fetchAnexos = async () => {
      const { data, error } = await supabase
        .from('ticket_anexos')
        .select('*')
        .eq('ticket_id', ticketAtivo.id);

      if (data && !error) {
        setAnexos((data as TicketAttachment[]).filter((anexo) => Boolean(anexo.url)));
      } else if (error) {
        console.error('Erro ao carregar anexos do chamado:', error.message);
        toast.error('Não foi possível carregar os anexos deste chamado.');
      }
    };
    fetchAnexos();

    const fetchEvidences = async () => {
      const { data, error } = await supabase
        .from('ticket_evidences')
        .select('*')
        .eq('ticket_id', ticketAtivo.id)
        .order('created_at', { ascending: false });
      if (!error && data) setEvidences(data as TicketEvidence[]);
      if (error) console.error('Erro ao carregar evidências do chamado:', error.message);
    };
    void fetchEvidences();

    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      setErrorHistory(null);
      const { data, error } = await supabase
        .from('ticket_replies')
        .select('*')
        .eq('ticket_id', ticketAtivo.id)
        .order('criado_em', { ascending: false });

      if (error) {
        setErrorHistory('Falha ao carregar o histórico de mensagens.');
      } else if (data) {
        const formattedHistory: ITicketReply[] = (data as TicketReplyRealtimeRow[]).map((row) => ({
          id: row.id,
          sender_type: row.sender_type,
          sender: row.sender,
          message: row.message,
          date: new Date(row.criado_em).toLocaleString()
        }));
        setTicketHistory(formattedHistory);
      }
      setIsLoadingHistory(false);
    };

    fetchHistory();

    const channel = supabase.channel(`ticket_${ticketAtivo.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_replies', filter: `ticket_id=eq.${ticketAtivo.id}` }, (payload: RealtimePostgresChangesPayload<TicketReplyRealtimeRow>) => {
        const row = payload.new as TicketReplyRealtimeRow;
        const newReply: ITicketReply = {
          id: row.id,
          sender_type: row.sender_type,
          sender: row.sender,
          message: row.message,
          date: new Date(row.criado_em).toLocaleString()
        };
        setTicketHistory(prev => [newReply, ...prev]);
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_evidences', filter: `ticket_id=eq.${ticketAtivo.id}` }, (payload: RealtimePostgresChangesPayload<TicketEvidence & Record<string, unknown>>) => {
        const evidence = payload.new as TicketEvidence;
        setEvidences((previous) => previous.some((item) => item.id === evidence.id) ? previous : [evidence, ...previous]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ticket_evidences', filter: `ticket_id=eq.${ticketAtivo.id}` }, (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const removedId = String((payload.old as { id?: string }).id || '');
        setEvidences((previous) => previous.filter((item) => item.id !== removedId));
      })
      .subscribe((status: string, error?: Error) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('Falha na conexão Realtime das evidências:', status, error);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticketAtivo]);

  const clientLogo = getClientLogo(ticketAtivo?.cliente);

  return (
    <div className={styles.container}>
      {ticketsError && <div className={styles.errorMessage} role="alert">{ticketsError}</div>}
      {!ticketAtivo ? (
        <>
          <DashboardTickets
            tickets={tickets}
            perfis={perfis}
            operadorAtual={operadorAtual}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            activeFilter={activeFilter}
            isMeus={isMeus}
            hasMoreTickets={hasMoreTickets}
            loadingMoreTickets={loadingMoreTickets}
            onLoadMoreTickets={() => void loadMoreTickets()}
            onSelectTicket={(ticket) => {
              setTicketAtivo(ticket);
            }}
          />
          {isNewTicketModalOpen && canCreateTicket && (
            <NovoChamadoModal onClose={() => {
              setIsNewTicketModalOpen(false);
              if (openCreateTicket) router.replace(`/${lang}/analista`);
            }} />
          )}
        </>
      ) : (
        <div className={styles.innerViewContainer}>
          <div className={styles.innerHeader}>
            <div className={styles.detailHeading}>
              <button className={styles.btnBack} onClick={handleBackToTickets} title="Voltar" aria-label="Voltar para chamados">
                <ArrowLeft size={17} aria-hidden="true" />
              </button>
              <div className={styles.detailHeadingText}>
                <p className={styles.detailEyebrow}>
                  Detalhes do Chamado <span>#{ticketAtivo.protocolo_origem || ticketAtivo.id.substring(0, 8)}</span>
                </p>
                <h1 className={styles.detailTitle}>{ticketAtivo.titulo}</h1>
                <div className={styles.detailMeta}>
                  <span className={styles.detailStatus}>{ticketAtivo.status || 'Sem status'}</span>
                  <span>{ticketAtivo.cliente || 'Cliente não informado'}</span>
                </div>
              </div>
            </div>
            <div className={styles.headerActionsGroup}>
              <div className={styles.dropdownWrapper}>
                <button
                  className={styles.btnMais}
                  onClick={() => setIsMaisDropdownOpen(!isMaisDropdownOpen)}
                  aria-expanded={isMaisDropdownOpen}
                >
                  Mais <ChevronDown size={14} aria-hidden="true" />
                </button>
                {isMaisDropdownOpen && (
                  <div className={styles.maisDropdown}>
                    {isAssignedTechnician && ticketAtivo.status === 'EM_ANDAMENTO' && (
                      <button type="button" className={styles.dropdownItem} onClick={() => { setIsPauseModalOpen(true); setIsMaisDropdownOpen(false); }}>
                        <Pause size={16} /> Pausar chamado
                      </button>
                    )}
                    {isAssignedTechnician && ticketAtivo.status === 'PAUSADO' && (
                      <button type="button" className={styles.dropdownItem} onClick={() => void handleResumeTicket()}>
                        <Play size={16} /> Retomar atendimento
                      </button>
                    )}
                    {canDeleteTicket && <button type="button" className={styles.dropdownItem} onClick={() => void handleTicketAction('excluir')}><Trash2 size={16} /> Excluir</button>}
                    <button type="button" className={styles.dropdownItem} onClick={handlePrintTicket}><Printer size={16} /> Imprimir</button>
                    <button
                      type="button"
                      className={styles.dropdownItem}
                      disabled={!canCreateTicket && !isAssignedTechnician}
                      onClick={() => {
                        setEditForm({
                          titulo: ticketAtivo?.titulo || '',
                          descricao: ticketAtivo?.descricao || '',
                          departamento: ticketAtivo?.departamento || '',
                          categoria: ticketAtivo?.categoria || '',
                          prioridade: ticketAtivo?.prioridade || 'Baixa'
                        });
                        setIsEditModalOpen(true);
                        setIsMaisDropdownOpen(false);
                      }}
                    >
                      <Pencil size={16} /> Editar
                    </button>
                    <button type="button" className={styles.dropdownItem} onClick={() => void handleOpenTransitionLog()}><History size={16} /> Log de Alterações</button>
                  </div>
                )}
              </div>
              <button
                type="button"
                className={styles.btnFinalizar}
                disabled={!isAssignedTechnician || ticketAtivo.status !== 'EM_ANDAMENTO'}
                title={!isAssignedTechnician ? 'A finalização técnica deve ser feita pelo técnico responsável.' : undefined}
                onClick={() => setIsFinishModalOpen(true)}
              >Finalizar</button>
              <button
                type="button"
                className={styles.btnCancelar}
                disabled={!canCancelTicket || ['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO', 'CANCELADO'].includes(ticketAtivo.status)}
                onClick={() => void handleTicketAction('cancelar')}
              >Cancelar</button>
            </div>
          </div>

          <div className={styles.innerBody}>
            {/* Coluna Esquerda: Timeline e Resposta */}
            <div className={styles.innerTimeline}>
              <div className={styles.timelineCard}>
                <div className={styles.timelineHeader}>
                  <div className={styles.timelineUser}>
                    <div className={`${styles.timelineAvatar} ${clientLogo ? styles.timelineAvatarWithLogo : ''}`}>
                      {clientLogo ? (
                        <Image
                          src={clientLogo}
                          alt={`Logo de ${ticketAtivo.cliente || 'cliente'}`}
                          width={44}
                          height={44}
                          className={styles.timelineClientLogo}
                        />
                      ) : (
                        <User size={20} color="#64748b" aria-hidden="true" />
                      )}
                    </div>
                    <div>
                      <span className={styles.timelineName}>{ticketAtivo.cliente}</span>
                      <span className={styles.timelineRole}>Cliente</span>
                    </div>
                  </div>
                  <div className={styles.timelineDate}>
                    {safeDateValue(ticketAtivo.criado_em)?.toLocaleDateString() || '-'} {safeDateValue(ticketAtivo.criado_em)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                  </div>
                </div>
                <div
                  className={styles.timelineContent}
                  dangerouslySetInnerHTML={{ __html: ticketAtivo.descricao || '' }}
                  onClick={handleTimelineClick}
                />

                {anexos && anexos.length > 0 && (
                  <div className={styles.attachmentsSection}>
                    <h5 className={styles.attachmentsTitle}>Anexos</h5>
                    <div className={styles.attachmentsList}>
                      {anexos.map((anexo, idx) => (
                        <a
                          key={idx}
                          href={anexo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            if (anexo.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                              e.preventDefault();
                              setSelectedImage(anexo.url);
                            }
                          }}
                          className={styles.attachmentLink}
                        >
                          <File size={14} /> {anexo.nome_arquivo} {anexo.tamanho_bytes ? `(${(anexo.tamanho_bytes / 1024).toFixed(1)} KB)` : ''}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
                {evidences.length > 0 && (
                  <div className={styles.evidenceList} aria-label="Evidências enviadas durante o atendimento">
                    {evidences.map((evidence) => (
                      <div key={evidence.id} className={styles.evidenceCard}>
                        <a
                          href={evidence.media_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.evidenceItem}
                          onClick={(event) => {
                            event.preventDefault();
                            setSelectedImage(evidence.media_url);
                          }}
                        >
                          <img src={evidence.media_url} alt={evidence.caption || (evidence.type === 'BEFORE' ? 'Evidência antes do serviço' : 'Evidência depois do serviço')} width={96} height={96} loading="lazy" />
                          <span>{evidence.type === 'BEFORE' ? 'Antes' : 'Depois'}</span>
                          {evidence.caption && <span className={styles.evidenceCaption}>{evidence.caption}</span>}
                        </a>
                        <button type="button" className={styles.evidenceDeleteButton} onClick={() => void deleteEvidence(evidence)} disabled={Boolean(deletingEvidenceId)}>
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <HistoricoPausasOS ticketId={ticketAtivo.id} canViewRoute={canViewPauseRoute} />
              {['FINALIZADO', 'RESOLVIDO', 'FECHADO', 'CONCLUIDO'].includes((ticketAtivo.status || '').toUpperCase()) && (
                <ServiceReportSection ticket={ticketAtivo} />
              )}
            </div>

            {/* Coluna Direita: Informações */}
            <div className={styles.innerSidebar}>
              {/* Card de Anexos */}
              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Anexos</h4>
                {anexos.length === 0 ? (
                  <div className={styles.noAttachment}>Nenhum anexo encontrado.</div>
                ) : (
                  <div className={styles.attachmentListWrapper}>
                    {anexos.map((anexo, i) => (
                      <div key={i} className={styles.attachmentRow}>
                        <File size={16} color="#00d2ff" className={styles.attachmentIcon} />
                        <div className={styles.attachmentInfoWrapper}>
                          <a
                            href={anexo.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.attachmentFileName}
                          >
                            {anexo.nome_arquivo}
                          </a>
                          {anexo.tamanho_bytes && (
                            <span className={styles.attachmentSize}>
                              {(anexo.tamanho_bytes / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                        <a href={anexo.url} download target="_blank" rel="noopener noreferrer" className={styles.attachmentDownload}>
                          <Download size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
                {evidences.length > 0 && (
                  <div className={styles.evidenceList} aria-label="Evidências do atendimento">
                    {evidences.map((evidence) => (
                      <div key={evidence.id} className={styles.evidenceCard}>
                        <a href={evidence.media_url} target="_blank" rel="noopener noreferrer" className={styles.evidenceItem}>
                          <img src={evidence.media_url} alt={evidence.caption || (evidence.type === 'BEFORE' ? 'Evidência antes do serviço' : 'Evidência depois do serviço')} width={72} height={72} loading="lazy" />
                          <span>{evidence.type === 'BEFORE' ? 'Antes' : 'Depois'}</span>
                          {evidence.caption && <span className={styles.evidenceCaption}>{evidence.caption}</span>}
                        </a>
                        <button type="button" className={styles.evidenceDeleteButton} onClick={() => void deleteEvidence(evidence)} disabled={Boolean(deletingEvidenceId)}>
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Cliente</h4>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Cliente:</span>
                  <span className={styles.panelValue}>{ticketAtivo.cliente}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Email:</span>
                  <span className={styles.panelValue}>{ticketAtivo.email_cliente || 'Não Informado'}</span>
                </div>
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Informações do Chamado</h4>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Responsável:</span>
                  <span className={styles.panelValue}>{getAtendenteNome(ticketAtivo.analista_id || ticketAtivo.tecnico_id)}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Equipe responsável:</span>
                  <span className={styles.panelValue}>{ticketAtivo.equipe_responsavel === 'SUPORTE_TECNICO' ? 'Suporte Técnico' : ticketAtivo.equipe_responsavel === 'FINANCEIRO' ? 'Financeiro' : ticketAtivo.equipe_responsavel === 'ANALISTA' ? 'Analista' : ticketAtivo.equipe_responsavel === 'COMERCIAL' ? 'Comercial' : 'Não informado'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Departamento:</span>
                  <span className={styles.panelValue}>{ticketAtivo.departamento || 'Não Informado'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Categoria:</span>
                  <span className={styles.panelValue}>{ticketAtivo.categoria || 'Não Informada'}</span>
                </div>
                {(ticketAtivo.causa_raiz || ticketAtivo.resolucao?.causaRaiz) && (
                  <div className={styles.panelRow}>
                    <span className={styles.panelLabel}>Causa raiz:</span>
                    <span className={styles.panelValue}>
                      {ticketAtivo.causa_raiz || ticketAtivo.resolucao?.causaRaiz}
                      {(ticketAtivo.causa_raiz_detalhe || ticketAtivo.resolucao?.causaRaizDetalhe) && ` — ${ticketAtivo.causa_raiz_detalhe || ticketAtivo.resolucao?.causaRaizDetalhe}`}
                    </span>
                  </div>
                )}
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Criado em:</span>
                  <span className={styles.panelValue}>{safeDateValue(ticketAtivo.criado_em)?.toLocaleString([], { hour: '2-digit', minute: '2-digit' }) || '-'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Prioridade:</span>
                  <span className={styles.panelValue}>{ticketAtivo.prioridade || 'Não Definida'}</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {ticketAtivo && isPauseModalOpen && isAssignedTechnician && ticketAtivo.status === 'EM_ANDAMENTO' && (
        <PausarChamadoModal
          ticketId={ticketAtivo.id}
          lang={lang}
          onClose={() => setIsPauseModalOpen(false)}
          onSuccess={handlePauseCreated}
        />
      )}

      {ticketAtivo && isFinishModalOpen && isAssignedTechnician && ticketAtivo.status === 'EM_ANDAMENTO' && (
        <FinalizarChamadoModal
          ticket={ticketAtivo}
          onClose={() => setIsFinishModalOpen(false)}
          onSuccess={() => {
            setIsFinishModalOpen(false);
            setTicketAtivo({ ...ticketAtivo, status: 'FINALIZADO' });
            toast.success('Ordem de serviço finalizada.');
          }}
        />
      )}

      {isTransitionLogOpen && (
        <div className={styles.modalEditOverlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsTransitionLogOpen(false); }}>
          <section className={styles.modalEditContent} role="dialog" aria-modal="true" aria-labelledby="ticket-transition-log-title">
            <header className={styles.modalEditHeader}>
              <h2 className={styles.modalEditTitle} id="ticket-transition-log-title">Log de alterações</h2>
              <button type="button" onClick={() => setIsTransitionLogOpen(false)} className={styles.modalEditClose} aria-label="Fechar">×</button>
            </header>
            <div className={styles.modalEditBody}>
              {isLoadingTransitionLog ? <p role="status">Carregando histórico...</p> : transitionLog.length ? transitionLog.map((entry, index) => (
                <article className={styles.transitionLogEntry} key={String(entry.id || index)}>
                  <strong>{String(entry.from_status || 'Criação')} → {String(entry.to_status || 'Atualização')}</strong>
                  <time>{safeDateValue(entry.created_at as string)?.toLocaleString('pt-BR') || 'Data não informada'}</time>
                  {entry.reason != null && <p>{String(entry.reason)}</p>}
                </article>
              )) : <p>Nenhuma alteração registrada para esta OS.</p>}
            </div>
            <footer className={styles.modalEditFooter}>
              <button type="button" onClick={() => setIsTransitionLogOpen(false)} className={styles.btnCancelEdit}>Fechar</button>
            </footer>
          </section>
        </div>
      )}

      {/* Modal Editar Chamado */}
      {isEditModalOpen && (
        <div className={styles.modalEditOverlay}>
          <div className={styles.modalEditContent}>
            <div className={styles.modalEditHeader}>
              <h3 className={styles.modalEditTitle}>Editar Chamado</h3>
              <button onClick={() => setIsEditModalOpen(false)} className={styles.modalEditClose}>×</button>
            </div>

            <div className={styles.modalEditBody}>
              <div className={styles.modalEditRow}>
                <label className={styles.modalEditLabel}>Assunto:</label>
                <input
                  type="text"
                  value={editForm.titulo}
                  onChange={(e) => setEditForm({...editForm, titulo: e.target.value})}
                  className={styles.modalEditInput}
                />
              </div>

              <div className={styles.modalEditRowTop}>
                <label className={styles.modalEditLabelTop}>Mensagem:</label>
                <textarea
                  value={editForm.descricao}
                  onChange={(e) => setEditForm({...editForm, descricao: e.target.value})}
                  className={styles.modalEditTextarea}
                />
              </div>

              <div className={styles.modalEditRow}>
                <label className={styles.modalEditLabel}>Departamento:</label>
                <input type="text" value={editForm.departamento} onChange={(e) => setEditForm({...editForm, departamento: e.target.value})} className={styles.modalEditInput} maxLength={150} />
              </div>

              <div className={styles.modalEditRow}>
                <label className={styles.modalEditLabel}>Categoria:</label>
                <input type="text" value={editForm.categoria} onChange={(e) => setEditForm({...editForm, categoria: e.target.value})} className={styles.modalEditInput} maxLength={150} />
              </div>

              <div className={styles.modalEditRow}>
                <label className={styles.modalEditLabel}>Prioridade:</label>
                <select
                  value={editForm.prioridade}
                  onChange={(e) => setEditForm({...editForm, prioridade: e.target.value})}
                  className={styles.modalEditSelect}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className={styles.modalEditFooter}>
              <button
                className={styles.btnSave}
                disabled={isSavingEdit}
                onClick={async () => {
                  if (!ticketAtivo) return;
                  if (!editForm.titulo.trim()) {
                    toast.error('O assunto é obrigatório.');
                    return;
                  }
                  setIsSavingEdit(true);
                  try {
                    const response = await fetch('/api/tickets/gerenciar', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'editar', ticket_id: ticketAtivo.id,
                        changes: {
                          titulo: editForm.titulo.trim(), descricao: editForm.descricao,
                          departamento: editForm.departamento, categoria: editForm.categoria,
                          prioridade: editForm.prioridade,
                        },
                      }),
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error || 'Não foi possível salvar as alterações.');
                    setTicketAtivo({
                      ...(ticketAtivo as ITicket),
                      titulo: editForm.titulo.trim(),
                      descricao: editForm.descricao,
                      departamento: editForm.departamento,
                      categoria: editForm.categoria,
                      prioridade: editForm.prioridade,
                      atualizado_em: result.ticket?.atualizado_em || new Date().toISOString(),
                    });
                    setIsEditModalOpen(false);
                    toast.success('Chamado atualizado.');
                  } catch (saveError) {
                    toast.error(saveError instanceof Error ? saveError.message : 'Não foi possível salvar as alterações.');
                  } finally {
                    setIsSavingEdit(false);
                  }
                }}
              >
                {isSavingEdit ? 'Salvando...' : 'Salvar'}
              </button>
              <button onClick={() => setIsEditModalOpen(false)} className={styles.btnCancelEdit}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className={styles.lightboxOverlay}
        >
          <div className={styles.lightboxActions}>
            <a
              href={selectedImage}
              download
              target="_blank"
              rel="noreferrer"
              className={styles.lightboxActionBtn}
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={24} />
            </a>
            <button
              onClick={() => setSelectedImage(null)}
              className={styles.lightboxActionBtn}
            >
              <X size={24} />
            </button>
          </div>
          <img
            src={selectedImage}
            alt="Anexo ampliado"
            className={styles.modalImage}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
