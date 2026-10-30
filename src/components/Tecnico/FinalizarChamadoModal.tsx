'use client';

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { X, MapPin, MapPinOff, AlertTriangle, Send, Clock, Plus, Trash, Camera, Images } from 'lucide-react';
import SignatureCanvas, { type SignatureCanvas as SignatureCanvasInstance } from 'react-signature-canvas';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import type { User, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { ITicket, TicketEvidence } from '@/types/ticket';
import styles from './FinalizarChamadoModal.module.css';

const supabase = createClient();

interface FinalizarChamadoModalProps {
  ticket: ITicket;
  onClose: () => void;
  onSuccess: () => void;
}

type ExpenseDraft = { natureza: string; valor: string; anexo: string };

function toLocalDateTimeInput(date: Date) {
  const timezoneOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

export default function FinalizarChamadoModal({ ticket, onClose, onSuccess }: FinalizarChamadoModalProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>('');

  // Geolocation
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  // Form Fields
  const [horaInicio, setHoraInicio] = useState(() => toLocalDateTimeInput(
    ticket.check_in_at ? new Date(ticket.check_in_at) : ticket.criado_em ? new Date(ticket.criado_em) : new Date(Date.now() - 60 * 60 * 1000),
  ));
  const [horaTermino, setHoraTermino] = useState(() => toLocalDateTimeInput(new Date()));
  const [descricao, setDescricao] = useState('');
  const [materiais, setMateriais] = useState('');

  // Evidências
  const [evidenciasAntes, setEvidenciasAntes] = useState<TicketEvidence[]>([]);
  const [evidenciasDepois, setEvidenciasDepois] = useState<TicketEvidence[]>([]);
  const [loadingEvidence, setLoadingEvidence] = useState(true);
  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<string | null>(null);

  // Despesas
  const [despesas, setDespesas] = useState<ExpenseDraft[]>([{ natureza: '', valor: '', anexo: '' }]);

  // Signature
  const sigCanvas = useRef<SignatureCanvasInstance | null>(null);
  const beforeGalleryInput = useRef<HTMLInputElement>(null);
  const beforeCameraInput = useRef<HTMLInputElement>(null);
  const afterGalleryInput = useRef<HTMLInputElement>(null);
  const afterCameraInput = useRef<HTMLInputElement>(null);
  const selectedCause = ticket.causa_raiz || ticket.resolucao?.causaRaiz || '';
  const selectedCauseDetail = ticket.causa_raiz_detalhe || ticket.resolucao?.causaRaizDetalhe || '';
  const evidenceBeforeLabel = selectedCause
    ? `Comprovação da causa: ${selectedCauseDetail || selectedCause}`
    : 'Evidência do problema antes do atendimento';
  const evidenceAfterLabel = selectedCause
    ? `Resultado após a correção: ${selectedCauseDetail || selectedCause}`
    : 'Evidência do resultado após o atendimento';
  const canEditMedia = ticket.status === 'EM_ANDAMENTO';

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (error) {
        setError(`Não foi possível verificar a sessão: ${error.message}`);
        return;
      }
      setCurrentUser(data.user);
    };
    void loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadEvidence = async () => {
      try {
        const { data, error: loadError } = await supabase
          .from('ticket_evidences')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true });
        if (loadError) {
          setError('Não foi possível carregar as fotos já enviadas para esta OS.');
          console.error('Erro ao carregar evidências no modal:', loadError.message);
          return;
        }
        if (!isMounted || !data) return;
        setEvidenciasAntes((data as TicketEvidence[]).filter((item: TicketEvidence) => item.type === 'BEFORE'));
        setEvidenciasDepois((data as TicketEvidence[]).filter((item: TicketEvidence) => item.type === 'AFTER'));
      } finally {
        if (isMounted) setLoadingEvidence(false);
      }
    };

    void loadEvidence();
    const channel = supabase
      .channel(`modal_evidencias_${ticket.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_evidences', filter: `ticket_id=eq.${ticket.id}` }, (payload: RealtimePostgresChangesPayload<TicketEvidence & Record<string, unknown>>) => {
        const evidence = payload.new as TicketEvidence;
        const setter = evidence.type === 'BEFORE' ? setEvidenciasAntes : setEvidenciasDepois;
        setter((previous) => previous.some((item) => item.id === evidence.id) ? previous : [...previous, evidence]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'ticket_evidences', filter: `ticket_id=eq.${ticket.id}` }, (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
        const removedId = String((payload.old as { id?: string }).id || '');
        setEvidenciasAntes((previous) => previous.filter((item) => item.id !== removedId));
        setEvidenciasDepois((previous) => previous.filter((item) => item.id !== removedId));
      })
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [ticket.id]);

  const deleteEvidence = async (evidence: TicketEvidence) => {
    if (!window.confirm('Excluir esta foto permanentemente?')) return;
    setDeletingEvidenceId(evidence.id);
    try {
      const response = await fetch('/api/tecnico/excluir-evidencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidence_id: evidence.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível excluir a foto.');
      setEvidenciasAntes((previous) => previous.filter((item) => item.id !== evidence.id));
      setEvidenciasDepois((previous) => previous.filter((item) => item.id !== evidence.id));
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Não foi possível excluir a foto.');
    } finally {
      setDeletingEvidenceId(null);
    }
  };

  const captureLocation = useCallback(() => {
    setLocation(null);
    setGeoError(null);
    setIsLocating(true);

    if (!window.isSecureContext) {
      setGeoError('O GPS exige uma conexão segura (HTTPS). Abra o sistema pelo endereço HTTPS.');
      setIsLocating(false);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Este navegador não oferece suporte à localização GPS.');
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Permissão de localização negada. Autorize o acesso ao GPS nas configurações do navegador.',
          2: 'Não foi possível obter sua localização. Verifique se a localização está ativada e tente novamente.',
          3: 'Tempo esgotado ao obter a localização. Verifique o sinal e tente novamente.'
        };
        setGeoError(messages[err.code] || err.message || 'Falha ao obter a localização. Tente novamente.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    // Geolocation is a browser API; its callbacks update React state asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    captureLocation();
  }, [captureLocation]);

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const addDespesa = () => setDespesas([...despesas, { natureza: '', valor: '', anexo: '' }]);
  const removeDespesa = (index: number) => setDespesas(despesas.filter((_, i) => i !== index));
  const updateDespesa = (index: number, field: keyof ExpenseDraft, value: string) => {
    const newDespesas = [...despesas];
    newDespesas[index] = { ...newDespesas[index], [field]: value };
    setDespesas(newDespesas);
  };

  const formatCurrency = (value: string) => {
    const num = value.replace(/\D/g, '');
    if (!num) return "";
    const numValue = (parseInt(num) / 100).toFixed(2);
    return numValue.replace(".", ",").replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
  };

  const handleCurrencyChange = (index: number, val: string) => {
    const formatted = formatCurrency(val);
    updateDespesa(index, 'valor', formatted);
  };

  const handleDespesaFile = (e: ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      updateDespesa(index, 'anexo', event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadBase64 = async (path: string, base64: string): Promise<string> => {
    const res = await fetch(base64);
    const blob = await res.blob();

    const { error } = await supabase.storage
      .from('anexos')
      .upload(path, blob, { contentType: blob.type, upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('anexos').getPublicUrl(path);
    return urlData.publicUrl;
  };

  const uploadEvidenceFile = async (file: File, type: 'BEFORE' | 'AFTER') => {
      const formData = new FormData();
      formData.append('ticket_id', ticket.id);
      formData.append('type', type);
      formData.append('file', file);
      formData.append('lang', window.location.pathname.split('/')[1] || 'pt');
      const response = await fetch('/api/tecnico/evidencias', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível enviar a evidência.');
      return result.evidence as TicketEvidence;
  };

  const handleEvidenceSelection = async (
    event: ChangeEvent<HTMLInputElement>,
    type: 'BEFORE' | 'AFTER',
  ) => {
    const input = event.currentTarget;
    const selectedFiles = Array.from(input.files || []);
    if (selectedFiles.length === 0) return;
    if (ticket.status !== 'EM_ANDAMENTO') {
      setError('Só é possível adicionar mídia enquanto o chamado está em andamento.');
      input.value = '';
      return;
    }
    if (!currentUser) {
      setError('Usuário não autenticado.');
      input.value = '';
      return;
    }
    setError(null);
    input.value = '';
    setUploadingEvidence(true);
    try {
      for (const file of selectedFiles) {
        const evidence = await uploadEvidenceFile(file, type);
        const setter = type === 'BEFORE' ? setEvidenciasAntes : setEvidenciasDepois;
        setter((previous) => previous.some((item) => item.id === evidence.id) ? previous : [...previous, evidence]);
      }
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Não foi possível enviar a evidência.');
    } finally {
      setUploadingEvidence(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!currentUser) {
      setError('Usuário não autenticado.');
      setLoading(false);
      return;
    }

    if (!location) {
      setError('A geolocalização é obrigatória para finalizar o chamado. Ative o GPS e tente novamente.');
      setLoading(false);
      return;
    }

    if (!descricao.trim()) {
      setError('A descrição dos serviços executados é obrigatória.');
      setLoading(false);
      return;
    }

    if (loadingEvidence) {
      setError('Aguarde o carregamento das fotos desta OS.');
      setLoading(false);
      return;
    }

    if (evidenciasAntes.length === 0 || evidenciasDepois.length === 0) {
      setError('A evidência do problema e o registro após a intervenção são obrigatórios.');
      setLoading(false);
      return;
    }

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      setError('A assinatura do responsável é obrigatória para fechar o chamado.');
      setLoading(false);
      return;
    }

    const assinaturaBase64 = sigCanvas.current.getCanvas().toDataURL('image/png');

    const parsedDespesas = despesas.map(d => ({
      ...d,
      valor_numerico: d.valor ? parseFloat(d.valor.replace(/\./g, '').replace(',', '.')) : 0
    })).filter(d => d.natureza || d.valor_numerico > 0);

    try {
      const ts = Date.now();

      setProgressMsg('Upload da assinatura...');
      const assinaturaUrl = await uploadBase64(`resolutions/${ticket.id}/${ts}_assinatura.png`, assinaturaBase64);

      const evidenciaAntesUrl = evidenciasAntes[0].media_url;

      const evidenciaDepoisUrl = evidenciasDepois[0].media_url;

      const finalDespesas = [];
      for (const d of parsedDespesas) {
        if (d.anexo) {
           setProgressMsg(`Upload do anexo da despesa: ${d.natureza}...`);
           const anexoUrl = await uploadBase64(`resolutions/${ticket.id}/despesa_${ts}_${Math.random().toString(36).substring(7)}.jpg`, d.anexo);
           finalDespesas.push({ natureza: d.natureza, valor: d.valor_numerico, anexoUrl });
        } else {
           finalDespesas.push({ natureza: d.natureza, valor: d.valor_numerico });
        }
      }

      setProgressMsg('Registrando baixa de OS na base nativa...');
      const response = await fetch('/api/tecnico/finalizar-chamado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_id: ticket.id,
          hora_inicio: new Date(horaInicio).toISOString(),
          hora_termino: new Date(horaTermino).toISOString(),
          descricao_servicos: descricao,
          materiais_utilizados: materiais,
          latitude: location.lat,
          longitude: location.lng,
          assinatura_base64: assinaturaBase64,
          assinatura_datahora: new Date().toISOString(),
          despesas_json: finalDespesas,
          resolucao: {
            causaRaiz: selectedCause || undefined,
            causaRaizDetalhe: selectedCauseDetail || undefined,
            horaInicio: new Date(horaInicio).getTime(),
            horaTermino: new Date(horaTermino).getTime(),
            descricaoServicos: descricao,
            materiaisUtilizados: materiais,
            latitude: location.lat,
            longitude: location.lng,
            assinaturaUrl,
            assinaturaDataHora: new Date().toISOString(),
            evidenciaAntesUrl,
            evidenciaDepoisUrl,
            despesas: finalDespesas,
          },
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível finalizar o chamado.');

      onSuccess();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro inesperado ao salvar laudo no Firestore.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>Baixa de OS</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.content}>
          {/* GeoStatus */}
          <div className={`${styles.geoStatus} ${location ? styles.geoSuccess : styles.geoError}`}>
            {isLocating ? (
              <Clock size={24} color="#94a3b8" />
            ) : location ? (
              <MapPin size={24} color="#10b981" />
            ) : (
              <MapPinOff size={24} color="#ef4444" />
            )}

            <div>
              <strong className={`${styles.geoStatusStrong} ${location ? styles.geoStatusStrongSuccess : (isLocating ? styles.geoStatusStrongLocating : styles.geoStatusStrongError)}`}>
                {isLocating ? 'Capturando GPS...' : location ? 'Geolocalização Ativa' : 'Falha no GPS'}
              </strong>
              <span className={styles.geoStatusSpan}>
                {isLocating
                  ? 'Aguarde, obtendo coordenadas...'
                  : location
                    ? `Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}`
                    : `Erro: ${geoError}. O GPS é obrigatório para auditoria.`}
              </span>
              {!location && !isLocating && (
                <button
                  type="button"
                  onClick={captureLocation}
                  className={styles.geoRetryButton}
                >
                  Tentar novamente
                </button>
              )}
            </div>
          </div>

          <form id="finalizarForm" onSubmit={handleSubmit} className={styles.form}>
            {selectedCause && (
              <section className={styles.problemContext} aria-labelledby="selected-problem-title">
                <h3 id="selected-problem-title">Solicitação e causa informadas pelo analista</h3>
                <p><strong>Categoria:</strong> {ticket.categoria || 'Não informada'}</p>
                <p><strong>Causa raiz:</strong> {selectedCause}{selectedCauseDetail ? ` — ${selectedCauseDetail}` : ''}</p>
                <p className={styles.problemEvidenceHint}>Registre as evidências abaixo relacionadas a esta causa, antes e depois da intervenção.</p>
              </section>
            )}
            <div className={styles.grid}>
              <div>
                <label className={styles.label}>Início</label>
                <input
                  type="datetime-local"
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
              <div>
                <label className={styles.label}>Término</label>
                <input
                  type="datetime-local"
                  value={horaTermino}
                  onChange={e => setHoraTermino(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>
            </div>

            <div>
              <label className={styles.label}>Serviços Executados *</label>
              <textarea
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva detalhadamente o que foi feito..."
                rows={4}
                required
                className={styles.textarea}
              />
            </div>

            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Evidências da causa raiz (obrigatórias)</h4>
              <div className={styles.grid}>
                <div>
                  <label className={styles.label}>{evidenceBeforeLabel} *</label>
                  <div className={styles.evidenceActions}>
                    <button type="button" className={styles.evidenceActionButton} onClick={() => beforeGalleryInput.current?.click()} disabled={!canEditMedia || uploadingEvidence || loading}>
                      <Images size={17} /> Escolher fotos
                    </button>
                    <button type="button" className={styles.evidenceActionButton} onClick={() => beforeCameraInput.current?.click()} disabled={!canEditMedia || uploadingEvidence || loading}>
                      <Camera size={17} /> Tirar foto
                    </button>
                  </div>
                  <input ref={beforeGalleryInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={e => void handleEvidenceSelection(e, 'BEFORE')} className={styles.hiddenEvidenceInput} disabled={!canEditMedia || uploadingEvidence || loading} />
                  <input ref={beforeCameraInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" capture="environment" onChange={e => void handleEvidenceSelection(e, 'BEFORE')} className={styles.hiddenEvidenceInput} disabled={!canEditMedia || uploadingEvidence || loading} />
                  {evidenciasAntes.length > 0 && (
                    <div className={styles.evidencePreviewGrid} aria-label="Fotos do antes já enviadas">
                      {evidenciasAntes.map((evidence, index) => (
                        <div key={evidence.id} className={styles.evidencePreviewCard}>
                          <a href={evidence.media_url} target="_blank" rel="noopener noreferrer" className={styles.evidencePreview}>
                            {/\.(mp4|webm)(?:[?#]|$)/i.test(evidence.media_url) ? <video src={evidence.media_url} aria-label="Vídeo antes do atendimento" width={112} height={84} controls preload="metadata" /> : <Image src={evidence.media_url} alt={evidence.caption || `Evidência antes do atendimento ${index + 1}`} width={112} height={84} loading="lazy" unoptimized />}
                            <span>{evidence.caption || `Foto ${index + 1}`}</span>
                          </a>
                          <button type="button" className={styles.evidenceDeleteButton} onClick={() => void deleteEvidence(evidence)} disabled={!canEditMedia || Boolean(deletingEvidenceId) || uploadingEvidence} aria-label={`Excluir mídia ${index + 1} do antes`}>
                            <Trash size={14} /> Excluir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className={styles.evidenceUploadStatus} role="status">
                    {loadingEvidence ? 'Carregando fotos já enviadas...' : uploadingEvidence ? 'Enviando foto(s)...' : evidenciasAntes.length > 0 ? `${evidenciasAntes.length} foto(s) enviada(s) — disponível(is) para o analista` : 'Nenhuma foto enviada ainda'}
                  </span>
                </div>
                <div>
                  <label className={styles.label}>{evidenceAfterLabel} *</label>
                  <div className={styles.evidenceActions}>
                    <button type="button" className={styles.evidenceActionButton} onClick={() => afterGalleryInput.current?.click()} disabled={!canEditMedia || uploadingEvidence || loading}>
                      <Images size={17} /> Escolher fotos
                    </button>
                    <button type="button" className={styles.evidenceActionButton} onClick={() => afterCameraInput.current?.click()} disabled={!canEditMedia || uploadingEvidence || loading}>
                      <Camera size={17} /> Tirar foto
                    </button>
                  </div>
                  <input ref={afterGalleryInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" multiple onChange={e => void handleEvidenceSelection(e, 'AFTER')} className={styles.hiddenEvidenceInput} disabled={!canEditMedia || uploadingEvidence || loading} />
                  <input ref={afterCameraInput} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" capture="environment" onChange={e => void handleEvidenceSelection(e, 'AFTER')} className={styles.hiddenEvidenceInput} disabled={!canEditMedia || uploadingEvidence || loading} />
                  {evidenciasDepois.length > 0 && (
                    <div className={styles.evidencePreviewGrid} aria-label="Fotos do depois já enviadas">
                      {evidenciasDepois.map((evidence, index) => (
                        <div key={evidence.id} className={styles.evidencePreviewCard}>
                          <a href={evidence.media_url} target="_blank" rel="noopener noreferrer" className={styles.evidencePreview}>
                            {/\.(mp4|webm)(?:[?#]|$)/i.test(evidence.media_url) ? <video src={evidence.media_url} aria-label="Vídeo depois do atendimento" width={112} height={84} controls preload="metadata" /> : <Image src={evidence.media_url} alt={evidence.caption || `Evidência depois do atendimento ${index + 1}`} width={112} height={84} loading="lazy" unoptimized />}
                            <span>{evidence.caption || `Foto ${index + 1}`}</span>
                          </a>
                          <button type="button" className={styles.evidenceDeleteButton} onClick={() => void deleteEvidence(evidence)} disabled={!canEditMedia || Boolean(deletingEvidenceId) || uploadingEvidence} aria-label={`Excluir mídia ${index + 1} do depois`}>
                            <Trash size={14} /> Excluir
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <span className={styles.evidenceUploadStatus} role="status">
                    {loadingEvidence ? 'Carregando fotos já enviadas...' : uploadingEvidence ? 'Enviando foto(s)...' : evidenciasDepois.length > 0 ? `${evidenciasDepois.length} foto(s) enviada(s) — disponível(is) para o analista` : 'Nenhuma foto enviada ainda'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className={styles.label}>Materiais / Peças Utilizadas (Opcional)</label>
              <textarea
                value={materiais}
                onChange={e => setMateriais(e.target.value)}
                placeholder="Liste as peças trocadas ou materiais usados..."
                rows={2}
                className={styles.textarea}
              />
            </div>

            <div className={styles.section}>
              <div className={styles.despesasHeader}>
                <h4 className={`${styles.sectionTitle} ${styles.despesasTitle}`}>Despesas Extras (R$)</h4>
                <button type="button" onClick={addDespesa} className={styles.despesasAddBtn}>
                  <Plus size={16} /> Adicionar
                </button>
              </div>

              {despesas.map((despesa, index) => (
                <div key={index} className={styles.despesaRow}>
                  <input
                    type="text"
                    placeholder="Natureza (ex: Pedágio)"
                    value={despesa.natureza}
                    onChange={e => updateDespesa(index, 'natureza', e.target.value)}
                    className={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="0,00"
                    value={despesa.valor}
                    onChange={e => handleCurrencyChange(index, e.target.value)}
                    className={styles.input}
                  />
                  <div className={styles.despesaActions}>
                    <label className={styles.despesaFileLabel}>
                      {despesa.anexo ? '✓ Anexo' : 'Anexar'}
                      <input type="file" accept="image/*" capture="environment" className={styles.despesaFileInput} onChange={e => handleDespesaFile(e, index)} />
                    </label>
                    {despesas.length > 1 && (
                      <button type="button" onClick={() => removeDespesa(index)} className={styles.despesaRemoveBtn}>
                        <Trash size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.signatureSection}>
              <div className={styles.signatureHeader}>
                <label className={`${styles.label} ${styles.signatureLabel}`}>Assinatura do Responsável (Obrigatório!)</label>
                <button type="button" onClick={clearSignature} className={styles.signatureClearBtn}>Limpar</button>
              </div>
              <div className={styles.signatureCanvasWrapper}>
                <SignatureCanvas
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ width: 500, height: 200, className: styles.signatureCanvas }}
                />
              </div>
              <span className={styles.signatureHint}>
                Solicite que o cliente assine com o dedo na tela
              </span>
            </div>

            {error && (
              <div className={styles.errorBanner}>
                <AlertTriangle size={20} />
                {error}
              </div>
            )}
          </form>
        </div>

        <div className={styles.footer}>
          <button
            type="submit"
            form="finalizarForm"
            disabled={loading || uploadingEvidence || loadingEvidence || !location}
            className={`${styles.submitBtn} ${(!location || loading || uploadingEvidence || loadingEvidence) ? styles.submitBtnDisabled : styles.submitBtnActive}`}
          >
            <Send size={20} />
            {loading ? progressMsg || 'Sincronizando...' : 'Confirmar e Enviar Baixa'}
          </button>
        </div>
      </div>
    </div>
  );
}
