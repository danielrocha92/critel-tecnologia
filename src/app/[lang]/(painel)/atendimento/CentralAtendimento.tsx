'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createClient } from '../../../../utils/supabase/client';
import { useCentralAtendimento } from '../../../../hooks/useCentralAtendimento';
import styles from './atendimento.module.css';
import { User, Trash2, Printer, Pencil, History, X } from 'lucide-react';
import { DashboardTickets } from '../../../../components/Chamados/DashboardTickets';
import { ITicket } from '../../../../types/ticket';
import { File, Download } from 'lucide-react';

const supabase = createClient();

type TicketAttachment = {
  url: string;
  nome_arquivo: string;
  tamanho_bytes?: number | null;
};

export default function CentralAtendimento({ ticketId }: { ticketId?: string }) {
  return (
    <Suspense fallback={<div className={styles.loadingEmpty}>Carregando chamados...</div>}>
      <CentralAtendimentoContent routeTicketId={ticketId} />
    </Suspense>
  );
}

function CentralAtendimentoContent({ routeTicketId }: { routeTicketId?: string }) {
  const {
    tickets,
    perfis,
    operadorAtual,
    loading,
    error: ticketsError,
    hasMoreTickets,
    loadingMoreTickets,
    loadMoreTickets,
  } = useCentralAtendimento();

  const searchParams = useSearchParams();
  const [ticketAtivo, setTicketAtivo] = useState<ITicket | null>(null);
  const [isMaisDropdownOpen, setIsMaisDropdownOpen] = useState(false);
  const safeDateValue = (value?: string | number | Date | null) => {
    if (value === undefined || value === null || value === '') return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };
  const [isMilvusIframeOpen, setIsMilvusIframeOpen] = useState(false);
  const [anexos, setAnexos] = useState<TicketAttachment[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getAtendenteNome = (id: string | null | undefined) => {
    if (!id) return 'Sem Atendente Vinculado';
    const p = perfis.find(p => String(p.user_id) === String(id));
    return p ? `${p.nome} - Critel Tecnologia` : 'Alocado';
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setSelectedImage((target as HTMLImageElement).src);
    } else if (target.tagName === 'A' && target.getAttribute('href')?.match(/\.(jpeg|jpg|gif|png)$/i)) {
      e.preventDefault();
      setSelectedImage(target.getAttribute('href')!);
    }
  };

  const pathname = usePathname();
  const router = useRouter();
  const lang = pathname.split('/')[1] || 'pt';
  const activeFilter = pathname.includes('/my-tickets/opened')
    ? 'abertos'
    : pathname.includes('/my-tickets/closed')
      ? 'finalizados'
      : searchParams.get('filter') || 'todos';
  const isMeus = pathname.includes('/my-tickets')
    ? true
    : pathname.includes('/all-tickets')
      ? false
      : searchParams.get('meus') === 'true';
  const handleBackToTickets = () => {
    if (routeTicketId) {
      router.push(`/${lang}/os`);
      return;
    }
    setTicketAtivo(null);
  };

  useEffect(() => {
    const resolveTicket = async () => {
      const tid = routeTicketId ?? searchParams.get('ticket_id');
      if (tid && ticketAtivo?.id !== tid) {
        const found = tickets.find((ticket) => ticket.id === tid);
        if (found) {
          toast.success('Chamado encontrado na lista carregada.');
          setTicketAtivo(found);
        } else if (!loading) {
          toast.info('Buscando chamado no banco de dados...');
          const supabase = createClient();
          const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('id', tid)
            .is('tomticket_id', null)
            .not('protocolo_origem', 'ilike', 'DEBUG-%')
            .maybeSingle();
          if (data && !error) {
            toast.success('Chamado carregado do banco.');
            setTicketAtivo(data);
          } else {
            toast.error(`Falha ao buscar chamado: ${error?.message || 'registro não encontrado'}`);
          }
        }
      }
    };

    void resolveTicket();
  }, [routeTicketId, searchParams, tickets, ticketAtivo, loading]);
  // Edit Form States
  const [editForm, setEditForm] = useState({
    titulo: '',
    descricao: '',
    departamento: '',
    categoria: '',
    prioridade: ''
  });
  
  // Fetch anexos when ticketAtivo changes
  useEffect(() => {
    const fetchAnexos = async () => {
      if (!ticketAtivo) {
        setAnexos([]);
        return;
      }
      const { data, error } = await supabase
        .from('ticket_anexos')
        .select('*')
        .eq('ticket_id', ticketAtivo.id);
      
      if (data && !error) {
        setAnexos(data as TicketAttachment[]);
      }
    };
    fetchAnexos();
  }, [ticketAtivo]);

  useEffect(() => {
    if (!ticketAtivo) return;

    const verificarMilvus = async () => {
      try {
        await fetch('/api/milvus/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ loja: ticketAtivo.cliente }),
        });
      } catch (milvusError) {
        console.error('Erro ao consultar Milvus:', milvusError);
      }
    };

    void verificarMilvus();
  }, [ticketAtivo?.cliente, ticketAtivo?.id]);


  return (
    <div className={styles.container}>
      {ticketsError && <div className={styles.errorMessage} role="alert">{ticketsError}</div>}
      {!ticketAtivo ? (
        <DashboardTickets 
          tickets={tickets}
          perfis={perfis}
          operadorAtual={operadorAtual}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          activeFilter={activeFilter}
          isMeus={isMeus}
          hasMoreTickets={hasMoreTickets}
          loadingMoreTickets={loadingMoreTickets}
          onLoadMoreTickets={() => void loadMoreTickets()}
          onSelectTicket={(ticket) => {
            setTicketAtivo(ticket);
          }}
        />
      ) : (
        <div className={styles.innerViewContainer}>
          <div className={styles.innerHeader}>
            <div className={styles.detailHeading}>
              <button className={styles.btnBack} onClick={handleBackToTickets} title="Voltar" aria-label="Voltar para ordens de serviço">
                ⬅
              </button>
              <div className={styles.detailHeadingText}>
                <p className={styles.detailEyebrow}>
                  Detalhes do Chamado <span>#{ticketAtivo.protocolo_origem || ticketAtivo.id.substring(0, 8)}</span>
                </p>
                <h1 className={styles.detailTitle}>{ticketAtivo.titulo}</h1>
                <div className={styles.detailMeta}>
                  <span className={styles.detailStatus}>{ticketAtivo.status || 'Sem status'}</span>
                  <span>{ticketAtivo.cliente || 'Cliente não informado'}</span>
                </div>
              </div>
            </div>
            <div className={styles.headerActionsGroup}>
              <div className={styles.dropdownWrapper}>
                <button 
                  className={styles.btnMais} 
                  onClick={() => setIsMaisDropdownOpen(!isMaisDropdownOpen)}
                >
                  Mais v
                </button>
                {isMaisDropdownOpen && (
                  <div className={styles.maisDropdown}>
                    <button className={styles.dropdownItem}><Trash2 size={16} /> Excluir</button>
                    <button className={styles.dropdownItem}><Printer size={16} /> Imprimir</button>
                    <button 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setEditForm({
                          titulo: ticketAtivo?.titulo || '',
                          descricao: ticketAtivo?.descricao || '',
                          departamento: ticketAtivo?.departamento || '',
                          categoria: ticketAtivo?.categoria || '',
                          prioridade: ticketAtivo?.prioridade || 'Baixa'
                        });
                        setIsEditModalOpen(true);
                        setIsMaisDropdownOpen(false);
                      }}
                    >
                      <Pencil size={16} /> Editar
                    </button>
                    <button className={styles.dropdownItem}><History size={16} /> Log de Alterações</button>
                  </div>
                )}
              </div>
              <button className={styles.btnFinalizar}>Finalizar</button>
              <button className={styles.btnCancelar}>Cancelar</button>
            </div>
          </div>

          <div className={styles.innerBody}>
            {/* Coluna Esquerda: Timeline e Resposta */}
            <div className={styles.innerTimeline}>
              <div className={styles.timelineCard}>
                <div className={styles.timelineHeader}>
                  <div className={styles.timelineUser}>
                    <div className={styles.timelineAvatar}>
                      <User size={20} color="#64748b" />
                    </div>
                    <div>
                      <span className={styles.timelineName}>{ticketAtivo.cliente}</span>
                      <span className={styles.timelineRole}>Cliente</span>
                    </div>
                  </div>
                  <div className={styles.timelineDate}>
                    {safeDateValue(ticketAtivo.criado_em)?.toLocaleDateString() || '-'} {safeDateValue(ticketAtivo.criado_em)?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                  </div>
                </div>
                <div 
                  className={styles.timelineContent} 
                  dangerouslySetInnerHTML={{ __html: ticketAtivo.descricao || '' }} 
                  onClick={handleTimelineClick}
                />

                {anexos && anexos.length > 0 && (
                  <div className={styles.attachmentsSection}>
                    <h5 className={styles.attachmentsTitle}>Anexos</h5>
                    <div className={styles.attachmentsList}>
                      {anexos.map((anexo, idx) => (
                        <a 
                          key={idx} 
                          href={anexo.url} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => {
                            if (anexo.url.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
                              e.preventDefault();
                              setSelectedImage(anexo.url);
                            }
                          }}
                          className={styles.attachmentLink}
                        >
                          <File size={14} /> {anexo.nome_arquivo} {anexo.tamanho_bytes ? `(${(anexo.tamanho_bytes / 1024).toFixed(1)} KB)` : ''}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Coluna Direita: Informações */}
            <div className={styles.innerSidebar}>
              {/* Card de Anexos */}
              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Anexos</h4>
                {anexos.length === 0 ? (
                  <div className={styles.noAttachment}>Nenhum anexo encontrado.</div>
                ) : (
                  <div className={styles.attachmentListWrapper}>
                    {anexos.map((anexo, i) => (
                      <div key={i} className={styles.attachmentRow}>
                        <File size={16} color="#00d2ff" className={styles.attachmentIcon} />
                        <div className={styles.attachmentInfoWrapper}>
                          <a 
                            href={anexo.url} 
                            target="_blank" 
                            rel="noreferrer"
                            className={styles.attachmentFileName}
                          >
                            {anexo.nome_arquivo}
                          </a>
                          {anexo.tamanho_bytes && (
                            <span className={styles.attachmentSize}>
                              {(anexo.tamanho_bytes / 1024).toFixed(1)} KB
                            </span>
                          )}
                        </div>
                        <a href={anexo.url} download target="_blank" rel="noreferrer" className={styles.attachmentDownload}>
                          <Download size={16} />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Cliente</h4>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Cliente:</span>
                  <span className={styles.panelValue}>{ticketAtivo.cliente}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Email:</span>
                  <span className={styles.panelValue}>{ticketAtivo.email_cliente || 'Não Informado'}</span>
                </div>
                <button className={styles.btnShowDetails}>Mostrar Detalhes</button>

              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Rótulos</h4>
                <select className={styles.selectInputLabel}>
                  <option>Adicionar rótulos</option>
                </select>
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Informações do Chamado</h4>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Responsável:</span>
                  <span className={styles.panelValue}>{getAtendenteNome(ticketAtivo.analista_id || ticketAtivo.tecnico_id)}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Departamento:</span>
                  <span className={styles.panelValue}>{ticketAtivo.departamento || 'Não Informado'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Categoria:</span>
                  <span className={styles.panelValue}>{ticketAtivo.categoria || 'Não Informada'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Criado em:</span>
                  <span className={styles.panelValue}>{safeDateValue(ticketAtivo.criado_em)?.toLocaleString([], { hour: '2-digit', minute: '2-digit' }) || '-'}</span>
                </div>
                <div className={styles.panelRow}>
                  <span className={styles.panelLabel}>Prioridade:</span>
                  <span className={styles.panelValue}>{ticketAtivo.prioridade || 'Não Definida'}</span>
                </div>
              </div>

              <div className={styles.panelCard}>
                <h4 className={styles.panelTitle}>Ferramentas Integradas</h4>
                <div className={styles.toolsWrapper}>
                  <a href="/api/cofre/stoq" target="_blank" rel="noreferrer" className={styles.btnStoq}>
                    Abrir Stoq ERP (Cofre)
                  </a>
                  <button 
                    onClick={() => setIsMilvusIframeOpen(true)}
                    className={styles.btnMilvus}
                  >
                    Abrir Milvus Proxy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Full-Screen do Milvus Proxy */}
      {isMilvusIframeOpen && (
        <div className={styles.milvusOverlay}>
          <div className={styles.milvusHeader}>
            <div>
              <h2 className={styles.milvusTitle}>Milvus IT Management</h2>
              <p className={styles.milvusSubtitle}>Acesso à plataforma pelo cofre Critel</p>
            </div>
            <button 
              onClick={() => setIsMilvusIframeOpen(false)}
              className={styles.milvusCloseBtn}
            >
              Fechar Milvus
            </button>
          </div>
          <iframe 
            src="http://localhost:3001" 
            className={styles.milvusIframe}
            allow="camera; microphone; display-capture; fullscreen; clipboard-read; clipboard-write"
          />
        </div>
      )}

      {/* Modal Editar Chamado */}
      {isEditModalOpen && (
        <div className={styles.modalEditOverlay}>
          <div className={styles.modalEditContent}>
            <div className={styles.modalEditHeader}>
              <h3 className={styles.modalEditTitle}>Editar Chamado</h3>
              <button onClick={() => setIsEditModalOpen(false)} className={styles.modalEditClose}>×</button>
            </div>
            
            <div className={styles.modalEditBody}>
              <div className={styles.modalEditRow}>
                <label className={styles.modalEditLabel}>Assunto:</label>
                <input 
                  type="text" 
                  value={editForm.titulo}
                  onChange={(e) => setEditForm({...editForm, titulo: e.target.value})}
                  className={styles.modalEditInput}
                />
              </div>

              <div className={styles.modalEditRowTop}>
                <label className={styles.modalEditLabelTop}>Mensagem:</label>
                <textarea 
                  value={editForm.descricao}
                  onChange={(e) => setEditForm({...editForm, descricao: e.target.value})}
                  className={styles.modalEditTextarea}
                />
              </div>

              <div className={styles.modalEditRow}>
                <label className={styles.modalEditLabel}>Departamento:</label>
                <select 
                  value={editForm.departamento}
                  onChange={(e) => setEditForm({...editForm, departamento: e.target.value})}
                  className={styles.modalEditSelect}
                >
                  <option value="">Selecione...</option>
                  <option value="FIN - Contas a Pagar">FIN - Contas a Pagar</option>
                  <option value="FIN - Contas a Receber">FIN - Contas a Receber</option>
                  <option value="TI - Lojas">TI - Lojas</option>
                  <option value="RH - Pessoal">RH - Pessoal</option>
                  <option value="Operações">Operações</option>
                </select>
              </div>

              <div className={styles.modalEditRow}>
                <label className={styles.modalEditLabel}>Categoria:</label>
                <select 
                  value={editForm.categoria}
                  onChange={(e) => setEditForm({...editForm, categoria: e.target.value})}
                  className={styles.modalEditSelect}
                >
                  <option value="">Selecione...</option>
                  <option value="Solicitação Cartão Vexpenses (Lojas)">Solicitação Cartão Vexpenses (Lojas)</option>
                  <option value="Hardware - PDV">Hardware - PDV</option>
                  <option value="Dúvida de Sistema">Dúvida de Sistema</option>
                </select>
              </div>

              <div className={styles.modalEditRow}>
                <label className={styles.modalEditLabel}>Prioridade:</label>
                <select 
                  value={editForm.prioridade}
                  onChange={(e) => setEditForm({...editForm, prioridade: e.target.value})}
                  className={styles.modalEditSelect}
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Normal">Normal</option>
                  <option value="Alta">Alta</option>
                  <option value="Urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div className={styles.modalEditFooter}>
              <button 
                className={styles.btnSave}
                onClick={async () => {
                  if (!ticketAtivo) return;
                  const { error } = await supabase.from('tickets').update({
                    titulo: editForm.titulo,
                    descricao: editForm.descricao,
                    departamento: editForm.departamento,
                    categoria: editForm.categoria,
                    prioridade: editForm.prioridade
                  }).eq('id', ticketAtivo.id);
                  
                  if (!error) {
                    setTicketAtivo({
                      ...(ticketAtivo as ITicket),
                      titulo: editForm.titulo,
                      descricao: editForm.descricao,
                      departamento: editForm.departamento,
                      categoria: editForm.categoria,
                      prioridade: editForm.prioridade
                    });
                    setIsEditModalOpen(false);
                  } else {
                    alert('Erro ao salvar: ' + error.message);
                  }
                }}
              >
                Salvar
              </button>
              <button onClick={() => setIsEditModalOpen(false)} className={styles.btnCancelEdit}>Fechar</button>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <div 
          onClick={() => setSelectedImage(null)}
          className={styles.lightboxOverlay}
        >
          <div className={styles.lightboxActions}>
            <a 
              href={selectedImage} 
              download 
              target="_blank" 
              rel="noreferrer" 
              className={styles.lightboxActionBtn}
              onClick={(e) => e.stopPropagation()}
            >
              <Download size={24} />
            </a>
            <button 
              onClick={() => setSelectedImage(null)} 
              className={styles.lightboxActionBtn}
            >
              <X size={24} />
            </button>
          </div>
          <img 
            src={selectedImage} 
            alt="Anexo ampliado" 
            className={styles.modalImage} 
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
