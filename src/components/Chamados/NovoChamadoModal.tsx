'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Paperclip, Bold, Italic, Underline, Type, AlignLeft, List, ListOrdered, Quote, Link2, Image as ImageIcon, Plus, BookTemplate } from 'lucide-react';
import { createClient } from '../../utils/supabase/client';
import styles from './NovoChamadoModal.module.css';

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
    endereco_loja: '',
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
    
    const finalHtml = formData.endereco_loja 
      ? `<div><strong>Endereço da Loja:</strong> ${formData.endereco_loja}</div><br/>${descricaoFinal}`
      : descricaoFinal;

    const payload: any = {
      protocolo_origem: protocolo,
      cliente: formData.cliente,
      titulo: formData.assunto,
      descricao: finalHtml,
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
    <div className={styles.overlay}>
      <div className={styles.modalContainer}>
        
        {/* HEADER */}
        <div className={styles.header}>
          <h2 className={styles.headerTitle}>Novo Chamado</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* BODY (Scrollable) */}
        <div className={styles.body}>
          
          {/* Cliente */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Cliente:</label>
            <div className={styles.inputWrapper}>
              <select 
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                className={styles.selectField}
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

          {/* Endereço da Loja */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Endereço da Loja:</label>
            <div className={styles.inputWrapper}>
              <input 
                type="text" 
                name="endereco_loja"
                value={formData.endereco_loja}
                onChange={handleChange}
                placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                className={styles.inputField}
              />
            </div>
          </div>

          {/* Departamento */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Departamento:</label>
            <div className={styles.inputWrapper}>
              <select 
                name="departamento"
                value={formData.departamento}
                onChange={handleChange}
                className={styles.selectField}
              >
                <option value="">Escolher departamento...</option>
                <option value="suporte">Suporte Técnico</option>
                <option value="financeiro">Financeiro</option>
              </select>
            </div>
          </div>

          {/* Assunto */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Assunto:</label>
            <div className={styles.inputWrapper}>
              <input 
                type="text" 
                name="assunto"
                value={formData.assunto}
                onChange={handleChange}
                className={styles.inputField}
              />
            </div>
          </div>

          {/* Mensagem (Rich Text) */}
          <div className={styles.formRowStart}>
            <label className={`${styles.formLabel} ${styles.msgLabel}`}>Mensagem:</label>
            <div className={styles.msgContainer}>
              <div 
                ref={messageRef}
                contentEditable
                className={styles.msgEditor}
              />
              <div className={styles.toolbar}>
                <Bold size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{e.preventDefault(); handleFormat('bold')}} />
                <Italic size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{e.preventDefault(); handleFormat('italic')}} />
                <Underline size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{e.preventDefault(); handleFormat('underline')}} />
                <Type size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{e.preventDefault(); handleFormat('fontSize', '4')}} />
                <div className={styles.toolbarDivider} />
                <AlignLeft size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{e.preventDefault(); handleFormat('justifyLeft')}} />
                <List size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{e.preventDefault(); handleFormat('insertUnorderedList')}} />
                <ListOrdered size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{e.preventDefault(); handleFormat('insertOrderedList')}} />
                <Quote size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{e.preventDefault(); handleFormat('formatBlock', 'BLOCKQUOTE')}} />
                <div className={styles.toolbarDivider} />
                <Link2 size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{
                  e.preventDefault();
                  const url = prompt('Digite a URL:');
                  if(url) handleFormat('createLink', url);
                }} />
                <ImageIcon size={16} className={styles.toolbarIcon} onMouseDown={(e)=>{
                  e.preventDefault();
                  const url = prompt('URL da Imagem:');
                  if(url) handleFormat('insertImage', url);
                }} />
                <div className={styles.toolbarSpacer} />
                <BookTemplate size={16} className={styles.toolbarIcon} />
              </div>
            </div>
          </div>

          {/* Prioridade */}
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Prioridade:</label>
            <div className={styles.inputWrapper}>
              <select 
                name="prioridade"
                value={formData.prioridade}
                onChange={handleChange}
                className={styles.selectField}
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
          <div className={styles.formRow}>
            <label className={styles.formLabel}>Atendente:</label>
            <div className={styles.inputWrapper}>
              <select 
                name="atendente"
                value={formData.atendente}
                onChange={handleChange}
                className={styles.selectField}
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
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            <button 
              onClick={handleCreateTicket}
              disabled={loading}
              className={styles.btnCreate}
            >
              {loading ? 'Criando...' : 'Criar Chamado'}
            </button>
            {file ? (
              <div className={styles.attachmentBadge}>
                <Paperclip size={16} /> 
                <span className={styles.attachmentName}>
                  {file.name}
                </span>
                <button 
                  onClick={() => setFile(null)} 
                  className={styles.btnRemoveAttachment}
                  title="Remover anexo"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className={styles.btnAttach}>
                <input type="file" hidden onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
                <Paperclip size={16} /> Anexar
              </label>
            )}
          </div>
          
          <button 
            onClick={onClose}
            className={styles.btnCancel}
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
