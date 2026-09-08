'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from './atendimento.module.css';

// Idealmente instanciado em um arquivo src/lib/supabase.ts
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

export default function CentralAtendimento() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [pdvs, setPdvs] = useState<any[]>([]);
  const [mensagem, setMensagem] = useState('');
  const [chatLog, setChatLog] = useState<{ id: string; tipo: string; conteudo: string }[]>([]);

  useEffect(() => {
    // 1. Carregar dados iniciais
    const fetchData = async () => {
      const { data: chamados } = await supabase.from('tickets').select('*').order('criado_em', { ascending: false });
      if (chamados) setTickets(chamados);

      const { data: statusRede } = await supabase.from('status_pdv').select('*');
      if (statusRede) setPdvs(statusRede);
    };
    fetchData();

    // 2. Escutar novos tickets via TomTicket (INSERT)
    const ticketSubscription = supabase
      .channel('fila-chamados')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, (payload) => {
        setTickets((current) => [payload.new, ...current]);
        // Aqui você pode disparar um som de notificação (beep)
      })
      .subscribe();

    // 3. Escutar oscilações no Milvus (UPDATE)
    const pdvSubscription = supabase
      .channel('status-rede')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'status_pdv' }, (payload) => {
        setPdvs((current) =>
          current.map((pdv) => (pdv.loja === payload.new.loja ? payload.new : pdv))
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(ticketSubscription);
      supabase.removeChannel(pdvSubscription);
    };
  }, []);

  const enviarParaBanco = (conteudo: string, tipo: string) => {
    // Mocking the database insert for now
    setChatLog((current) => [...current, { id: Date.now().toString(), tipo, conteudo }]);
  };

  const handleEnviarMensagem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mensagem.trim() === '/video') {
      // Gera um link criptografado e único
      const hashSala = Buffer.from(`ticket-${Date.now()}`).toString('base64').replace(/=/g, '');
      const jitsiLink = `https://meet.jit.si/critel-suporte-${hashSala}`;
      
      // Dispara para a fila de mensagens do Supabase e subsequentemente para o WhatsApp
      enviarParaBanco(jitsiLink, 'LINK_VIDEO');
      setMensagem('');
      return;
    }

    // Fluxo normal de envio de texto...
    enviarParaBanco(mensagem, 'TEXTO');
    setMensagem('');
  };

  return (
    <div className={styles.container}>
      {/* Coluna 1: Menu Lateral */}
      <aside className={styles.menuArea}>
        <h2>Critel</h2>
        <nav style={{ marginTop: '2rem' }}>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ marginBottom: '1rem', cursor: 'pointer' }}>Visão Geral</li>
            <li style={{ marginBottom: '1rem', cursor: 'pointer' }}>Meus Chamados</li>
            <li style={{ marginBottom: '1rem', cursor: 'pointer' }}>Relatórios</li>
          </ul>
        </nav>
      </aside>

      {/* Coluna 2: Fila de Chamados */}
      <section className={styles.filaArea}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f7fafc', position: 'sticky', top: 0 }}>
          <h3 style={{ margin: 0 }}>Fila de Atendimento</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tickets.length === 0 ? (
            <div style={{ padding: '1rem', color: '#718096' }}>Nenhum chamado na fila.</div>
          ) : (
            tickets.map((ticket) => (
              <div key={ticket.id} className={styles.ticketCard}>
                <strong>{ticket.protocolo_origem}</strong>
                <div style={{ fontSize: '0.9rem', color: '#4a5568', marginTop: '4px' }}>{ticket.cliente}</div>
                <div style={{ fontSize: '0.8rem', color: '#a0aec0', marginTop: '4px' }}>{ticket.titulo}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Coluna 3: Chat Ativo */}
      <main className={styles.chatArea}>
        <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f7fafc' }}>
          <h3 style={{ margin: 0 }}>Atendimento Ativo</h3>
        </div>
        
        <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', backgroundColor: '#e5ded8' }}>
          {/* Mensagens do Chat Log */}
          {chatLog.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#718096', marginTop: '2rem' }}>Nenhuma mensagem. Digite /video para iniciar uma chamada de vídeo.</p>
          ) : (
            chatLog.map((msg) => (
              <div key={msg.id} style={{ marginBottom: '1rem', textAlign: 'right' }}>
                <div style={{ 
                  display: 'inline-block', 
                  backgroundColor: '#d9fdd3', 
                  padding: '10px 15px', 
                  borderRadius: '10px',
                  maxWidth: '80%',
                  textAlign: 'left'
                }}>
                  {msg.tipo === 'LINK_VIDEO' ? (
                    <span>🎥 Sala de vídeo criada:<br/><a href={msg.conteudo} target="_blank" rel="noreferrer" style={{ color: '#3182ce', textDecoration: 'underline' }}>{msg.conteudo}</a></span>
                  ) : (
                    <span>{msg.conteudo}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Controlado */}
        <div style={{ padding: '1rem', borderTop: '1px solid #e2e8f0', backgroundColor: '#f0f2f5' }}>
          <form onSubmit={handleEnviarMensagem} style={{ display: 'flex', gap: '10px' }}>
            <input 
              type="text" 
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Digite sua mensagem ou /video para criar uma sala Jitsi" 
              style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e0', outline: 'none' }}
            />
            <button type="submit" style={{ padding: '12px 24px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              Enviar
            </button>
          </form>
        </div>
      </main>

      {/* Coluna 4: Status de Rede (Milvus Proxy) */}
      <aside className={styles.statusArea}>
        <h3 style={{ margin: 0, marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>Status PDVs</h3>
        {pdvs.length === 0 ? (
          <div style={{ color: '#718096', fontSize: '0.9rem' }}>Carregando status da rede...</div>
        ) : (
          pdvs.map((pdv) => (
            <div key={pdv.id || pdv.loja} className={styles.pdvItem}>
              <span className={pdv.status_conexao === 'ONLINE' ? styles.dotGreen : styles.dotRed}></span>
              <span style={{ fontWeight: 500, color: '#2d3748' }}>{pdv.loja}</span>
            </div>
          ))
        )}
      </aside>
    </div>
  );
}
