'use client';

import React from 'react';
import { LifeBuoy, Book, MessageCircle, Phone, Mail, FileText } from 'lucide-react';

export default function AjudaPage() {
  return (
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>Ajuda e Suporte</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Precisa de assistência técnica ou treinamento? Estamos aqui para ajudar.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        <div style={{ 
          background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center'
        }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <MessageCircle size={32} color="#3b82f6" />
          </div>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>Chat em Tempo Real</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Fale diretamente com um especialista do suporte N2.</p>
          <button style={{ 
            marginTop: 'auto', background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 24px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600, width: '100%' 
          }}>
            Iniciar Chat
          </button>
        </div>

        <div style={{ 
          background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center'
        }}>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <Phone size={32} color="#10b981" />
          </div>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>Suporte Telefônico</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Em caso de emergências de infraestrutura, ligue para nós.</p>
          <div style={{ marginTop: 'auto', background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '10px 24px', borderRadius: '8px', width: '100%', fontWeight: 'bold' }}>
            0800 123 4567
          </div>
        </div>

        <div style={{ 
          background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px',
          display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', textAlign: 'center'
        }}>
          <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '50%' }}>
            <Mail size={32} color="#8b5cf6" />
          </div>
          <h3 style={{ margin: 0, color: '#f8fafc', fontSize: '1.2rem' }}>Abertura de Ticket</h3>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: 0 }}>Envie um email detalhado relatando problemas ou bugs do sistema.</p>
          <button style={{ 
            marginTop: 'auto', background: '#1e293b', color: '#fff', border: '1px solid #334155', padding: '10px 24px', 
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600, width: '100%' 
          }}>
            suporte@critel.com.br
          </button>
        </div>

      </div>

      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: '0 0 16px 0', color: '#f8fafc' }}>Perguntas Frequentes</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[
            'Como redefinir a minha senha do sistema?',
            'Qual o SLA padrão para os chamados da Bacio di Latte?',
            'Como extrair o relatório de Acompanhamento CRM?',
            'O que fazer se um equipamento PDV ficar offline no monitoramento?'
          ].map((faq, i) => (
            <div key={i} style={{ 
              background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#e2e8f0' }}>
                <FileText size={18} color="#64748b" />
                {faq}
              </div>
              <span style={{ color: '#3b82f6', fontWeight: 500 }}>Ler Artigo</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
