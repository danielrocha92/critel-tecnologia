'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useParams } from 'next/navigation';
import { MapPin, Clock, Save, ArrowLeft, CheckCircle, Navigation, FileText, Car } from 'lucide-react';

export default function OSDashboard() {
  const router = useRouter();
  const params = useParams();
  const ticketId = params.id as string;
  const lang = params.lang as string;

  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form States
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [km, setKm] = useState('');
  const [descricao, setDescricao] = useState('');
  const [lat, setLat] = useState<string>('');
  const [lng, setLng] = useState<string>('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchTicket = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      
      setTicket(data);
      setLoading(false);
      
      // Auto preencher início se estiver vazio (simplificação)
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setDataInicio(now.toISOString().slice(0,16));
    };
    fetchTicket();
  }, [ticketId]);

  const capturarLocalizacao = () => {
    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLng(position.coords.longitude.toString());
          setGpsLoading(false);
        },
        (error) => {
          alert('Erro ao capturar GPS. Verifique a permissão de localização do navegador.');
          setGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else {
      alert('Geolocalização não suportada neste navegador.');
      setGpsLoading(false);
    }
  };

  const handleFinalizar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) throw new Error('Usuário não autenticado');

      // Buscar o perfil do técnico
      const { data: perfil } = await supabase
        .from('perfis')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!perfil) throw new Error('Perfil de técnico não encontrado');

      // 1. Gravar a Ordem de Serviço
      const { error: osError } = await supabase
        .from('servicos_tecnicos')
        .insert({
          ticket_id: ticketId,
          tecnico_id: perfil.id,
          data_inicio: new Date(dataInicio).toISOString(),
          data_fim: new Date(dataFim).toISOString(),
          km_percorrido: parseFloat(km) || 0,
          latitude: lat,
          longitude: lng,
          descricao_tecnica: descricao
        });

      if (osError) throw osError;

      // 2. Atualizar Status do Ticket para CONCLUIDO
      const { error: ticketError } = await supabase
        .from('tickets')
        .update({ status: 'CONCLUIDO' })
        .eq('id', ticketId);

      if (ticketError) throw ticketError;

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${lang}/tecnico`);
      }, 2000);

    } catch (err: any) {
      alert(err.message || 'Ocorreu um erro ao salvar a OS.');
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados da OS...</div>;
  if (!ticket) return <div style={{ padding: '2rem', textAlign: 'center' }}>Ticket não encontrado.</div>;

  return (
    <div style={{ padding: '1rem', paddingBottom: '3rem' }}>
      <button 
        onClick={() => router.push(`/${lang}/tecnico`)}
        style={{ background: 'none', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem', cursor: 'pointer' }}
      >
        <ArrowLeft size={18} /> Voltar para a fila
      </button>

      <div style={{ background: 'rgba(30, 41, 59, 0.7)', padding: '1.5rem', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255,255,255,0.1)' }}>
        <h2 style={{ fontSize: '1.3rem', margin: '0 0 10px 0', color: '#f8fafc' }}>{ticket.cliente}</h2>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', marginBottom: '15px' }}>{ticket.titulo}</p>
        
        {success ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
            <CheckCircle size={32} style={{ color: '#10b981', margin: '0 auto 10px' }} />
            <strong style={{ color: '#10b981', display: 'block' }}>Ordem de Serviço Finalizada!</strong>
            <span style={{ fontSize: '0.85rem', color: '#a7f3d0' }}>Você será redirecionado...</span>
          </div>
        ) : (
          <form onSubmit={handleFinalizar} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            
            {/* Bloco GPS */}
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '0.9rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} /> Localização Atual
                </span>
                <button 
                  type="button" 
                  onClick={capturarLocalizacao}
                  disabled={gpsLoading}
                  style={{ background: '#0284c7', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Navigation size={14} /> {gpsLoading ? 'Buscando...' : 'Capturar GPS'}
                </button>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" readOnly value={lat} placeholder="Latitude" style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }} />
                <input type="text" readOnly value={lng} placeholder="Longitude" style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', fontSize: '0.8rem' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>Horário Inicial</label>
                <input 
                  type="datetime-local" 
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} 
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>Horário Final</label>
                <input 
                  type="datetime-local" 
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} 
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
                <Car size={16} /> KM Percorrido (Total)
              </label>
              <input 
                type="number" 
                step="0.1"
                min="0"
                value={km}
                onChange={e => setKm(e.target.value)}
                placeholder="Ex: 15.5"
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px' }} 
              />
            </div>

            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#94a3b8', marginBottom: '5px' }}>
                <FileText size={16} /> Relatório Técnico
              </label>
              <textarea 
                rows={5} 
                required
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Descreva o que foi feito no local..."
                style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', resize: 'vertical', fontFamily: 'inherit' }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={saving || !lat || !lng}
              style={{
                marginTop: '1rem',
                width: '100%',
                padding: '14px',
                background: (!lat || !lng) ? '#334155' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: (!lat || !lng) ? '#94a3b8' : 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: (!lat || !lng) ? 'none' : '0 4px 15px rgba(16, 185, 129, 0.4)',
                cursor: (!lat || !lng) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s'
            }}>
              <Save size={18} /> {saving ? 'Salvando...' : (!lat || !lng) ? 'Capture o GPS primeiro' : 'Gravar OS e Finalizar'}
            </button>

          </form>
        )}
      </div>
    </div>
  );
}
