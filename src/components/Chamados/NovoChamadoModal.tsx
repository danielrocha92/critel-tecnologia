'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Paperclip, Bold, Italic, Underline, Type, AlignLeft, List, ListOrdered, Quote, Link2, Image as ImageIcon, Plus, BookTemplate } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';

const supabase = createClient();

interface NovoChamadoModalProps {
  onClose: () => void;
}

export default function NovoChamadoModal({ onClose }: NovoChamadoModalProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    cliente: '',
    departamento: '',
    assunto: '',
    prioridade: '',
    atendente: ''
  });

  const [tecnicos, setTecnicos] = useState<{user_id: string, nome: string, cargo: string}[]>([]);

  useEffect(() => {
    const fetchTecnicos = async () => {
      const { data, error } = await supabase
        .from('perfis')
        .select('user_id, nome, cargo')
        .eq('status', 'ATIVO')
        .eq('cargo', 'TECNICO'); // Filtrar apenas técnicos
      
      if (!error && data) {
        // Filtrar opcionalmente apenas técnicos ou deixar todos os ativos
        setTecnicos(data);
      }
    };
    fetchTecnicos();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormat = (command: string, value?: string) => {
    document.execCommand(command, false, value);
  };

  const handleCreateTicket = async () => {
    const descricaoFinal = messageRef.current?.innerHTML || '';
    if (!formData.cliente || !formData.assunto || !descricaoFinal) {
      alert('Por favor, preencha o Cliente, Assunto e Mensagem.');
      return;
    }

    setLoading(true);
    const protocolo = `OS-${Date.now()}`;
    
    const payload: any = {
      protocolo_origem: protocolo,
      cliente: formData.cliente,
      titulo: formData.assunto,
      descricao: descricaoFinal,
      departamento: formData.departamento,
      prioridade: formData.prioridade,
      status: formData.atendente ? 'ABERTO' : 'NOVO' // Se já tem técnico, pode ser ABERTO
    };

    if (formData.atendente) {
      payload.tecnico_id = formData.atendente;
    }

    try {
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();
      setLoading(false);

      if (!response.ok) {
        console.error('Erro ao criar OS:', result.error);
        alert('Erro ao criar Ordem de Serviço.');
      } else {
        window.location.reload();
      }
    } catch (err) {
      setLoading(false);
      console.error('Erro ao chamar a API:', err);
      alert('Erro de conexão ao criar a Ordem de Serviço.');
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
            <div style={{ gridColumn: '2 / 3' }}>
              <select 
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                style={{
                  background: '#1e2230', border: '1px solid #32394c', color: '#94a3b8',
                  padding: '10px 14px', borderRadius: '4px', fontSize: '0.9rem', width: '100%', outline: 'none', appearance: 'none'
                }}
              >
                <option value="">Escolher cliente...</option>
                <option value="Bacio di Latte">Bacio di Latte</option>
                <option value="Ofner">Ofner</option>
                <option value="KFC Brasil">KFC Brasil</option>
                <option value="Burger King">Burger King</option>
                <option value="Pizza Hut">Pizza Hut</option>
              </select>
            </div>
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

          {/* Mensagem (Rich Text) */}
          <div className="form-row-start">
            <label className="form-label" style={{ marginTop: '12px' }}>Mensagem:</label>
            <div style={{ gridColumn: '2 / 3', background: '#1e2230', border: '1px solid #32394c', borderRadius: '4px', display: 'flex', flexDirection: 'column' }}>
              <div 
                ref={messageRef}
                contentEditable
                style={{
                  background: 'transparent', border: 'none', color: '#f8fafc',
                  padding: '16px', fontSize: '0.95rem', width: '100%', outline: 'none', 
                  minHeight: '200px', overflowY: 'auto'
                }}
              />
              <div style={{ padding: '12px 16px', borderTop: '1px solid #32394c', display: 'flex', gap: '16px', color: '#94a3b8', alignItems: 'center', flexWrap: 'wrap' }}>
                <Bold size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{e.preventDefault(); handleFormat('bold')}} />
                <Italic size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{e.preventDefault(); handleFormat('italic')}} />
                <Underline size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{e.preventDefault(); handleFormat('underline')}} />
                <Type size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{e.preventDefault(); handleFormat('fontSize', '4')}} />
                <div style={{ width: '1px', height: '16px', background: '#32394c', margin: '0 4px' }} />
                <AlignLeft size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{e.preventDefault(); handleFormat('justifyLeft')}} />
                <List size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{e.preventDefault(); handleFormat('insertUnorderedList')}} />
                <ListOrdered size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{e.preventDefault(); handleFormat('insertOrderedList')}} />
                <Quote size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{e.preventDefault(); handleFormat('formatBlock', 'BLOCKQUOTE')}} />
                <div style={{ width: '1px', height: '16px', background: '#32394c', margin: '0 4px' }} />
                <Link2 size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{
                  e.preventDefault();
                  const url = prompt('Digite a URL:');
                  if(url) handleFormat('createLink', url);
                }} />
                <ImageIcon size={16} style={{cursor: 'pointer'}} onMouseDown={(e)=>{
                  e.preventDefault();
                  const url = prompt('URL da Imagem:');
                  if(url) handleFormat('insertImage', url);
                }} />
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
                {tecnicos.map(tec => (
                  <option key={tec.user_id} value={tec.user_id}>
                    {tec.nome} ({tec.cargo === 'TECNICO' ? 'Técnico' : tec.cargo})
                  </option>
                ))}
              </select>
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
            <label style={{ 
              background: '#252a38', color: '#f8fafc', border: '1px solid #32394c', 
              padding: '10px 16px', borderRadius: '4px', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <input type="file" hidden onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
              <Paperclip size={16} /> {file ? file.name : 'Anexar'}
            </label>
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
