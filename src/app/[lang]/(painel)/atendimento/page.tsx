'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '../../../../utils/supabase/client';
import { useCentralAtendimento } from '../../../../hooks/useCentralAtendimento';
import styles from './atendimento.module.css';
import { Send, User, Phone, Clock, Search, Bot, Server, Key, Video, Activity, Inbox, Settings, Trash2, Printer, Pencil, History } from 'lucide-react';
import { DashboardTickets } from '../../../../components/Chamados/DashboardTickets';
import { TicketEditor } from '../../../../components/Chamados/TicketEditor';
import { WhatsAppModal } from '../../../../components/Chamados/WhatsAppModal';
import { SkeletonHistory } from '../../../../components/Chamados/SkeletonHistory';
import { ITicket, ITomTicketReply, IWhatsAppConversation, IWhatsAppMessage, ILojaContato } from '../../../../types/ticket';
import { File, Download } from 'lucide-react';

const supabase = createClient();

export default function CentralAtendimentoPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', color: '#fff' }}>Carregando chamados...</div>}>
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
            setViewMode('details');
          }}
        />
      ) : viewMode === 'details' ? (
         <div className={styles.innerViewContainer} style={{ background: '#0b1120', color: '#fff', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <button onClick={() => setTicketAtivo(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>⬅</button>
                 <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Vincular Chamado: #{ticketAtivo.protocolo_origem} - {ticketAtivo.titulo}</h2>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
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
                   style={{ background: '#162032', color: '#fff', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer' }}
                 >
                   <Pencil size={16} />
                 </button>
                 <button style={{ background: '#162032', color: '#fff', padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer' }}><Inbox size={16} /></button>
                 <button style={{ background: '#b71c1c', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Trash2 size={16}/> Excluir v</button>
                 <button onClick={() => setTicketAtivo(null)} style={{ background: '#162032', color: '#fff', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </div>

            <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Mensagem:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem', overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: ticketAtivo.descricao || '-' }} />

                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Departamento:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>{ticketAtivo.departamento || '-'}</div>

                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Categoria:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>{ticketAtivo.categoria || '-'}</div>

                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Prioridade:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>{ticketAtivo.prioridade || '-'}</div>

                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Data/Hora:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>{new Date(ticketAtivo.criado_em).toLocaleString()}</div>

                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Agendamento:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>-</div>

                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Deadline:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>-</div>
               </div>

               <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />

               <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Cliente:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>{ticketAtivo.cliente || '-'}</div>

                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Organização:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>-</div>

                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Email:</div>
                  <div style={{ color: '#f3f4f6', fontSize: '0.9rem' }}>{ticketAtivo.email_cliente || '-'}</div>
               </div>

               <div style={{ textAlign: 'center', margin: '24px 0' }}>
                  <button onClick={() => setViewMode('timeline')} style={{ background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>Mostrar Detalhes</button>
               </div>

               <hr style={{ borderColor: 'rgba(255,255,255,0.08)', margin: '24px 0' }} />

               <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: '16px', alignItems: 'center' }}>
                  <div style={{ color: '#9ca3af', textAlign: 'right', fontWeight: 500, fontSize: '0.9rem' }}>Atendente:</div>
                  <div>
                    <select 
                      style={{ background: '#162032', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 12px', borderRadius: '4px', width: '100%', maxWidth: '400px', outline: 'none', fontSize: '0.9rem' }}
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
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f3f4f6', fontSize: '0.85rem' }}>
                      <input type="checkbox" defaultChecked />
                      Receber respostas do cliente por email
                    </label>
                  </div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
              <button 
                style={{ background: '#c9253a', color: '#fff', border: 'none', padding: '8px 24px', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
                onClick={async () => {
                   alert('Atendente vinculado!');
                   setViewMode('timeline');
                }}
              >
                Vincular
              </button>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ background: '#b71c1c', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>Excluir v</button>
                <button onClick={() => setTicketAtivo(null)} style={{ background: 'transparent', color: '#fff', padding: '8px 16px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
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
              <div style={{ position: 'relative' }}>
                <button 
                  className={styles.btnMais} 
                  onClick={() => setIsMaisDropdownOpen(!isMaisDropdownOpen)}
                >
                  Mais v
                </button>
                {isMaisDropdownOpen && (
                  <div style={{ 
                    position: 'absolute', top: '100%', left: 0, marginTop: '8px',
                    background: '#1a1d26', border: '1px solid #32394c', borderRadius: '8px',
                    minWidth: '200px', padding: '8px 0', zIndex: 50,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
                  }}>
                    <button className={styles.dropdownItem}><Trash2 size={16} /> Excluir</button>
                    <button className={styles.dropdownItem}><Printer size={16} /> Imprimir</button>
                    <button className={styles.dropdownItem}><Pencil size={16} /> Editar</button>
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
                <div className={styles.timelineContent} style={{ overflowX: 'auto' }} dangerouslySetInnerHTML={{ __html: ticketAtivo.descricao || '' }} />
                
                <TicketEditor 
                  replyText={replyText}
                  setReplyText={setReplyText}
                  isSendingReply={isSendingReply}
                  handleSendReply={handleSendReply}
                />
              </div>

              {isLoadingHistory && <SkeletonHistory />}
              
              {errorHistory && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', margin: '16px 0', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>{errorHistory}</p>
                  <button 
                    onClick={() => setTicketAtivo({ ...ticketAtivo })} 
                    style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {!isLoadingHistory && !errorHistory && ticketHistory.length === 0 && (
                <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Nenhuma interação registrada neste chamado ainda.</div>
              )}

              {ticketHistory.map((reply) => (
                <div key={reply.id} className={styles.timelineCard} style={{ marginTop: '16px' }}>
                  <div className={styles.timelineHeader}>
                    <div className={styles.timelineUser}>
                      <div className={styles.timelineAvatar} style={{ background: reply.sender_type === 'A' ? '#c9253a' : '#334155', color: '#fff' }}>
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
                  <div className={styles.timelineContent} dangerouslySetInnerHTML={{ __html: reply.message }} />
                </div>
              ))}
            </div>

            {/* Coluna Direita: Informações */}
            <div className={styles.innerSidebar}>
              {/* Card de Anexos */}
              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Anexos</h4>
                {anexos.length === 0 ? (
                  <div style={{ color: '#94a3b8', fontSize: '0.85rem', padding: '10px 0' }}>Nenhum anexo encontrado.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                    {anexos.map((anexo, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <File size={16} color="#00d2ff" style={{ marginTop: '2px' }} />
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <a 
                            href={anexo.url} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ 
                              color: '#e2e8f0', 
                              fontSize: '0.85rem', 
                              textDecoration: 'none',
                              display: 'block',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {anexo.nome_arquivo}
                          </a>
                          {anexo.tamanho_bytes && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                              {(anexo.tamanho_bytes / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                        <a href={anexo.url} download target="_blank" rel="noreferrer" style={{ color: '#94a3b8', cursor: 'pointer' }}>
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
                  <span className={styles.panelValue}>-</span>
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
                <select style={{ width: '100%', background: '#1a1d26', color: '#94a3b8', border: '1px solid #32394c', padding: '10px', borderRadius: '4px', outline: 'none' }}>
                  <option>Adicionar rótulos</option>
                </select>
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Informações do Chamado</h4>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Responsável:</span>
                  <span className={styles.panelValue}>Sem Atendente Vinculado</span>
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
                  <span className={styles.panelValue}>-</span>
                </div>
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Ferramentas Integradas</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="/api/cofre/stoq" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#00d2ff', color: '#0b1120', textDecoration: 'none', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Abrir Stoq ERP (Cofre)
                  </a>
                  <button 
                    onClick={() => setIsMilvusIframeOpen(true)}
                    style={{ background: '#c9253a', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
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
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 17, 32, 0.95)',
          backdropFilter: 'blur(10px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          padding: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h2 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-montserrat)' }}>Milvus IT Management</h2>
              <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.9rem' }}>Sessão Única Compartilhada via WebRTC Proxy</p>
            </div>
            <button 
              onClick={() => setIsMilvusIframeOpen(false)}
              style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              Fechar Milvus
            </button>
          </div>
          <iframe 
            src="http://localhost:3001" 
            style={{ flex: 1, border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', background: '#fff', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
            allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write"
          />
        </div>
      )}

      {/* Modal Editar Chamado */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(11, 17, 32, 0.85)', backdropFilter: 'blur(4px)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{
            background: '#1a1d26', width: '100%', maxWidth: '800px',
            borderRadius: '8px', border: '1px solid #32394c',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid #32394c' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Editar Chamado</h3>
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '16px' }}>
                <label style={{ textAlign: 'right', color: '#9ca3af', fontSize: '0.9rem' }}>Assunto:</label>
                <input 
                  type="text" 
                  value={editForm.titulo}
                  onChange={(e) => setEditForm({...editForm, titulo: e.target.value})}
                  style={{ background: '#0b1120', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '4px', width: '100%', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'flex-start', gap: '16px' }}>
                <label style={{ textAlign: 'right', color: '#9ca3af', fontSize: '0.9rem', marginTop: '10px' }}>Mensagem:</label>
                <textarea 
                  value={editForm.descricao}
                  onChange={(e) => setEditForm({...editForm, descricao: e.target.value})}
                  style={{ background: '#0b1120', color: '#fff', border: '1px solid #32394c', padding: '10px', borderRadius: '4px', width: '100%', minHeight: '120px', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '16px' }}>
                <label style={{ textAlign: 'right', color: '#9ca3af', fontSize: '0.9rem' }}>Departamento:</label>
                <select 
                  value={editForm.departamento}
                  onChange={(e) => setEditForm({...editForm, departamento: e.target.value})}
                  style={{ background: '#0b1120', color: '#fff', border: '1px solid #32394c', padding: '10px', borderRadius: '4px', width: '100%', outline: 'none' }}
                >
                  <option value="">Selecione...</option>
                  <option value="FIN - Contas a Pagar">FIN - Contas a Pagar</option>
                  <option value="FIN - Contas a Receber">FIN - Contas a Receber</option>
                  <option value="TI - Lojas">TI - Lojas</option>
                  <option value="RH - Pessoal">RH - Pessoal</option>
                  <option value="Operações">Operações</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '16px' }}>
                <label style={{ textAlign: 'right', color: '#9ca3af', fontSize: '0.9rem' }}>Categoria:</label>
                <select 
                  value={editForm.categoria}
                  onChange={(e) => setEditForm({...editForm, categoria: e.target.value})}
                  style={{ background: '#0b1120', color: '#fff', border: '1px solid #32394c', padding: '10px', borderRadius: '4px', width: '100%', outline: 'none' }}
                >
                  <option value="">Selecione...</option>
                  <option value="Solicitação Cartão Vexpenses (Lojas)">Solicitação Cartão Vexpenses (Lojas)</option>
                  <option value="Hardware - PDV">Hardware - PDV</option>
                  <option value="Dúvida de Sistema">Dúvida de Sistema</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', alignItems: 'center', gap: '16px' }}>
                <label style={{ textAlign: 'right', color: '#9ca3af', fontSize: '0.9rem' }}>Prioridade:</label>
                <select 
                  value={editForm.prioridade}
                  onChange={(e) => setEditForm({...editForm, prioridade: e.target.value})}
                  style={{ background: '#0b1120', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '4px', width: '100%', outline: 'none' }}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', padding: '16px', borderTop: '1px solid #32394c', background: '#111520', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px' }}>
              <button 
                style={{ background: '#10b981', color: '#fff', padding: '8px 24px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500 }}
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
              <button onClick={() => setIsEditModalOpen(false)} style={{ background: 'transparent', color: '#fff', padding: '8px 16px', border: '1px solid #32394c', borderRadius: '4px', cursor: 'pointer' }}>Fechar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
