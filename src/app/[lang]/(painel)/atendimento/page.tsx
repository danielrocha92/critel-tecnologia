'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './atendimento.module.css';
import { Send, User, Phone, Clock, Search, Bot, Server, Key, Video, Activity, Inbox, Settings, Trash2, Printer, Pencil, History } from 'lucide-react';

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

  // Milvus Proxy Modal
  const [isMilvusIframeOpen, setIsMilvusIframeOpen] = useState(false);

  // Wpp Modal
  const [isWppModalOpen, setIsWppModalOpen] = useState(false);

  // Dropdown Mais
  const [isMaisDropdownOpen, setIsMaisDropdownOpen] = useState(false);

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
        const record = payload.new as any;
        if (record && record.status_conexao) {
          const loja = record.loja;
          let isOffline = false;
          try {
            const pdvsList = JSON.parse(record.status_conexao);
            isOffline = pdvsList.some((p: any) => p.status === 'OFFLINE');
          } catch {
            isOffline = record.status_conexao === 'OFFLINE';
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
      {!ticketAtivo ? (
        <div className={styles.tableContainer}>
          <div className={styles.tableHeader}>
            <div className={`${styles.tabItem} ${styles.tabItemActive}`}>
              Novos Chamados <span className={styles.tabBadge}>1338</span>
            </div>
            <div className={styles.tabItem}>Chamados Respondidos</div>
            <div className={styles.tabItem}>Novos Chamados Vinculados</div>
            <div className={styles.tabItem}>
              Abertos <span className={styles.tabBadge}>5</span>
            </div>
            <div className={styles.tabItem}>
              Abertos da Equipe <span className={styles.tabBadge}>3588</span>
            </div>
            <div className={styles.tabItem}>
              Aguardando Ação da Equipe <span className={styles.tabBadge}>509</span>
            </div>
          </div>
          
          <div className={styles.tableWrapper}>
            <table className={styles.ticketTable}>
              <thead>
                <tr>
                  <th>Protocolo</th>
                  <th>Assunto</th>
                  <th>Departamento</th>
                  <th>Cliente</th>
                  <th>Categoria</th>
                  <th>Data/Hora</th>
                  <th>Última Situação</th>
                  <th>Status</th>
                  <th>Situação</th>
                  <th>Aberto Por</th>
                  <th>Prioridade</th>
                  <th>Atendente</th>
                  <th>SLA</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={13} style={{ textAlign: 'center', padding: '3rem', opacity: 0.7 }}>
                      Nenhum chamado pendente no momento.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket, index) => {
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

                    // Mocks para colunas que não existem no banco ainda
                    const mockDepto = index % 2 === 0 ? 'TI - Protheus' : 'FIN - Fiscal';
                    const mockCategoria = index % 2 === 0 ? 'Software - Protheus | Totvs' : 'Solicitação de Estorno/Reembolso';
                    const mockPrioridade = index % 2 === 0 ? 'BAIXA' : 'ALTA';
                    
                    return (
                      <tr 
                        key={ticket.id} 
                        className={`${styles.ticketRow} ${isOffline ? styles.ticketRowOffline : ''}`}
                        onClick={() => setTicketAtivo(ticket)}
                      >
                        <td className={styles.colProtocolo}>#{ticket.protocolo_origem}</td>
                        <td className={styles.colAssunto}>
                          {ticket.titulo}
                          <span className={styles.badgeAguardando}>AGUARDANDO</span>
                        </td>
                        <td className={styles.colDepto}>{mockDepto}</td>
                        <td className={styles.colCliente}>
                          <span className={styles.clienteNome}>{ticket.cliente}</span>
                          <span className={styles.clienteDetalhe}>(Operações)</span>
                        </td>
                        <td className={styles.colDepto}>{mockCategoria}</td>
                        <td className={styles.colData}>
                          {new Date(ticket.criado_em).toLocaleDateString()}<br/>
                          {new Date(ticket.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className={styles.colData}>
                          {new Date(ticket.criado_em).toLocaleDateString()}<br/>
                          {new Date(ticket.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className={styles.colStatus}>Sem atendente vinculado</td>
                        <td className={styles.colStatus}>Sem atendente vinculado</td>
                        <td className={styles.colStatus}>Cliente</td>
                        <td>
                          <span className={mockPrioridade === 'BAIXA' ? styles.badgePrioridadeBaixa : styles.badgePrioridadeAlta}>
                            {mockPrioridade}
                          </span>
                        </td>
                        <td className={styles.colStatus}>Não definido</td>
                        <td><div style={{ width: '40px', height: '6px', background: '#e2e8f0', borderRadius: '3px' }}></div></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className={styles.innerViewContainer}>
          <div className={styles.innerHeader}>
            <div className={styles.innerHeaderTitle}>
              <button className={styles.btnBack} onClick={() => setTicketAtivo(null)} title="Voltar">
                ⬅
              </button>
              Detalhes do Chamado: #{ticketAtivo.id} - {ticketAtivo.titulo}
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
                <div className={styles.timelineContent}>
                  {ticketAtivo.descricao}
                </div>
                
                <div className={styles.replyEditor}>
                  <div className={styles.replyToolbar}>
                    <button><b>B</b></button>
                    <button><i>I</i></button>
                    <button><u>U</u></button>
                    <button>T</button>
                    <div style={{ width: '1px', background: '#32394c', margin: '0 8px' }}></div>
                    <button>≡</button>
                    <button>List</button>
                    <div style={{ width: '1px', background: '#32394c', margin: '0 8px' }}></div>
                    <button>🔗</button>
                    <button>🖼️</button>
                  </div>
                  <textarea className={styles.replyTextarea} placeholder="Escreva sua resposta aqui..."></textarea>
                  <div className={styles.replyActions}>
                    <button className={styles.btnSendReply}>
                      Enviar Resposta v
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button style={{ background: 'transparent', border: '1px solid #32394c', padding: '8px 12px', borderRadius: '4px', color: '#cbd5e1', cursor: 'pointer' }}>📎</button>
                      <button style={{ background: 'transparent', border: '1px solid #32394c', padding: '8px 12px', borderRadius: '4px', color: '#cbd5e1', cursor: 'pointer' }}>🕒</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Informações */}
            <div className={styles.innerSidebar}>
              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Cliente</h4>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Cliente:</span>
                  <span className={styles.panelValue}>{ticketAtivo.cliente}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Organização:</span>
                  <span className={styles.panelValue}>Operações</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Email:</span>
                  <span className={styles.panelValue}>contato@{ticketAtivo.cliente.toLowerCase().replace(/ /g, '')}.com.br</span>
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
                  <span className={styles.panelValue}>Henrique Cunha - Critel Tecnologia</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Departamento:</span>
                  <span className={styles.panelValue}>TI - Software</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Categoria:</span>
                  <span className={styles.panelValue}>Software - Gestor de Lojas</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Criado em:</span>
                  <span className={styles.panelValue}>{new Date(ticketAtivo.criado_em).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Prioridade:</span>
                  <span className={styles.panelValue}>Baixa</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Deadline:</span>
                  <span className={styles.panelValue}>-</span>
                </div>
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Ferramentas Integradas</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <a href="/api/cofre/stoq" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', background: '#3b82f6', color: '#fff', textDecoration: 'none', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600 }}>
                    Abrir Stoq ERP (Cofre)
                  </a>
                  <button 
                    onClick={() => setIsMilvusIframeOpen(true)}
                    style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}
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
      {isWppModalOpen && (
        <div className={styles.floatingWppOverlay}>
          <div className={styles.floatingWppContainer}>
            <div className={styles.floatingWppHeader}>
              <h3 className={styles.floatingWppTitle}>
                <Phone size={18} color="#10b981" /> WhatsApp - {conversaAtiva?.nome_perfil || ticketAtivo?.cliente}
              </h3>
              <button onClick={() => setIsWppModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
            </div>
            
            <div ref={scrollRef} className={styles.chatMessages}>
              {(!mensagens || mensagens.length === 0) ? (
                <div style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem', color: '#fff' }}>
                  {!lojaContato ? (
                    <div>
                      <p>Loja sem contato cadastrado.</p>
                      <button onClick={() => {setIsEditingContact(true); setIsWppModalOpen(false);}} style={{ background: '#3b82f6', color: '#fff', padding: '8px 16px', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '8px' }}>Cadastrar Contato</button>
                    </div>
                  ) : 'Inicie o atendimento. Suas mensagens aparecerão aqui.'}
                </div>
              ) : (
                mensagens.map((msg) => {
                  const isInbound = msg.direcao === 'INBOUND';
                  return (
                    <div key={msg.id} className={`${styles.messageWrapper} ${isInbound ? styles.msgIn : styles.msgOut}`}>
                      <p className={styles.msgText}>{msg.conteudo}</p>
                      <span className={styles.msgTime}>
                        {new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.chatInputArea}>
              <input 
                type="text" 
                value={inputMensagem}
                onChange={(e) => setInputMensagem(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter') handleEnviarMensagem(e as any); }}
                placeholder="Digite a mensagem..." 
                className={styles.chatInput}
                disabled={!lojaContato}
              />
              <button onClick={handleEnviarMensagem} className={styles.btnSend} disabled={!lojaContato}>
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
