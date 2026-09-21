import React from 'react';
import { Phone, Send } from 'lucide-react';
import styles from '../../app/[lang]/(painel)/atendimento/atendimento.module.css';
import { ITicket, IWhatsAppConversation, IWhatsAppMessage, ILojaContato } from '../../types/ticket';

interface WhatsAppModalProps {
  isWppModalOpen: boolean;
  setIsWppModalOpen: (open: boolean) => void;
  conversaAtiva: IWhatsAppConversation | null;
  ticketAtivo: ITicket | null;
  mensagens: IWhatsAppMessage[];
  lojaContato: ILojaContato | null;
  setIsEditingContact: (editing: boolean) => void;
  inputMensagem: string;
  setInputMensagem: (msg: string) => void;
  handleEnviarMensagem: (e?: React.FormEvent | React.KeyboardEvent) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

export function WhatsAppModal({
  isWppModalOpen,
  setIsWppModalOpen,
  conversaAtiva,
  ticketAtivo,
  mensagens,
  lojaContato,
  setIsEditingContact,
  inputMensagem,
  setInputMensagem,
  handleEnviarMensagem,
  scrollRef
}: WhatsAppModalProps) {
  if (!isWppModalOpen) return null;

  return (
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
            onKeyDown={(e) => { if(e.key === 'Enter') handleEnviarMensagem(e); }}
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
  );
}
