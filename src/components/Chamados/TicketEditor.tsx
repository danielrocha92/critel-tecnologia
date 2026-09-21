import React from 'react';
import styles from '../../app/[lang]/(painel)/atendimento/atendimento.module.css';

interface TicketEditorProps {
  replyText: string;
  setReplyText: (text: string) => void;
  isSendingReply: boolean;
  handleSendReply: () => void;
}

export function TicketEditor({ replyText, setReplyText, isSendingReply, handleSendReply }: TicketEditorProps) {
  return (
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
      <textarea 
        className={styles.replyTextarea} 
        placeholder="Escreva sua resposta aqui..."
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
      ></textarea>
      <div className={styles.replyActions}>
        <button 
          className={styles.btnSendReply} 
          onClick={handleSendReply}
          disabled={isSendingReply || !replyText.trim()}
        >
          {isSendingReply ? 'Enviando...' : 'Enviar Resposta v'}
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ background: 'transparent', border: '1px solid #32394c', padding: '8px 12px', borderRadius: '4px', color: '#cbd5e1', cursor: 'pointer' }}>📎</button>
          <button style={{ background: 'transparent', border: '1px solid #32394c', padding: '8px 12px', borderRadius: '4px', color: '#cbd5e1', cursor: 'pointer' }}>🕒</button>
        </div>
      </div>
    </div>
  );
}
