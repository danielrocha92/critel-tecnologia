'use client';

import React, { useState } from 'react';
import { X, Paperclip, Bold, Italic, Underline, Type, AlignLeft, List, ListOrdered, Quote, Link2, Image as ImageIcon, Plus, BookTemplate } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

interface NovoChamadoModalProps {
  onClose: () => void;
}

export default function NovoChamadoModal({ onClose }: NovoChamadoModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    cliente: '',
    departamento: '',
    assunto: '',
    mensagem: '',
    prioridade: '',
    atendente: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreateTicket = async () => {
    if (!formData.cliente || !formData.assunto) {
      alert('Por favor, preencha o Cliente e o Assunto.');
      return;
    }

    setLoading(true);
    const protocolo = `OS-${Date.now()}`;
    
    const { error } = await supabase.from('tickets').insert({
      protocolo_origem: protocolo,
      cliente: formData.cliente,
      titulo: formData.assunto,
      descricao: formData.mensagem,
      departamento: formData.departamento,
      prioridade: formData.prioridade,
      status: 'NOVO' // Todo chamado novo começa como NOVO
    });

    setLoading(false);

    if (error) {
      console.error('Erro ao criar OS:', error);
      alert('Erro ao criar Ordem de Serviço.');
    } else {
      // Recarrega a página para puxar os dados atualizados
      window.location.reload();
    }
  };
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(11, 17, 32, 0.85)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      fontFamily: 'Inter, sans-serif'
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        .modal-container {
          width: 95%;
          max-width: 1000px;
          height: 90vh;
          border-radius: 8px;
        }
        .form-row {
          display: grid;
          grid-template-columns: 150px 1fr auto;
          align-items: center;
          gap: 16px;
        }
        .form-row-start {
          display: grid;
          grid-template-columns: 150px 1fr auto;
          align-items: flex-start;
          gap: 16px;
        }
        .form-label {
          color: #e2e8f0;
          font-size: 0.9rem;
          font-weight: 500;
          text-align: right;
        }
        .form-spacer {
          display: block;
        }
        @media (max-width: 768px) {
          .modal-container {
            width: 100%;
            height: 100%;
            border-radius: 0;
            border: none !important;
          }
          .form-row, .form-row-start {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          .form-label {
            text-align: left;
            margin-top: 8px;
          }
          .form-spacer {
            display: none;
          }
        }
      `}} />
      <div className="modal-container" style={{
        background: '#161922', 
        border: '1px solid #252a38', boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
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
          <div className="form-row">
            <label className="form-label">Cliente:</label>
            <input 
              type="text" 
              name="cliente"
              value={formData.cliente}
              onChange={handleChange}
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
          <div className="form-row">
            <label className="form-label">Departamento:</label>
            <div style={{ gridColumn: '2 / 3' }}>
              <select 
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                style={{
                  background: '#1e2230', border: '1px solid #32394c', color: '#94a3b8',
                  padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none', appearance: 'none'
                }}
              >
                <option value="">Escolher departamento...</option>
                <option value="suporte">Suporte Técnico</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>
          </div>

          {/* Assunto */}
          <div className="form-row">
            <label className="form-label">Assunto:</label>
            <div style={{ gridColumn: '2 / 3' }}>
              <input 
                type="text" 
                name="assunto"
                value={formData.assunto}
                onChange={handleChange}
                style={{
                  background: '#1e2230', border: '1px solid #32394c', color: '#f8fafc',
                  padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none'
                }}
              />
            </div>
          </div>

          {/* Mensagem (Textarea com Toolbar Fake) */}
          <div className="form-row-start">
            <label className="form-label" style={{ marginTop: '12px' }}>Mensagem:</label>
            <div style={{ gridColumn: '2 / 3', background: '#1e2230', border: '1px solid #32394c', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
              <textarea 
                rows={10}
                name="mensagem"
                value={formData.mensagem}
                onChange={handleChange}
                style={{
                  background: 'transparent', border: 'none', color: '#f8fafc',
                  padding: '16px', fontSize: '0.95rem', width: '100%', outline: 'none', resize: 'vertical',
                  minHeight: '200px'
                }}
              />
              <div style={{ padding: '12px 16px', borderTop: '1px solid #32394c', display: 'flex', gap: '16px', color: '#94a3b8', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <div className="form-row">
            <label className="form-label">Prioridade:</label>
            <div style={{ gridColumn: '2 / 3' }}>
              <select 
                name="prioridade"
                value={formData.prioridade}
                onChange={handleChange}
                style={{
                  background: '#1e2230', border: '1px solid #32394c', color: '#94a3b8',
                  padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none', appearance: 'none'
                }}
              >
                <option value="">Definir Prioridade...</option>
                <option value="baixa">Baixa</option>
                <option value="normal">Normal</option>
                <option value="alta">Alta</option>
                <option value="urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Atendente (Técnicos Cadastrados) */}
          <div className="form-row">
            <label className="form-label">Atendente:</label>
            <div style={{ gridColumn: '2 / 3' }}>
              <select 
                name="atendente"
                value={formData.atendente}
                onChange={handleChange}
                style={{
                  background: '#1e2230', border: '1px solid #32394c', color: '#94a3b8',
                  padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none', appearance: 'none'
                }}
              >
                <option value="">Escolher atendente...</option>
                <option value="daniel">Daniel (Técnico)</option>
                <option value="luiz">Luiz (Técnico)</option>
                <option value="joao">João (Técnico N2)</option>
                <option value="maria">Maria (Especialista Redes)</option>
              </select>
            </div>
          </div>

          {/* Checkboxes e Opções */}
          <div className="form-row-start" style={{ marginTop: '8px' }}>
            <div className="form-spacer" /> {/* Spacer */}
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
            <button 
              onClick={handleCreateTicket}
              disabled={loading}
              style={{ 
                background: '#10b981', color: '#fff', border: 'none', 
                padding: '10px 24px', borderRadius: '4px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Criando...' : 'Criar Chamado'}
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
