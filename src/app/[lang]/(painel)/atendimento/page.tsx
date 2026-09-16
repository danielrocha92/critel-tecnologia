'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './atendimento.module.css';
import { Send, User, Phone, Clock, Search, Bot, Server, Key, Video, Activity, Inbox, Settings } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

export default function CentralAtendimento() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketAtivo, setTicketAtivo] = useState<any | null>(null);
  
  // WhatsApp States
  const [conversas, setConversas] = useState<any[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<any | null>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [inputMensagem, setInputMensagem] = useState('');
  
  // Status PDV
  const [pdvs, setPdvs] = useState<any[]>([]);
  
  // CRM Lojas (Contatos Dinâmicos)
  const [lojaContato, setLojaContato] = useState<any | null>(null);
  const [isEditingContact, setIsEditingContact] = useState(false);
  const [newPhoneValue, setNewPhoneValue] = useState('');
  const [isLoadingContact, setIsLoadingContact] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Carregar fila de Tickets (TomTicket Webhooks)
  useEffect(() => {
    const carregarTickets = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .order('criado_em', { ascending: false });
      if (data) setTickets(data);
    };
    carregarTickets();

    const subTickets = supabase
      .channel('lista-tickets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, (payload) => {
        carregarTickets();
      })
      .subscribe();

    return () => { supabase.removeChannel(subTickets); };
  }, []);

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
        .single();
      
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
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_mensagens', filter: `conversa_id=eq.${conversaAtiva.id}` }, (payload) => {
        setMensagens((current) => [...current, payload.new]);
        rolarParaBaixo();
      })
      .subscribe();

    return () => { supabase.removeChannel(subMensagens); };
  }, [conversaAtiva?.id]);

  // 4. Salvar/Atualizar Contato da Loja (Micro-CRM)
  const handleSaveContact = async () => {
    if (!newPhoneValue) return;
    setIsLoadingContact(true);
    
    try {
      const response = await fetch('/api/contatos/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome_loja: ticketAtivo.cliente,
          telefone_whatsapp: newPhoneValue.replace(/\D/g, '') // Only numbers
        })
      });

      if (response.ok) {
        setLojaContato({
          nome_loja: ticketAtivo.cliente,
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

  // 6. Carregar Status de PDV (Com WebSockets Realtime do Milvus)
  useEffect(() => {
    const carregarPdvs = async () => {
      const { data } = await supabase.from('status_pdv').select('*').order('loja', { ascending: true });
      if (data) setPdvs(data);
    };
    carregarPdvs();

    // Ouvinte em tempo real para quando o Cron Job / Worker do Milvus atualizar o banco
    const subPdvs = supabase
      .channel('lista-pdvs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status_pdv' }, async (payload) => {
        carregarPdvs(); // Recarrega a lista se houver alguma alteração (Mock ou Real)
        
        // Automação: Criação automática de ticket se PDV cair
        if (payload.new && payload.new.status_conexao) {
          const loja = payload.new.loja;
          let isOffline = false;
          try {
            const pdvsList = JSON.parse(payload.new.status_conexao);
            isOffline = pdvsList.some((p: any) => p.status === 'OFFLINE');
          } catch {
            isOffline = payload.new.status_conexao === 'OFFLINE';
          }

          if (isOffline && loja.toLowerCase() !== 'bacio di latte') {
            // Verifica se já tem ticket aberto pra loja
            const temTicket = tickets.some(t => t.cliente === loja && t.status !== 'RESOLVIDO');
            if (!temTicket) {
              console.log(`Automação: Criando ticket para ${loja} (PDV Offline)`);
              await fetch('/api/tomticket/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'ticket',
                  protocolo: `AUTO-${Date.now()}`,
                  subject: `[ALERTA AUTOMÁTICO] PDV Offline - ${loja}`,
                  description: `O monitoramento detectou que um ou mais caixas da loja ${loja} estão offline. Verifique imediatamente.`,
                  client: { name: loja }
                })
              });
            }
          }
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(subPdvs); };
  }, []);

  const rolarParaBaixo = () => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, 100);
  };

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
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
          setConversaAtiva({ ...conversaAtiva, id: result.conversaId });
          // Atualiza a lista de conversas no menu lateral/fundo
          setConversas((prev) => [{ ...conversaAtiva, id: result.conversaId }, ...prev]);
        }
      }
    } catch (error) {
      console.error('Erro ao enviar', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Coluna 1 (Anterior Coluna 2): Fila de Chamados Kanban */}
      <section className={styles.filaArea}>
        <div className={styles.filaHeader}>
          <h3>Kanban de Tickets ({tickets.length})</h3>
        </div>
        <div className={styles.kanbanBoard}>
          {['NOVO', 'EM ANDAMENTO', 'RADAR_OBRAS', 'RESOLVIDO'].map(coluna => {
            const ticketsColuna = tickets.filter(t => (t.status || 'NOVO').toUpperCase() === coluna);
            return (
              <div key={coluna} className={styles.kanbanColumn}>
                <div className={styles.kanbanColumnHeader}>
                  {coluna === 'RADAR_OBRAS' ? 'AGUARDANDO' : coluna}
                  <span>{ticketsColuna.length}</span>
                </div>
                <div className={styles.ticketList}>
                  {ticketsColuna.length === 0 ? (
                    <div style={{ textAlign: 'center', opacity: 0.5, padding: '1rem', fontSize: '0.8rem' }}>Vazio</div>
                  ) : (
                    ticketsColuna.map((ticket) => {
                      // Verifica se o PDV desta loja está offline
                      const pdvDaLoja = pdvs.find(p => p.loja === ticket.cliente);
                      let isOffline = false;
                      if (pdvDaLoja) {
                        try {
                          const pdvsList = JSON.parse(pdvDaLoja.status_conexao);
                          isOffline = pdvsList.some((p: any) => p.status === 'OFFLINE');
                        } catch {
                          isOffline = pdvDaLoja.status_conexao === 'OFFLINE';
                        }
                      }

                      return (
                        <div 
                          key={ticket.id} 
                          className={`${styles.ticketCard} ${ticketAtivo?.id === ticket.id ? styles.ticketCardActive : ''} ${isOffline ? styles.ticketCardOffline : ''}`}
                          onClick={() => setTicketAtivo(ticket)}
                        >
                          <div className={styles.ticketTitleRow}>
                            <strong className={styles.ticketClient}>{ticket.cliente}</strong>
                            <span className={styles.ticketTime}>
                              {new Date(ticket.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <div className={styles.ticketSubject}>
                            {ticket.titulo}
                          </div>
                          <div className={styles.ticketProtocol}>
                            #{ticket.protocolo_origem}
                          </div>
                          <div className={styles.ticketBadges}>
                            <span className={`${styles.badge} ${ticket.status === 'NOVO' ? styles.badgeNovo : ticket.status === 'RADAR_OBRAS' ? styles.badgeRadar : styles.badgeNormal}`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
      {/* Coluna 3: Chat e Detalhes */}
      <main className={styles.chatArea}>
        {ticketAtivo ? (
          <>
            {/* Ticket Header (Contexto) */}
            <div className={styles.chatHeader}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 className={styles.chatHeaderTitle}>{ticketAtivo.titulo}</h2>
                  <p className={styles.chatHeaderDesc}>{ticketAtivo.descricao}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select 
                    value={ticketAtivo.status || 'NOVO'}
                    onChange={async (e) => {
                      const novoStatus = e.target.value;
                      const { error } = await supabase.from('tickets').update({ status: novoStatus }).eq('id', ticketAtivo.id);
                      if (!error) {
                        setTicketAtivo({ ...ticketAtivo, status: novoStatus });
                        setTickets(tickets.map(t => t.id === ticketAtivo.id ? { ...t, status: novoStatus } : t));
                      }
                    }}
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', outline: 'none' }}
                  >
                    <option value="NOVO" style={{ color: '#000' }}>Novo</option>
                    <option value="EM ANDAMENTO" style={{ color: '#000' }}>Em Andamento</option>
                    <option value="RADAR_OBRAS" style={{ color: '#000' }}>Aguardando / Radar</option>
                    <option value="RESOLVIDO" style={{ color: '#000' }}>Resolvido</option>
                  </select>
                </div>
              </div>
              {/* Módulo CRM Lojas (Contatos Dinâmicos) */}
              <div className={styles.crmContainer}>
                {isLoadingContact ? (
                  <p style={{ fontSize: '0.85rem', color: '#8b9bb4' }}>Buscando contato da loja...</p>
                ) : (
                  (!lojaContato || isEditingContact) ? (
                    <div className={styles.crmForm}>
                      <span style={{ fontSize: '0.85rem', color: '#e2e8f0', marginBottom: '4px', display: 'block' }}>
                        {!lojaContato ? 'Loja sem contato cadastrado. Adicione um número (com DDD):' : 'Editar contato da loja:'}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input 
                          type="text" 
                          value={newPhoneValue}
                          onChange={(e) => setNewPhoneValue(e.target.value)}
                          placeholder="Ex: 5511999999999"
                          className={styles.crmInput}
                        />
                        <button className={styles.btnAction} onClick={handleSaveContact} disabled={!newPhoneValue}>
                          Salvar
                        </button>
                        {isEditingContact && lojaContato && (
                          <button className={styles.btnCancel} onClick={() => { setIsEditingContact(false); setNewPhoneValue(lojaContato.telefone_whatsapp); }}>
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={styles.crmActive}>
                      <button 
                        className={styles.btnAction}
                        onClick={() => {
                          const conversa = conversas.find(c => c.telefone === lojaContato.telefone_whatsapp); 
                          if (conversa) {
                            setConversaAtiva(conversa);
                          } else {
                            // Se não tiver conversa prévia, simulamos a abertura criando uma localmente pro atendente chamar (na v2 isso faria o envio ativo via API da Meta)
                            setConversaAtiva({
                              id: 'nova',
                              telefone: lojaContato.telefone_whatsapp,
                              nome_perfil: ticketAtivo.cliente
                            });
                            setMensagens([]);
                          }
                        }}
                      >
                        <Phone size={18} /> Acionar WhatsApp (+{lojaContato.telefone_whatsapp})
                      </button>
                      <button className={styles.btnEdit} onClick={() => setIsEditingContact(true)} title="Alterar contato">
                        ✏️
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Interface WhatsApp */}
            {conversaAtiva ? (
              <>
                 <div className={styles.chatSubHeader}>
                  <div className={styles.chatProfile}>
                    <div className={styles.chatAvatar}>
                      {conversaAtiva.nome_perfil.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className={styles.chatName}>{conversaAtiva.nome_perfil}</span>
                      <span className={styles.chatPhone}>+{conversaAtiva.telefone}</span>
                    </div>
                  </div>
                  <div className={styles.chatHint} title="Digite /video para gerar uma sala Jitsi segura">
                     Dica de Ação rápida: /video
                  </div>
                </div>
                
                <div ref={scrollRef} className={styles.chatMessages}>
                  {mensagens.length === 0 ? (
                    <div className={styles.chatEmpty}>Inicie o atendimento. Suas mensagens aparecerão aqui.</div>
                  ) : (
                    mensagens.map((msg) => {
                      const isInbound = msg.direcao === 'INBOUND';
                      return (
                        <div key={msg.id} className={`${styles.messageWrapper} ${isInbound ? styles.msgInbound : styles.msgOutbound}`}>
                          <div className={styles.messageBubble}>
                            {msg.conteudo}
                            <div className={styles.messageMeta}>
                              <span className={styles.messageTime}>
                                {new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <div className={styles.chatInputArea}>
                  <form onSubmit={handleEnviarMensagem} className={styles.chatForm}>
                    <input 
                      type="text" 
                      value={inputMensagem}
                      onChange={(e) => setInputMensagem(e.target.value)}
                      placeholder="Digite uma mensagem ou comando /video..." 
                      className={styles.chatInput}
                    />
                    <button type="submit" className={styles.btnSend}>
                      <Send size={18} />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className={styles.chatEmpty}>
                <Phone size={48} className={styles.chatEmptyIcon} />
                <h3>Nenhum chat ativo</h3>
                <p>Acione o WhatsApp do cliente para iniciar a conversa.</p>
              </div>
            )}
          </>
        ) : (
          <div className={styles.chatEmpty}>
            <Search size={48} className={styles.chatEmptyIcon} />
            <h2>Selecione um Chamado</h2>
            <p>O contexto e o canal de contato aparecerão aqui para você focar no atendimento.</p>
          </div>
        )}
      </main>

      {/* Coluna 4: Status e Acessos */}
      <section className={styles.statusArea}>
        <div className={styles.statusSection}>
          <h3 className={styles.statusTitle}>
            <Key size={18} /> Cofre de Senhas (SSO)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href="/api/cofre/stoq" target="_blank" rel="noreferrer" className={styles.btnCofre}>
              Abrir Stoq ERP
            </a>
            <a href="/api/cofre/milvus" target="_blank" rel="noreferrer" className={styles.btnCofre}>
              Abrir Milvus Suite
            </a>
          </div>
          <p className={styles.cofreDesc}>
            O login corporativo é injetado via proxy. Você não verá a senha.
          </p>
        </div>

        <div className={styles.statusSection}>
          <h3 className={styles.statusTitle}>
            <Server size={18} /> Radar de PDVs
          </h3>
          <div className={styles.pdvList}>
            {!ticketAtivo ? (
              <span className={styles.cofreDesc}>Selecione um chamado para ver o status do PDV.</span>
            ) : (
              (() => {
                const pdvAtual = pdvs.find(p => p.loja === ticketAtivo.cliente);
                if (!pdvAtual) {
                  return <span className={styles.cofreDesc}>Buscando disponibilidade da loja no Milvus...</span>;
                }

                let pdvsList = [];
                try {
                  // O novo mock guarda o array de PDVs dentro da string
                  pdvsList = JSON.parse(pdvAtual.status_conexao);
                } catch {
                  // Fallback para os dados antigos antes dessa modificação
                  pdvsList = [{ nome: 'Caixa Principal', status: pdvAtual.status_conexao }];
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                    {pdvsList.map((p: any, idx: number) => (
                      <div key={idx} className={styles.pdvItem}>
                        <span className={p.status === 'ONLINE' ? styles.dotGreen : styles.dotRed}></span>
                        <span className={styles.pdvName}>{p.nome}</span>
                        <span className={styles.pdvStatusText} style={{ color: p.status === 'ONLINE' ? '#10b981' : '#ef4444' }}>
                          {p.status}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
