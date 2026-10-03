'use client';

import { useState, useRef, useEffect, useCallback, ChangeEvent } from 'react';
import { X, MapPin, MapPinOff, AlertTriangle, Send, Clock, Plus, Trash } from 'lucide-react';
import SignatureCanvas, { type SignatureCanvas as SignatureCanvasInstance } from 'react-signature-canvas';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { ITicket } from '@/types/ticket';
import styles from './FinalizarChamadoModal.module.css';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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
    ticket.checkInAt ? new Date(ticket.checkInAt) : new Date(Date.now() - 60 * 60 * 1000),
  ));
  const [horaTermino, setHoraTermino] = useState(() => toLocalDateTimeInput(new Date()));
  const [descricao, setDescricao] = useState('');
  const [materiais, setMateriais] = useState('');
  
  // Evidências
  const [evidenciaAntes, setEvidenciaAntes] = useState<string | null>(null);
  const [evidenciaDepois, setEvidenciaDepois] = useState<string | null>(null);

  // Despesas
  const [despesas, setDespesas] = useState<ExpenseDraft[]>([{ natureza: '', valor: '', anexo: '' }]);

  // Signature
  const sigCanvas = useRef<SignatureCanvasInstance | null>(null);

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
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);

    setHoraTermino(localISOTime);

    let localISOTimeAgo: string;
    if (ticket.criado_em) {
      const checkInDate = new Date(ticket.criado_em);
      localISOTimeAgo = (new Date(checkInDate.getTime() - tzOffset)).toISOString().slice(0, 16);
    } else {
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      localISOTimeAgo = (new Date(oneHourAgo.getTime() - tzOffset)).toISOString().slice(0, 16);
    }
    setHoraInicio(localISOTimeAgo);

    captureLocation();
  }, [captureLocation, ticket.criado_em]);

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const handleFileConvert = (e: ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setter(event.target?.result as string);
    };
    reader.readAsDataURL(file);
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

    const { data, error } = await supabase.storage
      .from('anexos')
      .upload(path, blob, { contentType: blob.type, upsert: true });

    if (error) throw error;

    const { data: urlData } = supabase.storage.from('anexos').getPublicUrl(path);
    return urlData.publicUrl;
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
    
    if (!evidenciaAntes || !evidenciaDepois) {
      setError('Sessão Evidências: As fotos de antes e depois da fachada são obrigatórias.');
      setLoading(false);
      return;
    }

    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      setError('A assinatura do responsável é obrigatória para fechar o chamado.');
      setLoading(false);
      return;
    }

    const assinaturaBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    
    const parsedDespesas = despesas.map(d => ({
      ...d,
      valor_numerico: d.valor ? parseFloat(d.valor.replace(/\./g, '').replace(',', '.')) : 0
    })).filter(d => d.natureza || d.valor_numerico > 0);

    try {
      const ts = Date.now();
      
      setProgressMsg('Upload da assinatura...');
      const assinaturaUrl = await uploadBase64(`resolutions/${ticket.id}/${ts}_assinatura.png`, assinaturaBase64);
      
      setProgressMsg('Upload da fachada (Antes)...');
      const evidenciaAntesUrl = await uploadBase64(`resolutions/${ticket.id}/${ts}_antes.jpg`, evidenciaAntes);
      
      setProgressMsg('Upload da fachada (Depois)...');
      const evidenciaDepoisUrl = await uploadBase64(`resolutions/${ticket.id}/${ts}_depois.jpg`, evidenciaDepois);

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
      const { error: finalError } = await supabase.from('tickets').update({
        status: 'RESOLVIDO',
        resolucao: {
          horaInicio: new Date(horaInicio).getTime(),
          horaTermino: new Date(horaTermino).getTime(),
          descricaoServicos: descricao,
          materiaisUtilizados: materiais,
          latitude: location.lat,
          longitude: location.lng,
          assinaturaUrl,
          evidenciaAntesUrl,
          evidenciaDepoisUrl,
          despesas: finalDespesas
        }
      }).eq('id', ticket.id);

      if (finalError) throw finalError;

      await supabase.from('ticket_transitions').insert({
        ticket_id: ticket.id,
        from_status: ticket.status,
        to_status: 'RESOLVIDO',
        changed_by: currentUser.id,
        reason: 'Finalização técnica no local'
      });

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
              <h4 className={styles.sectionTitle}>Sessão Evidências (Obrigatório!)</h4>
              <div className={styles.grid}>
                <div>
                  <label className={styles.label}>Fachada da Loja (Antes)</label>
                  <input type="file" accept="image/*" capture="environment" onChange={e => handleFileConvert(e, setEvidenciaAntes)} className={styles.input} />
                  {evidenciaAntes && <span className={styles.evidenciaSuccessSpan}>✓ Imagem capturada</span>}
                </div>
                <div>
                  <label className={styles.label}>Fachada da Loja (Depois)</label>
                  <input type="file" accept="image/*" capture="environment" onChange={e => handleFileConvert(e, setEvidenciaDepois)} className={styles.input} />
                  {evidenciaDepois && <span className={styles.evidenciaSuccessSpan}>✓ Imagem capturada</span>}
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
            disabled={loading || !location}
            className={`${styles.submitBtn} ${(!location || loading) ? styles.submitBtnDisabled : styles.submitBtnActive}`}
          >
            <Send size={20} />
            {loading ? progressMsg || 'Sincronizando...' : 'Confirmar e Enviar Baixa'}
          </button>
        </div>
      </div>
    </div>
  );
}
