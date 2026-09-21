'use client';

import { useState, useRef, useEffect } from 'react';
import { X, MapPin, MapPinOff, AlertTriangle, Send, Clock } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

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
  
  // Optional Financial Fields (Técnico can fill, Admin can edit later)
  const [valorServico, setValorServico] = useState('');
  const [valorDespesas, setValorDespesas] = useState('');

  // Signature
  const sigCanvas = useRef<any>(null);

  useEffect(() => {
    // Get current time as default
    const now = new Date();
    const tzOffset = (new Date()).getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(now.getTime() - tzOffset)).toISOString().slice(0, 16);
    
    // Set End time to now, Start time to 1 hour ago (as a fallback default)
    setHoraTermino(localISOTime);
    
    const oneHourAgo = new Date(now.getTime() - (60 * 60 * 1000));
    const localISOTimeAgo = (new Date(oneHourAgo.getTime() - tzOffset)).toISOString().slice(0, 16);
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
  }, []);

  const clearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
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

    // Get signature as base64 if not empty
    let assinaturaBase64 = null;
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      assinaturaBase64 = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
    }

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
          valor_servico: valorServico ? parseFloat(valorServico) : 0,
          valor_despesas: valorDespesas ? parseFloat(valorDespesas) : 0
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
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      zIndex: 100
    }}>
      <div style={{
        background: '#0f172a',
        width: '100%',
        height: '90vh',
        borderTopLeftRadius: '24px',
        borderTopRightRadius: '24px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#0f172a', zIndex: 10, borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#f8fafc' }}>Baixa de OS</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '0.5rem' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem 1rem' }}>
          {/* GeoStatus */}
          <div style={{ 
            background: location ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            border: `1px solid ${location ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            borderRadius: '12px', 
            padding: '1rem', 
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            {isLocating ? (
              <Clock size={24} color="#94a3b8" />
            ) : location ? (
              <MapPin size={24} color="#10b981" />
            ) : (
              <MapPinOff size={24} color="#ef4444" />
            )}
            
            <div>
              <strong style={{ display: 'block', color: location ? '#10b981' : (isLocating ? '#94a3b8' : '#ef4444'), marginBottom: '0.25rem' }}>
                {isLocating ? 'Capturando GPS...' : location ? 'Geolocalização Ativa' : 'Falha no GPS'}
              </strong>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                {isLocating 
                  ? 'Aguarde, obtendo coordenadas...' 
                  : location 
                    ? `Lat: ${location.lat.toFixed(5)}, Lng: ${location.lng.toFixed(5)}`
                    : `Erro: ${geoError}. O GPS é obrigatório para auditoria.`}
              </span>
            </div>
          </div>

          <form id="finalizarForm" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Início</label>
                <input 
                  type="datetime-local" 
                  value={horaInicio}
                  onChange={e => setHoraInicio(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Término</label>
                <input 
                  type="datetime-local" 
                  value={horaTermino}
                  onChange={e => setHoraTermino(e.target.value)}
                  required
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Serviços Executados *</label>
              <textarea 
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva detalhadamente o que foi feito..."
                rows={4}
                required
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white', resize: 'vertical' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Materiais / Peças Utilizadas (Opcional)</label>
              <textarea 
                value={materiais}
                onChange={e => setMateriais(e.target.value)}
                placeholder="Liste as peças trocadas ou materiais usados..."
                rows={2}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white', resize: 'vertical' }}
              />
            </div>

            <div style={{ background: 'rgba(56, 189, 248, 0.05)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem', borderRadius: '12px' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#38bdf8', fontSize: '0.95rem' }}>Dados Financeiros</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Valor Serviço (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={valorServico}
                    onChange={e => setValorServico(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>Despesas Extras (R$)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={valorDespesas}
                    onChange={e => setValorDespesas(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #334155', background: '#1e293b', color: 'white' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Assinatura do Responsável (Opcional)</label>
                <button type="button" onClick={clearSignature} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '0.8rem', cursor: 'pointer' }}>Limpar</button>
              </div>
              <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', border: '2px solid #334155' }}>
                <SignatureCanvas 
                  ref={sigCanvas}
                  penColor="black"
                  canvasProps={{ width: 500, height: 200, className: 'sigCanvas', style: { width: '100%', height: '150px' } }} 
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginTop: '0.5rem', textAlign: 'center' }}>
                Solicite que o cliente assine com o dedo na tela
              </span>
            </div>

            {error && (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '8px', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.9rem' }}>
                <AlertTriangle size={20} />
                {error}
              </div>
            )}
          </form>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', background: '#0f172a' }}>
          <button 
            type="submit"
            form="finalizarForm"
            disabled={loading || !location}
            style={{
              width: '100%',
              padding: '16px',
              background: (!location || loading) ? '#334155' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: (!location || loading) ? '#94a3b8' : 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: (!location || loading) ? 'not-allowed' : 'pointer'
          }}>
            <Send size={20} />
            {loading ? 'Sincronizando...' : 'Confirmar e Enviar Baixa'}
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
