'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './atendimento.module.css';
import { Send, User, Phone, Clock, Search, Bot } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

export default function CentralAtendimento() {
  const [conversas, setConversas] = useState<any[]>([]);
  const [conversaAtiva, setConversaAtiva] = useState<any | null>(null);
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [inputMensagem, setInputMensagem] = useState('');
  const [buscando, setBuscando] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Carregar as conversas e escutar atualizações
  useEffect(() => {
    const carregarConversas = async () => {
      const { data } = await supabase
        .from('whatsapp_conversas')
        .select('*')
        .order('ultima_mensagem_data', { ascending: false });
      if (data) setConversas(data);
    };
    
    carregarConversas();

    const subConversas = supabase
      .channel('lista-conversas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_conversas' }, (payload) => {
        carregarConversas(); // Recarrega a lista para manter a ordem correta
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subConversas);
    };
  }, []);

  // 2. Carregar as mensagens da conversa selecionada e escutar novas mensagens
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
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'whatsapp_mensagens', filter: `conversa_id=eq.${conversaAtiva.id}` }, (payload) => {
        setMensagens((current) => current.map((msg) => msg.id === payload.new.id ? payload.new : msg));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subMensagens);
    };
  }, [conversaAtiva?.id]);

  const rolarParaBaixo = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMensagem.trim() || !conversaAtiva) return;

    const texto = inputMensagem;
    setInputMensagem(''); // Limpa otimisticamente
    setBuscando(true);

    try {
      await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: conversaAtiva.telefone,
          message: texto,
          conversaId: conversaAtiva.id
        })
      });
    } catch (error) {
      console.error('Erro ao enviar', error);
      alert('Erro ao enviar mensagem.');
    } finally {
      setBuscando(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Coluna 1: Menu Lateral */}
      <aside className={styles.menuArea}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '2rem' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#25D366', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Bot size={24} />
          </div>
          <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Critel Chat</h2>
        </div>
        
        <nav>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#e2e8f0', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
              <Search size={18} /> Atendimentos
            </li>
            <li style={{ padding: '10px', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '10px' }}>
              <Phone size={18} /> Contatos
            </li>
            <li style={{ padding: '10px', color: '#4a5568', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', marginTop: '10px' }}>
              <Clock size={18} /> Histórico
            </li>
          </ul>
        </nav>
      </aside>

      {/* Coluna 2: Lista de Conversas (Fila) */}
      <section className={styles.filaArea}>
        <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', position: 'sticky', top: 0 }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>Conversas Ativas ({conversas.length})</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {conversas.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#a0aec0' }}>
              Nenhuma mensagem recebida ainda.<br/>Mande um "Oi" para o número da Meta!
            </div>
          ) : (
            conversas.map((conversa) => (
              <div 
                key={conversa.id} 
                className={styles.ticketCard}
                style={{ 
                  cursor: 'pointer',
                  borderLeft: conversaAtiva?.id === conversa.id ? '4px solid #25D366' : '4px solid transparent',
                  backgroundColor: conversaAtiva?.id === conversa.id ? '#f0fff4' : '#fff'
                }}
                onClick={() => setConversaAtiva(conversa)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <strong style={{ fontSize: '1rem', color: '#2d3748' }}>{conversa.nome_perfil || 'Desconhecido'}</strong>
                  <span style={{ fontSize: '0.7rem', color: '#a0aec0' }}>
                    {new Date(conversa.ultima_mensagem_data).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#718096', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Phone size={14} /> +{conversa.telefone}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Coluna 3: Chat Box */}
      <main className={styles.chatArea}>
        {conversaAtiva ? (
          <>
            {/* Header do Chat */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#fff', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: '45px', height: '45px', backgroundColor: '#cbd5e0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                <User size={24} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#2d3748' }}>{conversaAtiva.nome_perfil}</h3>
                <span style={{ fontSize: '0.85rem', color: '#718096' }}>+{conversaAtiva.telefone}</span>
              </div>
            </div>
            
            {/* Corpo do Chat */}
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
                        position: 'relative'
                      }}>
                        <span style={{ fontSize: '0.95rem', color: '#111b21', whiteSpace: 'pre-wrap' }}>
                          {msg.conteudo}
                        </span>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                          <span style={{ fontSize: '0.65rem', color: '#667781' }}>
                            {new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isInbound && (
                            <span style={{ fontSize: '0.65rem', color: msg.status === 'read' ? '#53bdeb' : '#8696a0' }}>
                              {msg.status === 'sent' ? '✓' : '✓✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Input Footer */}
            <div style={{ padding: '1rem 1.5rem', backgroundColor: '#f0f2f5' }}>
              <form onSubmit={handleEnviarMensagem} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                  type="text" 
                  value={inputMensagem}
                  onChange={(e) => setInputMensagem(e.target.value)}
                  placeholder="Digite uma mensagem..." 
                  style={{ flex: 1, padding: '14px 20px', borderRadius: '24px', border: 'none', outline: 'none', fontSize: '1rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
                  disabled={buscando}
                />
                <button 
                  type="submit" 
                  disabled={buscando || !inputMensagem.trim()}
                  style={{ width: '48px', height: '48px', backgroundColor: '#00a884', color: '#fff', border: 'none', borderRadius: '50%', cursor: inputMensagem.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: inputMensagem.trim() ? 1 : 0.6 }}
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f2f5', color: '#41525d' }}>
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <div style={{ marginBottom: '1.5rem', color: '#00a884' }}>
                <Bot size={80} />
              </div>
              <h1 style={{ fontWeight: 300, margin: 0, marginBottom: '1rem' }}>Critel Atendimento</h1>
              <p style={{ margin: 0, color: '#667781' }}>Selecione um contato na fila à esquerda para iniciar o atendimento integrado ao WhatsApp.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
