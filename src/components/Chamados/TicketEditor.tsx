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
        <div className={styles.replyToolbarDivider}></div>
        <button>≡</button>
        <button>List</button>
        <div className={styles.replyToolbarDivider}></div>
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
        <div className={styles.replyActionsRight}>
          <button className={styles.replyActionButton}>📎</button>
          <button className={styles.replyActionButton}>🕒</button>
        </div>
      </div>
    </div>
  );
}
