'use client';

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { X, MapPin, MapPinOff, AlertTriangle, Send, Clock, Plus, Trash } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import styles from './FinalizarChamadoModal.module.css';

interface FinalizarChamadoModalProps {
  ticket: any;
  onClose: () => void;
  onSuccess: () => void;
}

export default function FinalizarChamadoModal({ ticket, onClose, onSuccess }: FinalizarChamadoModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Geolocation
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);

  // Form Fields
  const [horaInicio, setHoraInicio] = useState('');
  const [horaTermino, setHoraTermino] = useState('');
  const [descricao, setDescricao] = useState('');
  const [materiais, setMateriais] = useState('');
  
  // Evidências
  const [evidenciaAntes, setEvidenciaAntes] = useState<string | null>(null);
  const [evidenciaDepois, setEvidenciaDepois] = useState<string | null>(null);

  // Despesas
  const [despesas, setDespesas] = useState([{ natureza: '', valor: '', anexo: '' }]);

  // Signature
  const sigCanvas = useRef<any>(null);

  useEffect(() => {
    // Get current time as default
    const now = new Date();
    const tzOffset = (new Date()).getTimezoneOffset() * 60000;
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
    
    setHoraTermino(localISOTime);
    
    // If ticket has check_in_at, use it as start time, otherwise use 1 hour ago
    let localISOTimeAgo;
    if (ticket.check_in_at) {
      const checkInDate = new Date(ticket.check_in_at);
      localISOTimeAgo = (new Date(checkInDate.getTime() - tzOffset)).toISOString().slice(0, 16);
    } else {
      const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
      localISOTimeAgo = (new Date(oneHourAgo.getTime() - tzOffset)).toISOString().slice(0, 16);
    }
    setHoraInicio(localISOTimeAgo);

    // Capture Geolocation immediately
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
        },
        (err) => {
          setGeoError(err.message);
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setGeoError('Geolocalização não suportada pelo navegador.');
      setIsLocating(false);
    }
  }, [ticket.check_in_at]);

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

  const addDespesa = () => {
    setDespesas([...despesas, { natureza: '', valor: '', anexo: '' }]);
  };

  const removeDespesa = (index: number) => {
    setDespesas(despesas.filter((_, i) => i !== index));
  };

  const updateDespesa = (index: number, field: string, value: string) => {
    const newDespesas = [...despesas];
    (newDespesas[index] as any)[field] = value;
    setDespesas(newDespesas);
  };

  const formatCurrency = (value: string) => {
    // Remove tudo que não for número
    let num = value.replace(/\D/g, "");
    if (!num) return "";
    
    // Converte para decimal
    const numValue = (parseInt(num) / 100).toFixed(2);
    
    // Adiciona máscara BRL
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
    
    // Parse expenses back to numbers
    const parsedDespesas = despesas.map(d => ({
      ...d,
      valor_numerico: d.valor ? parseFloat(d.valor.replace(/\./g, '').replace(',', '.')) : 0
    })).filter(d => d.natureza || d.valor_numerico > 0);

    try {
      const res = await fetch('/api/tecnico/finalizar-chamado', {
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
          evidencia_antes_base64: evidenciaAntes,
          evidencia_depois_base64: evidenciaDepois,
          despesas_json: parsedDespesas,
          assinatura_datahora: new Date().toISOString()
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao finalizar chamado');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro inesperado ao conectar com o servidor.');
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
                  canvasProps={{ width: 500, height: 200, className: 'sigCanvas', style: { width: '100%', height: '150px' } }} 
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
            {loading ? 'Sincronizando...' : 'Confirmar e Enviar Baixa'}
          </button>
        </div>
      </div>
    </div>
  );
}
