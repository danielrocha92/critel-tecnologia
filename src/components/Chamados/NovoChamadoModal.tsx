'use client';

import React from 'react';
import { X, Paperclip, Bold, Italic, Underline, Type, AlignLeft, List, ListOrdered, Quote, Link2, Image as ImageIcon, Plus, BookTemplate } from 'lucide-react';

interface NovoChamadoModalProps {
  onClose: () => void;
}

export default function NovoChamadoModal({ onClose }: NovoChamadoModalProps) {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(11, 17, 32, 0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{
        background: '#161922', width: '95%', maxWidth: '1000px', height: '90vh',
        borderRadius: '8px', border: '1px solid #252a38', boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden'
      }}>
        
        {/* HEADER */}
        <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #252a38' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc', fontWeight: 600 }}>Novo Chamado</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* BODY (Scrollable) */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Cliente */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', alignItems: 'center', gap: '16px' }}>
            <label style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500, textAlign: 'right' }}>Cliente:</label>
            <input 
              type="text" 
              placeholder="Pesquisar cliente..." 
              style={{
                background: '#1e2230', border: '1px solid #32394c', color: '#f8fafc',
                padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none'
              }}
            />
            <button style={{ 
              background: 'transparent', border: '1px solid #f8fafc', color: '#f8fafc', fontWeight: 500, 
              fontSize: '0.85rem', cursor: 'pointer', padding: '8px 16px', borderRadius: '20px'
            }}>
              Criar Cliente...
            </button>
          </div>

          {/* Departamento */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', alignItems: 'center', gap: '16px' }}>
            <label style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500, textAlign: 'right' }}>Departamento:</label>
            <div style={{ gridColumn: '2 / 3' }}>
              <select style={{
                background: '#1e2230', border: '1px solid #32394c', color: '#94a3b8',
                padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none', appearance: 'none'
              }}>
                <option value="">Escolher departamento...</option>
                <option value="suporte">Suporte Técnico</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>
          </div>

          {/* Assunto */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', alignItems: 'center', gap: '16px' }}>
            <label style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500, textAlign: 'right' }}>Assunto:</label>
            <div style={{ gridColumn: '2 / 3' }}>
              <input 
                type="text" 
                style={{
                  background: '#1e2230', border: '1px solid #32394c', color: '#f8fafc',
                  padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Mensagem (Textarea com Toolbar Fake) */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', alignItems: 'flex-start', gap: '16px' }}>
            <label style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500, textAlign: 'right', marginTop: '12px' }}>Mensagem:</label>
            <div style={{ gridColumn: '2 / 3', background: '#1e2230', border: '1px solid #32394c', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
              <textarea 
                rows={10}
                style={{
                  background: 'transparent', border: 'none', color: '#f8fafc',
                  padding: '16px', fontSize: '0.95rem', width: '100%', outline: 'none', resize: 'vertical',
                  minHeight: '200px'
                }}
              />
              <div style={{ padding: '12px 16px', borderTop: '1px solid #32394c', display: 'flex', gap: '16px', color: '#94a3b8', alignItems: 'center' }}>
                <Bold size={16} style={{cursor: 'pointer'}} />
                <Italic size={16} style={{cursor: 'pointer'}} />
                <Underline size={16} style={{cursor: 'pointer'}} />
                <Type size={16} style={{cursor: 'pointer'}} />
                <div style={{ width: '1px', height: '16px', background: '#32394c', margin: '0 4px' }} />
                <AlignLeft size={16} style={{cursor: 'pointer'}} />
                <List size={16} style={{cursor: 'pointer'}} />
                <ListOrdered size={16} style={{cursor: 'pointer'}} />
                <Quote size={16} style={{cursor: 'pointer'}} />
                <div style={{ width: '1px', height: '16px', background: '#32394c', margin: '0 4px' }} />
                <Link2 size={16} style={{cursor: 'pointer'}} />
                <ImageIcon size={16} style={{cursor: 'pointer'}} />
                <Plus size={16} style={{cursor: 'pointer'}} />
                <div style={{ flex: 1 }} />
                <BookTemplate size={16} style={{cursor: 'pointer'}} />
              </div>
            </div>
          </div>

          {/* Prioridade */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', alignItems: 'center', gap: '16px' }}>
            <label style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500, textAlign: 'right' }}>Prioridade:</label>
            <div style={{ gridColumn: '2 / 3' }}>
              <select style={{
                background: '#1e2230', border: '1px solid #32394c', color: '#94a3b8',
                padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none', appearance: 'none'
              }}>
                <option value="">Definir Prioridade...</option>
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Atendente (Técnicos Cadastrados) */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', alignItems: 'center', gap: '16px' }}>
            <label style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 500, textAlign: 'right' }}>Atendente:</label>
            <div style={{ gridColumn: '2 / 3' }}>
              <select style={{
                background: '#1e2230', border: '1px solid #32394c', color: '#94a3b8',
                padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none', appearance: 'none'
              }}>
                <option value="">Escolher atendente...</option>
                <option value="daniel">Daniel (Técnico)</option>
                <option value="luiz">Luiz (Técnico)</option>
                <option value="joao">João (Técnico N2)</option>
                <option value="maria">Maria (Especialista Redes)</option>
              </select>
            </div>
          </div>

          {/* Checkboxes e Opções */}
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr auto', gap: '16px', marginTop: '8px' }}>
            <div /> {/* Spacer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }} />
                Receber respostas do cliente por email
              </label>
              
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e2e8f0', fontSize: '0.9rem', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#3b82f6', width: '16px', height: '16px' }} />
                Enviar notificações por email para o cliente
              </label>

              <div>
                <button style={{ 
                  background: 'transparent', border: '1px solid #32394c', color: '#e2e8f0', 
                  padding: '6px 12px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer'
                }}>
                  Mais Opções
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div style={{ padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #252a38', background: '#1a1d26' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ 
              background: '#10b981', color: '#fff', border: 'none', 
              padding: '10px 24px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' 
            }}>
              Criar Chamado
            </button>
            <button style={{ 
              background: '#252a38', color: '#f8fafc', border: '1px solid #32394c', 
              padding: '10px 16px', borderRadius: '4px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <Paperclip size={16} /> Anexar
            </button>
          </div>
          
          <button 
            onClick={onClose}
            style={{ 
              background: '#ef4444', color: '#fff', border: 'none', 
              padding: '10px 24px', borderRadius: '4px', fontWeight: 600, cursor: 'pointer' 
            }}
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
