'use client';

import React from 'react';
import { LifeBuoy, Book, MessageCircle, Phone, Mail, FileText } from 'lucide-react';
import styles from './ajuda.module.css';

export default function AjudaPage() {
  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Ajuda e Suporte</h1>
        <p className={styles.subtitle}>Precisa de assistência técnica ou treinamento? Estamos aqui para ajudar.</p>
      </div>

      <div className={styles.cardsGrid}>
        
        <div className={styles.card}>
          <div className={styles.iconWrapperChat}>
            <MessageCircle size={32} color="#3b82f6" />
          </div>
          <h3 className={styles.cardTitle}>Chat em Tempo Real</h3>
          <p className={styles.cardDesc}>Fale diretamente com um especialista do suporte N2.</p>
          <button className={styles.btnPrimary}>
            Iniciar Chat
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrapperPhone}>
            <Phone size={32} color="#10b981" />
          </div>
          <h3 className={styles.cardTitle}>Suporte Telefônico</h3>
          <p className={styles.cardDesc}>Em caso de emergências de infraestrutura, ligue para nós.</p>
          <div className={styles.contactBox}>
            0800 123 4567
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.iconWrapperMail}>
            <Mail size={32} color="#8b5cf6" />
          </div>
          <h3 className={styles.cardTitle}>Abertura de Ticket</h3>
          <p className={styles.cardDesc}>Envie um email detalhado relatando problemas ou bugs do sistema.</p>
          <button className={styles.btnSecondary}>
            suporte@critel.com.br
          </button>
        </div>

      </div>

      <div className={styles.faqSection}>
        <h2 className={styles.faqTitle}>Perguntas Frequentes</h2>
        
        <div className={styles.faqList}>
          {[
            'Como redefinir a minha senha do sistema?',
            'Qual o SLA padrão para os chamados da Bacio di Latte?',
            'Como extrair o relatório de Acompanhamento CRM?',
            'O que fazer se um equipamento PDV ficar offline no monitoramento?'
          ].map((faq, i) => (
            <div key={i} className={styles.faqItem}>
              <div className={styles.faqQuestion}>
                <FileText size={18} color="#64748b" />
                {faq}
              </div>
              <span className={styles.faqAction}>Ler Artigo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
