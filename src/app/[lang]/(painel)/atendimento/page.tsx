'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '../../../../utils/supabase/client';
import { useCentralAtendimento } from '../../../../hooks/useCentralAtendimento';
import styles from './atendimento.module.css';
import { Send, User, Phone, Clock, Search, Bot, Server, Key, Video, Activity, Inbox, Settings, Trash2, Printer, Pencil, History, X } from 'lucide-react';
import { DashboardTickets } from '../../../../components/Chamados/DashboardTickets';
import { TicketEditor } from '../../../../components/Chamados/TicketEditor';
import { WhatsAppModal } from '../../../../components/Chamados/WhatsAppModal';
import { SkeletonHistory } from '../../../../components/Chamados/SkeletonHistory';
import { ITicket, ITomTicketReply, IWhatsAppConversation, IWhatsAppMessage, ILojaContato } from '../../../../types/ticket';
import { File, Download } from 'lucide-react';

const supabase = createClient();

export default function CentralAtendimentoPage() {
  return (
    <Suspense fallback={<div className={styles.loadingEmpty}>Carregando chamados...</div>}>
      <CentralAtendimentoContent />
    </Suspense>
  );
}

function CentralAtendimentoContent() {
  const { tickets, perfis, pdvs, operadorAtual, loading } = useCentralAtendimento();

  const searchParams = useSearchParams();
  const [ticketAtivo, setTicketAtivo] = useState<ITicket | null>(null);
  const [anexos, setAnexos] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'details' | 'timeline'>('details');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('novos');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getAtendenteNome = (id: string | null | undefined) => {
    if (!id) return 'Sem Atendente Vinculado';
    const p = perfis.find(p => String(p.user_id) === String(id));
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

  const [activeFilter, setActiveFilter] = useState('todos');
  const [isMeus, setIsMeus] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Check path for new clean URLs
    if (pathname.includes('/my-tickets')) {
      setIsMeus(true);
      if (pathname.includes('/opened')) setActiveFilter('abertos');
      else if (pathname.includes('/closed')) setActiveFilter('finalizados');
      else setActiveFilter('todos');
    } else if (pathname.includes('/all-tickets')) {
      setIsMeus(false);
      setActiveFilter('todos');
    } else {
      // Fallback to query params for /atendimento
      const f = searchParams.get('filter');
      const m = searchParams.get('meus');
      setIsMeus(m === 'true');
      setActiveFilter(f || 'todos');
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const tid = searchParams.get('ticket_id');
    if (tid && !ticketAtivo) {
      toast.info(`Tentando abrir chamado: ${tid.substring(0,6)}...`);
      const found = tickets.find((t: ITicket) => t.id === tid);
      if (found) {
        toast.success(`Chamado encontrado na memória!`);
        setTicketAtivo(found);
        setViewMode('details');
      } else if (!loading) {
        toast.info(`Buscando chamado no banco de dados...`);
        // If not found in loaded tickets, fetch it directly
        const fetchTicket = async () => {
          const supabase = createClient();
          const { data, error } = await supabase.from('tickets').select('*').eq('id', tid).single();
          if (data) {
            toast.success(`Chamado carregado do banco!`);
            setTicketAtivo(data);
            setViewMode('details');
          } else {
            toast.error(`Falha ao buscar chamado: ${error?.message}`);
          }
        };
        fetchTicket();
      } else {
        toast.info(`Aguardando carregamento da lista...`);
      }
    }
  }, [searchParams, tickets, ticketAtivo, loading]);
  // Edit Form States
  const [editForm, setEditForm] = useState({
    titulo: '',
    descricao: '',
    departamento: '',
    categoria: '',
    prioridade: ''
  });
  
  // Reply Editor States
  const [replyText, setReplyText] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;
    setIsSendingReply(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newReply: ITomTicketReply = {
        id: Date.now(),
        sender_type: 'agent',
        sender: operadorAtual?.nome || 'Você',
        message: replyText,
        date: new Date().toISOString()
      };
      
      setTicketHistory(prev => [newReply, ...prev]);
      setReplyText('');
      toast.success('Resposta enviada com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao enviar a resposta.');
    } finally {
      setIsSendingReply(false);
    }
  };

  // Fetch anexos when ticketAtivo changes
  useEffect(() => {
    const fetchAnexos = async () => {
      if (!ticketAtivo) {
        setAnexos([]);
        return;
      }
      const { data, error } = await supabase
        .from('ticket_anexos')
        .select('*')
        .eq('ticket_id', ticketAtivo.id);
      
      if (data && !error) {
        setAnexos(data);
      }
    };
    fetchAnexos();
  }, [ticketAtivo]);

  // WhatsApp States
  const [conversas, setConversas] = useState<IWhatsAppConversation[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<IWhatsAppConversation | null>(null);
  const [mensagens, setMensagens] = useState<IWhatsAppMessage[]>([]);
  const [inputMensagem, setInputMensagem] = useState('');
  
  // Status PDV e CRM movidos para o final para manter a estrutura, PDVs agora vêm do hook.
  
  // CRM Lojas (Contatos Dinâmicos)
  const [lojaContato, setLojaContato] = useState<ILojaContato | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [newPhoneValue, setNewPhoneValue] = useState('');
  const [isLoadingContact, setIsLoadingContact] = useState(false);

  // TomTicket History
  const [ticketHistory, setTicketHistory] = useState<ITomTicketReply[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  const [ticketExtraInfo, setTicketExtraInfo] = useState<{organizacao: string|null, deadline: string|null, agendamento: string|null} | null>(null);

  // Milvus Proxy Modal
  const [isMilvusIframeOpen, setIsMilvusIframeOpen] = useState(false);

  // Wpp Modal
  const [isWppModalOpen, setIsWppModalOpen] = useState(false);

  // Dropdown Mais
  const [isMaisDropdownOpen, setIsMaisDropdownOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Carregar Historico do TomTicket
  useEffect(() => {
    if (!ticketAtivo || !ticketAtivo.tomticket_id) {
      setTicketHistory([]);
      return;
    }
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      setErrorHistory(null);
      try {
        const res = await fetch(`/api/tomticket/history?tomticket_id=${ticketAtivo.tomticket_id}`);
        const data = await res.json();
        if (data.success) {
          setTicketHistory(data.messages || []);
          if (data.ticket_info) {
            setTicketExtraInfo(data.ticket_info);
          }
          if (data.ticket_attachments && data.ticket_attachments.length > 0) {
            const ttAnexos = data.ticket_attachments.map((a: any) => ({
              nome_arquivo: a.name,
              url: a.url || a.link,
              tamanho_bytes: a.size
            }));
            setAnexos(prev => {
              // Evita duplicados pela URL
              const novasUrls = ttAnexos.map((ta: any) => ta.url);
              const filtrados = prev.filter(p => !novasUrls.includes(p.url));
              return [...filtrados, ...ttAnexos];
            });
          }
        } else {
          setTicketHistory([]);
          setErrorHistory('Não foi possível carregar o histórico deste chamado.');
        }
      } catch (err) {
        console.error(err);
        setErrorHistory('Erro de conexão ao buscar histórico do TomTicket.');
      }
      setIsLoadingHistory(false);
    };
    fetchHistory();
  }, [ticketAtivo]);

  // 1.5. Carregar Contato Dinâmico da Loja (Micro-CRM)
  useEffect(() => {
    if (!ticketAtivo) {
      setLojaContato(null);
      setIsEditingContact(false);
      return;
    }
    const fetchContato = async () => {
      setIsLoadingContact(true);
      const { data, error } = await supabase
        .from('lojas_contatos')
        .select('*')
        .eq('nome_loja', ticketAtivo.cliente)
        .maybeSingle();
      
      if (data) {
        setLojaContato(data);
        setNewPhoneValue(data.telefone_whatsapp);
      } else {
        setLojaContato(null);
        setNewPhoneValue('');
      }
      setIsEditingContact(false);
      setIsLoadingContact(false);
    };
    fetchContato();
  }, [ticketAtivo]);

  // 2. Carregar Conversas do WhatsApp
  useEffect(() => {
    const carregarConversas = async () => {
      const { data } = await supabase
        .from('whatsapp_conversas')
        .select('*')
        .order('ultima_mensagem_data', { ascending: false });
      if (data) setConversas(data);
    };
    carregarConversas();
  }, []);

  // 3. Carregar mensagens quando uma conversa está ativa
  useEffect(() => {
    if (!conversaAtiva) return;

    const carregarMensagens = async () => {
      const { data } = await supabase
        .from('whatsapp_mensagens')
        .select('*')
        .eq('conversa_id', conversaAtiva.id)
        .order('criado_em', { ascending: true });
      if (data) setMensagens(data);
      rolarParaBaixo();
    };

    carregarMensagens();

    const subMensagens = supabase
      .channel(`chat-${conversaAtiva.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_mensagens', filter: `conversa_id=eq.${conversaAtiva.id}` }, (payload: any) => {
        setMensagens((current) => [...current, payload.new]);
        rolarParaBaixo();
      })
      .subscribe();

    return () => { supabase.removeChannel(subMensagens); };
  }, [conversaAtiva?.id]);

  // 4. Salvar/Atualizar Contato da Loja (Micro-CRM)
  const handleVincularContato = async () => {
    if (!ticketAtivo || !ticketAtivo.cliente || !newPhoneValue) return;
    setIsLoadingContact(true);
    
    try {
      const response = await fetch('/api/contatos/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_loja: ticketAtivo?.cliente,
          telefone_whatsapp: newPhoneValue.replace(/\D/g, '') // Only numbers
        })
      });

      if (response.ok) {
        setLojaContato({
          nome_loja: ticketAtivo?.cliente || '',
          telefone_whatsapp: newPhoneValue.replace(/\D/g, '')
        });
        setIsEditingContact(false);
      } else {
        const errorData = await response.json();
        console.error('Erro ao salvar contato:', errorData);
        alert('Erro ao salvar o contato. Verifique as permissões.');
      }
    } catch (error) {
      console.error('Erro na requisição:', error);
      alert('Erro de conexão ao salvar o contato.');
    }
    
    setIsLoadingContact(false);
  };

  // 5. Checagem On-Demand no Milvus (RF07)
  useEffect(() => {
    if (!ticketAtivo) return;
    
    // Dispara a consulta ao Milvus em background
    const verificarMilvus = async () => {
      try {
        await fetch('/api/milvus/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loja: ticketAtivo.cliente })
        });
        // A API vai atualizar o banco Supabase, o que disparará o WebSocket abaixo.
      } catch (err) {
        console.error('Erro ao consultar Milvus:', err);
      }
    };
    verificarMilvus();
  }, [ticketAtivo]);



  const rolarParaBaixo = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  const handleEnviarMensagem = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!inputMensagem.trim() || !conversaAtiva) return;

    const texto = inputMensagem;
    setInputMensagem(''); 

    let body: any = { to: conversaAtiva.telefone, message: texto, conversaId: conversaAtiva.id, nomePerfil: conversaAtiva.nome_perfil };
    
    if (texto.trim() === '/video') {
      const salaJitsi = `https://meet.jit.si/Critel-${Math.random().toString(36).substring(7)}`;
      body.message = `Olá! Clique no link a seguir para iniciarmos uma chamada de vídeo para visualizar o equipamento: ${salaJitsi}`;
    }

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      if (response.ok) {
        const result = await response.json();
        // Se a conversa era 'nova', a API criou no banco e devolveu o UUID real
        if (conversaAtiva.id === 'nova' && result.conversaId) {
          const updatedConversa: IWhatsAppConversation = { ...conversaAtiva, id: result.conversaId };
          setConversaAtiva(updatedConversa);
          // Atualiza a lista de conversas no menu lateral/fundo
          setConversas((prev) => [updatedConversa, ...prev]);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar', error);
    }
  };

  return (
    <div className={styles.container}>
      {!ticketAtivo ? (
        <DashboardTickets 
          tickets={tickets}
          perfis={perfis}
          operadorAtual={operadorAtual}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilter={activeFilter}
          isMeus={isMeus}
          onSelectTicket={(ticket) => {
            setTicketAtivo(ticket);
            setIsReplying(false);
            if (ticket.tomticket_id) {
              setViewMode('details');
            } else {
              setViewMode('timeline');
            }
          }}
        />
      ) : viewMode === 'details' ? (
         <div className={`${styles.innerViewContainer} ${styles.mainContent}`}>
            <div className={styles.mainHeader}>
              <div className={styles.mainHeaderLeft}>
                 <button onClick={() => setTicketAtivo(null)} className={styles.backButton}>⬅</button>
                 <h2 className={styles.ticketMainTitle}>Vincular Chamado: #{ticketAtivo.protocolo_origem} - {ticketAtivo.titulo}</h2>
              </div>
              <div className={styles.mainHeaderRight}>
                 <button 
                   onClick={() => {
                     setEditForm({
                       titulo: ticketAtivo?.titulo || '',
                       descricao: ticketAtivo?.descricao || '',
                       departamento: ticketAtivo?.departamento || '',
                       categoria: ticketAtivo?.categoria || '',
                       prioridade: ticketAtivo?.prioridade || 'Baixa'
                     });
                     setIsEditModalOpen(true);
                   }} 
                   className={styles.actionButton}
                 >
                   <Pencil size={16} />
                 </button>
                 <button className={styles.actionButton}><Inbox size={16} /></button>
                 <button className={styles.actionButtonDanger}><Trash2 size={16}/> Excluir v</button>
                 <button onClick={() => setTicketAtivo(null)} className={styles.actionButton}>Cancelar</button>
              </div>
            </div>

            <div className={styles.detailsView}>
               <div className={styles.detailsGrid}>
                  <div className={styles.detailsLabel}>Mensagem:</div>
                  <div className={styles.detailsValue} dangerouslySetInnerHTML={{ __html: ticketAtivo.descricao || '-' }} />

                  <div className={styles.detailsLabel}>Departamento:</div>
                  <div className={styles.detailsValue}>{ticketAtivo.departamento || '-'}</div>

                  <div className={styles.detailsLabel}>Categoria:</div>
                  <div className={styles.detailsValue}>{ticketAtivo.categoria || '-'}</div>

                  <div className={styles.detailsLabel}>Prioridade:</div>
                  <div className={styles.detailsValue}>{ticketAtivo.prioridade || '-'}</div>

                  <div className={styles.detailsLabel}>Data/Hora:</div>
                  <div className={styles.detailsValue}>{new Date(ticketAtivo.criado_em).toLocaleString()}</div>

                  <div className={styles.detailsLabel}>Agendamento:</div>
                  <div className={styles.detailsValue}>{ticketExtraInfo?.agendamento ? new Date(ticketExtraInfo.agendamento).toLocaleString() : '-'}</div>

                  <div className={styles.detailsLabel}>Deadline:</div>
                  <div className={styles.detailsValue}>{ticketExtraInfo?.deadline ? new Date(ticketExtraInfo.deadline).toLocaleString() : '-'}</div>
               </div>

               <hr className={styles.divider} />

               <div className={styles.detailsGrid}>
                  <div className={styles.detailsLabel}>Cliente:</div>
                  <div className={styles.detailsValue}>{ticketAtivo.cliente || '-'}</div>

                  <div className={styles.detailsLabel}>Organização:</div>
                  <div className={styles.detailsValue}>{ticketExtraInfo?.organizacao || '-'}</div>

                  <div className={styles.detailsLabel}>Email:</div>
                  <div className={styles.detailsValue}>{ticketAtivo.email_cliente || '-'}</div>
               </div>

               <div className={styles.centerContainer}>
                  <button onClick={() => setViewMode('timeline')} className={styles.secondaryButton}>Mostrar Detalhes</button>
               </div>

               <hr className={styles.divider} />

               <div className={styles.detailsGrid}>
                  <div className={styles.detailsLabel}>Atendente:</div>
                  <div>
                    <select 
                      className={styles.selectInput}
                      value={ticketAtivo.analista_id || ''}
                      onChange={async (e) => {
                        const novoAtendente = e.target.value;
                        setTicketAtivo({...ticketAtivo, analista_id: novoAtendente});
                        await supabase.from('tickets').update({ analista_id: novoAtendente }).eq('id', ticketAtivo.id);
                      }}
                    >
                      <option value="">Sem atendente</option>
                      {perfis.map(p => (
                        <option key={p.id} value={p.user_id}>{p.nome} {p.cargo ? `(${p.cargo})` : ''}</option>
                      ))}
                    </select>
                  </div>
                  <div></div>
                  <div>
                    <label className={styles.checkboxLabel}>
                      <input type="checkbox" defaultChecked />
                      Receber respostas do cliente por email
                    </label>
                  </div>
               </div>
            </div>

            <div className={styles.footerActions}>
              <button 
                className={styles.primaryButton}
                onClick={async () => {
                   alert('Atendente vinculado!');
                   setViewMode('timeline');
                }}
              >
                Vincular
              </button>
              <div className={styles.mainHeaderRight}>
                <button className={styles.actionButtonDanger}>Excluir v</button>
                <button onClick={() => setTicketAtivo(null)} className={styles.secondaryButton}>Cancelar</button>
              </div>
            </div>
         </div>
      ) : (
        <div className={styles.innerViewContainer}>
          <div className={styles.innerHeader}>
            <div className={styles.innerHeaderTitle}>
              <button className={styles.btnBack} onClick={() => setTicketAtivo(null)} title="Voltar">
                ⬅
              </button>
              Detalhes do Chamado: #{ticketAtivo.protocolo_origem || ticketAtivo.id.substring(0,8)} - {ticketAtivo.titulo}
            </div>
            <div className={styles.headerActionsGroup}>
              <div className={styles.dropdownWrapper}>
                <button 
                  className={styles.btnMais} 
                  onClick={() => setIsMaisDropdownOpen(!isMaisDropdownOpen)}
                >
                  Mais v
                </button>
                {isMaisDropdownOpen && (
                  <div className={styles.maisDropdown}>
                    <button className={styles.dropdownItem}><Trash2 size={16} /> Excluir</button>
                    <button className={styles.dropdownItem}><Printer size={16} /> Imprimir</button>
                    <button 
                      className={styles.dropdownItem}
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
                    <button className={styles.dropdownItem}><History size={16} /> Log de Alterações</button>
                  </div>
                )}
              </div>
              <button className={styles.btnFinalizar}>Finalizar</button>
              <button className={styles.btnCancelar}>Cancelar</button>
            </div>
          </div>

          <div className={styles.innerBody}>
            {/* Coluna Esquerda: Timeline e Resposta */}
            <div className={styles.innerTimeline}>
              <div className={styles.timelineCard}>
                <div className={styles.timelineHeader}>
                  <div className={styles.timelineUser}>
                    <div className={styles.timelineAvatar}>
                      <User size={20} color="#64748b" />
                    </div>
                    <div>
                      <span className={styles.timelineName}>{ticketAtivo.cliente}</span>
                      <span className={styles.timelineRole}>Cliente</span>
                    </div>
                  </div>
                  <div className={styles.timelineDate}>
                    {new Date(ticketAtivo.criado_em).toLocaleDateString()} {new Date(ticketAtivo.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                          rel="noreferrer" 
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
                
                {(!ticketAtivo.tomticket_id || isReplying) ? (
                  <TicketEditor 
                    replyText={replyText}
                    setReplyText={setReplyText}
                    isSendingReply={isSendingReply}
                    handleSendReply={handleSendReply}
                  />
                ) : (
                  <div className={styles.replyContainer}>
                    <button 
                      onClick={() => setIsReplying(true)}
                      className={styles.replyButton}
                    >
                      Responder Chamado
                    </button>
                  </div>
                )}
              </div>

              {isLoadingHistory && <SkeletonHistory />}
              
              {errorHistory && (
                <div className={styles.errorContainer}>
                  <p className={styles.errorMessage}>{errorHistory}</p>
                  <button 
                    onClick={() => setTicketAtivo({ ...ticketAtivo })} 
                    className={styles.errorRetryBtn}
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {!isLoadingHistory && !errorHistory && ticketHistory.length === 0 && (
                <div className={styles.emptyTimeline}>Nenhuma interação registrada neste chamado ainda.</div>
              )}

              {ticketHistory.map((reply) => (
                <div key={reply.id} className={`${styles.timelineCard} ${styles.timelineCardMargin}`}>
                  <div className={styles.timelineHeader}>
                    <div className={styles.timelineUser}>
                      <div className={`${styles.timelineAvatar} ${reply.sender_type === 'A' ? styles.avatarAtendente : styles.avatarCliente}`}>
                        <User size={20} />
                      </div>
                      <div>
                        <span className={styles.timelineName}>{reply.sender}</span>
                        <span className={styles.timelineRole}>{reply.sender_type === 'A' ? 'Atendente' : 'Cliente'}</span>
                      </div>
                    </div>
                    <div className={styles.timelineDate}>
                      {reply.date}
                    </div>
                  </div>
                  <div 
                    className={styles.timelineContent} 
                    dangerouslySetInnerHTML={{ __html: reply.message }} 
                    onClick={handleTimelineClick}
                  />

                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className={styles.attachmentsSection}>
                      <h5 className={styles.attachmentsTitle}>Anexos</h5>
                      <div className={styles.attachmentsList}>
                        {reply.attachments.map((anexo, idx) => (
                          <a 
                            key={idx} 
                            href={anexo.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={(e) => {
                              if (anexo.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                                e.preventDefault();
                                setSelectedImage(anexo.url);
                              }
                            }}
                            className={styles.attachmentLink}
                          >
                            <File size={14} /> {anexo.name || 'Anexo'}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
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
                            rel="noreferrer"
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
                        <a href={anexo.url} download target="_blank" rel="noreferrer" className={styles.attachmentDownload}>
                          <Download size={16} />
                        </a>
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
                  <span className={styles.panelLabel}>Organização:</span>
                  <span className={styles.panelValue}>{ticketExtraInfo?.organizacao || '-'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Email:</span>
                  <span className={styles.panelValue}>{ticketAtivo.email_cliente || 'Não Informado'}</span>
                </div>
                <button className={styles.btnShowDetails}>Mostrar Detalhes</button>
                
                <button 
                  className={styles.btnWppAction}
                  onClick={() => {
                    if (lojaContato) {
                      const conversa = conversas.find(c => c.telefone === lojaContato.telefone_whatsapp);
                      setConversaAtiva(conversa || { id: 'nova', telefone: lojaContato.telefone_whatsapp, nome_perfil: ticketAtivo.cliente });
                      if (!conversa) setMensagens([]);
                    }
                    setIsWppModalOpen(true);
                  }}
                >
                  <Phone size={16} /> Acionar WhatsApp {lojaContato ? `(+${lojaContato.telefone_whatsapp})` : ''}
                </button>
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Rótulos</h4>
                <select className={styles.selectInputLabel}>
                  <option>Adicionar rótulos</option>
                </select>
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Informações do Chamado</h4>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Responsável:</span>
                  <span className={styles.panelValue}>{getAtendenteNome(ticketAtivo.analista_id || ticketAtivo.tecnico_id)}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Departamento:</span>
                  <span className={styles.panelValue}>{ticketAtivo.departamento || 'Não Informado'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Categoria:</span>
                  <span className={styles.panelValue}>{ticketAtivo.categoria || 'Não Informada'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Criado em:</span>
                  <span className={styles.panelValue}>{new Date(ticketAtivo.criado_em).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Prioridade:</span>
                  <span className={styles.panelValue}>{ticketAtivo.prioridade || 'Não Definida'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Deadline:</span>
                  <span className={styles.panelValue}>{ticketExtraInfo?.deadline ? new Date(ticketExtraInfo.deadline).toLocaleString() : '-'}</span>
                </div>
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Ferramentas Integradas</h4>
                <div className={styles.toolsWrapper}>
                  <a href="/api/cofre/stoq" target="_blank" rel="noreferrer" className={styles.btnStoq}>
                    Abrir Stoq ERP (Cofre)
                  </a>
                  <button 
                    onClick={() => setIsMilvusIframeOpen(true)}
                    className={styles.btnMilvus}
                  >
                    Abrir Milvus Proxy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal WhatsApp Flutuante */}
      <WhatsAppModal 
        isWppModalOpen={isWppModalOpen}
        setIsWppModalOpen={setIsWppModalOpen}
        conversaAtiva={conversaAtiva}
        ticketAtivo={ticketAtivo}
        mensagens={mensagens}
        lojaContato={lojaContato}
        setIsEditingContact={setIsEditingContact}
        inputMensagem={inputMensagem}
        setInputMensagem={setInputMensagem}
        handleEnviarMensagem={handleEnviarMensagem}
        scrollRef={scrollRef}
      />

      {/* Modal Full-Screen do Milvus Proxy */}
      {isMilvusIframeOpen && (
        <div className={styles.milvusOverlay}>
          <div className={styles.milvusHeader}>
            <div>
              <h2 className={styles.milvusTitle}>Milvus IT Management</h2>
              <p className={styles.milvusSubtitle}>Sessão Única Compartilhada via WebRTC Proxy</p>
            </div>
            <button 
              onClick={() => setIsMilvusIframeOpen(false)}
              className={styles.milvusCloseBtn}
            >
              Fechar Milvus
            </button>
          </div>
          <iframe 
            src="http://localhost:3001" 
            className={styles.milvusIframe}
            allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write"
          />
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
                <select 
                  value={editForm.departamento}
                  onChange={(e) => setEditForm({...editForm, departamento: e.target.value})}
                  className={styles.modalEditSelect}
                >
                  <option value="">Selecione...</option>
                  <option value="FIN - Contas a Pagar">FIN - Contas a Pagar</option>
                  <option value="FIN - Contas a Receber">FIN - Contas a Receber</option>
                  <option value="TI - Lojas">TI - Lojas</option>
                  <option value="RH - Pessoal">RH - Pessoal</option>
                  <option value="Operações">Operações</option>
                </select>
              </div>

              <div className={styles.modalEditRow}>
                <label className={styles.modalEditLabel}>Categoria:</label>
                <select 
                  value={editForm.categoria}
                  onChange={(e) => setEditForm({...editForm, categoria: e.target.value})}
                  className={styles.modalEditSelect}
                >
                  <option value="">Selecione...</option>
                  <option value="Solicitação Cartão Vexpenses (Lojas)">Solicitação Cartão Vexpenses (Lojas)</option>
                  <option value="Hardware - PDV">Hardware - PDV</option>
                  <option value="Dúvida de Sistema">Dúvida de Sistema</option>
                </select>
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
                onClick={async () => {
                  if (!ticketAtivo) return;
                  const { error } = await supabase.from('tickets').update({
                    titulo: editForm.titulo,
                    descricao: editForm.descricao,
                    departamento: editForm.departamento,
                    categoria: editForm.categoria,
                    prioridade: editForm.prioridade
                  }).eq('id', ticketAtivo.id);
                  
                  if (!error) {
                    setTicketAtivo({
                      ...(ticketAtivo as ITicket),
                      titulo: editForm.titulo,
                      descricao: editForm.descricao,
                      departamento: editForm.departamento,
                      categoria: editForm.categoria,
                      prioridade: editForm.prioridade
                    });
                    setIsEditModalOpen(false);
                  } else {
                    alert('Erro ao salvar: ' + error.message);
                  }
                }}
              >
                Salvar
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
