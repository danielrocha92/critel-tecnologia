'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './atendimento.module.css';
import { Send, User, Phone, Clock, Search, Bot, Server, Key, Video } from 'lucide-react';

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

  // 4. Carregar Status de PDV
  useEffect(() => {
    const carregarPdvs = async () => {
      const { data } = await supabase.from('status_pdv').select('*');
      if (data) setPdvs(data);
    };
    carregarPdvs();
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

    // Interceptador para geração de link de vídeo Jitsi (RF06)
    let body = { to: conversaAtiva.telefone, message: texto, conversaId: conversaAtiva.id };
    
    if (texto.trim() === '/video') {
      const salaJitsi = `https://meet.jit.si/Critel-${Math.random().toString(36).substring(7)}`;
      body.message = `Olá! Clique no link a seguir para iniciarmos uma chamada de vídeo para visualizar o equipamento: ${salaJitsi}`;
    }

    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
    } catch (error) {
      console.error('Erro ao enviar', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Coluna 1: Menu Lateral */}
      <aside className={styles.menuArea}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#2b6cb0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Bot size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Intranet Critel</h2>
        </div>
        
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#2d3748', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <Search size={18} /> Painel Central
            </li>
            <li style={{ padding: '10px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '10px' }}>
              <Server size={18} /> Monitoramento
            </li>
            <li style={{ padding: '10px', color: '#a0aec0', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '10px' }}>
              <Clock size={18} /> Auditoria
            </li>
          </ul>
        </nav>
      </aside>

      {/* Coluna 2: Fila de Chamados */}
      <section className={styles.filaArea}>
        <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', position: 'sticky', top: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Fila de Atendimento ({tickets.length})</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tickets.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#a0aec0' }}>
              Nenhum chamado pendente.
            </div>
          ) : (
            tickets.map((ticket) => (
              <div 
                key={ticket.id} 
                className={styles.ticketCard}
                style={{ 
                  borderLeft: ticketAtivo?.id === ticket.id ? '4px solid #3182ce' : '4px solid transparent',
                  backgroundColor: ticketAtivo?.id === ticket.id ? '#ebf8ff' : '#fff'
                }}
                onClick={() => setTicketAtivo(ticket)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: '1rem', color: '#2d3748' }}>{ticket.cliente}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>
                    {new Date(ticket.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#4a5568', marginTop: '4px', fontWeight: 500 }}>
                  {ticket.titulo}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '4px' }}>
                  Protocolo: #{ticket.protocolo_origem}
                </div>
                <div style={{ marginTop: '8px' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '0.7rem', backgroundColor: ticket.status === 'NOVO' ? '#fed7d7' : '#c6f6d5', color: ticket.status === 'NOVO' ? '#c53030' : '#22543d' }}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Coluna 3: Chat e Detalhes */}
      <main className={styles.chatArea}>
        {ticketAtivo ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Ticket Header */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>{ticketAtivo.titulo}</h2>
              <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>{ticketAtivo.descricao}</p>
              
              <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => {
                    // Módulo de Contato Dinâmico (Mock por enquanto)
                    const conversa = conversas.find(c => c.telefone === '5511999999999'); // Mock
                    if (conversa) setConversaAtiva(conversa);
                  }}
                  style={{ padding: '8px 16px', backgroundColor: '#25D366', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
                >
                  <Phone size={16} /> Acionar WhatsApp (Contato)
                </button>
              </div>
            </div>

            {/* WhatsApp Interface Embedded */}
            {conversaAtiva ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderTop: '1px solid #e2e8f0' }}>
                 <div style={{ padding: '10px 1.5rem', backgroundColor: '#f0f2f5', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                    <div style={{ width: '35px', height: '35px', backgroundColor: '#cbd5e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={20} color="#fff" />
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '0.95rem', color: '#2d3748' }}>{conversaAtiva.nome_perfil}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#718096' }}>+{conversaAtiva.telefone}</span>
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#718096', cursor: 'help' }} title="Digite /video para gerar uma sala Jitsi">
                     Dica: Digite /video
                  </div>
                </div>
                
                <div ref={scrollRef} style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', backgroundColor: '#efeae2', backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundRepeat: 'repeat' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {mensagens.map((msg) => {
                      const isInbound = msg.direcao === 'INBOUND';
                      return (
                        <div key={msg.id} style={{ alignSelf: isInbound ? 'flex-start' : 'flex-end', maxWidth: '75%' }}>
                          <div style={{ 
                            backgroundColor: isInbound ? '#fff' : '#d9fdd3', 
                            padding: '8px 12px', 
                            borderRadius: '8px',
                            boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                            borderTopLeftRadius: isInbound ? '0px' : '8px',
                            borderTopRightRadius: isInbound ? '8px' : '0px',
                          }}>
                            <span style={{ fontSize: '0.95rem', color: '#111b21', whiteSpace: 'pre-wrap' }}>
                              {msg.conteudo}
                            </span>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                              <span style={{ fontSize: '0.65rem', color: '#667781' }}>
                                {new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{ padding: '1rem', backgroundColor: '#f0f2f5' }}>
                  <form onSubmit={handleEnviarMensagem} style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="text" 
                      value={inputMensagem}
                      onChange={(e) => setInputMensagem(e.target.value)}
                      placeholder="Digite uma mensagem ou /video..." 
                      style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: 'none', outline: 'none' }}
                    />
                    <button type="submit" style={{ width: '45px', height: '45px', backgroundColor: '#00a884', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                      <Send size={20} />
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a0aec0', backgroundColor: '#f7fafc' }}>
                Clique em "Acionar WhatsApp" para abrir o canal de contato.
              </div>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a0aec0' }}>
            <Server size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <h2>Selecione um Chamado</h2>
            <p>Os detalhes e o canal de contato aparecerão aqui.</p>
          </div>
        )}
      </main>

      {/* Coluna 4: Status e Acessos */}
      <section className={styles.statusArea}>
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '1rem', color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Key size={18} /> Cofre de Senhas
          </h3>
          <div style={{ marginTop: '1rem' }}>
            <a href="/api/cofre/login-stoq" target="_blank" rel="noreferrer" style={{ display: 'block', padding: '12px', backgroundColor: '#3182ce', color: '#fff', textDecoration: 'none', borderRadius: '8px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
              Acessar Ajuda Stoq (SSO)
            </a>
            <p style={{ fontSize: '0.75rem', color: '#718096', marginTop: '8px', textAlign: 'center' }}>
              Credenciais injetadas automaticamente.
            </p>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '1rem', color: '#2d3748', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} /> Status de Rede (PDVs)
          </h3>
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {pdvs.length === 0 ? (
              <span style={{ fontSize: '0.85rem', color: '#a0aec0' }}>Nenhum PDV monitorado.</span>
            ) : (
              pdvs.map(pdv => (
                <div key={pdv.id} className={styles.pdvItem}>
                  <span className={pdv.status_conexao === 'ONLINE' ? styles.dotGreen : styles.dotRed}></span>
                  <span style={{ flex: 1, color: '#4a5568' }}>{pdv.loja}</span>
                  <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>
                    {pdv.status_conexao}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
