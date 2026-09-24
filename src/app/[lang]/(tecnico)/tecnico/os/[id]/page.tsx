'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, MapPin, Clock, CheckCircle, Navigation, AlertTriangle } from 'lucide-react';
import FinalizarChamadoModal from '@/components/Tecnico/FinalizarChamadoModal';

// Helper: Haversine distance em metros
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Raio da terra em metros
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c;
}

export default function OrdemServicoMobilePage() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;
  const ticketId = params.id as string;
  
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [distanciaAtual, setDistanciaAtual] = useState<number | null>(null);

  const watchId = useRef<number | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchTicket = async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();
      
    if (data) setTicket(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTicket();
  }, [ticketId, supabase]);

  // Watch position para check-out automático
  useEffect(() => {
    if (ticket?.check_in_at && ticket?.status !== 'FINALIZADO') {
      if ('geolocation' in navigator) {
        watchId.current = navigator.geolocation.watchPosition(
          async (position) => {
            const dist = getDistanceFromLatLonInMeters(
              ticket.check_in_lat,
              ticket.check_in_lng,
              position.coords.latitude,
              position.coords.longitude
            );
            setDistanciaAtual(dist);

            if (dist > 500) {
              // Auto close se passou de 500m
              navigator.geolocation.clearWatch(watchId.current!);
              alert('Atenção: Você se afastou mais de 500m do local do Check-in. O chamado está sendo fechado automaticamente por segurança.');
              
              // Em um ambiente real, aqui chamaríamos um endpoint de 'forçar-fechamento'
              // Para simplificar, abrimos a modal e mostramos o aviso, ou fechamos via API direto.
              // Vamos forçar atualizar o status para FECHADO.
              await fetch('/api/tecnico/finalizar-chamado', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ticket_id: ticket.id,
                  hora_inicio: ticket.check_in_at,
                  hora_termino: new Date().toISOString(),
                  descricao_servicos: 'Fechamento Automático (Distância > 500m)',
                  latitude: position.coords.latitude,
                  longitude: position.coords.longitude
                })
              });
              
              router.push(`/${lang}/tecnico`);
            }
          },
          (err) => console.warn(err),
          { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
        );
      }
    }

    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
    };
  }, [ticket, lang, router]);

  const handleCheckIn = () => {
    setIsCheckingIn(true);
    setGeoError(null);

    if (!('geolocation' in navigator)) {
      setGeoError('GPS não suportado.');
      setIsCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch('/api/tecnico/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticket_id: ticket.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });
          
          if (!res.ok) throw new Error('Erro ao registrar Check-in');
          await fetchTicket();
        } catch (err: any) {
          setGeoError(err.message);
        } finally {
          setIsCheckingIn(false);
        }
      },
      (err) => {
        setGeoError(err.message);
        setIsCheckingIn(false);
      },
      { enableHighAccuracy: true }
    );
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando dados da OS...</div>;
  if (!ticket) return <div style={{ padding: '2rem', textAlign: 'center' }}>OS não encontrada.</div>;

  const isCheckedIn = !!ticket.check_in_at;

  return (
    <div style={{ paddingBottom: '6rem' }}>
      <header style={{ padding: '1rem', background: 'rgba(30, 41, 59, 0.5)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: '#00d2ff', padding: '0.5rem', cursor: 'pointer' }}>
          <ChevronLeft size={24} />
        </button>
        <h2 style={{ fontSize: '1.2rem', margin: 0, color: '#f8fafc' }}>OS #{ticket.protocolo_origem}</h2>
      </header>

      <div style={{ padding: '1.5rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', color: '#00d2ff', marginBottom: '0.5rem' }}>{ticket.cliente}</h1>
          <p style={{ color: '#cbd5e1', fontSize: '1rem', lineHeight: '1.5' }}>
            {ticket.titulo}
          </p>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>Detalhes do Serviço</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Clock size={18} color="#00d2ff" style={{ marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#e2e8f0' }}>Abertura</strong>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{new Date(ticket.criado_em).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <MapPin size={18} color="#00d2ff" style={{ marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.9rem', color: '#e2e8f0' }}>Departamento</strong>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{ticket.departamento}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '1rem', marginBottom: '2rem', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Descrição Reportada</h3>
          <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
            {ticket.descricao}
          </p>
        </div>
      </div>

      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        padding: '1rem',
        background: 'rgba(11, 17, 32, 0.95)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 50
      }}>
        {geoError && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginBottom: '0.5rem', textAlign: 'center' }}>{geoError}</p>}
        
        {!isCheckedIn ? (
          <button 
            onClick={handleCheckIn}
            disabled={isCheckingIn}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: isCheckingIn ? 'not-allowed' : 'pointer',
              opacity: isCheckingIn ? 0.7 : 1
          }}>
            <Navigation size={22} />
            {isCheckingIn ? 'Registrando Check-in...' : 'Check-in (Cheguei no local)'}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {distanciaAtual !== null && (
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                {distanciaAtual > 400 ? <AlertTriangle size={14} color="#f59e0b" /> : <MapPin size={14} />}
                Distância do check-in: {Math.round(distanciaAtual)}m
              </div>
            )}
            <button 
              onClick={() => setShowModal(true)}
              style={{
                width: '100%',
                padding: '16px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                cursor: 'pointer'
            }}>
              <CheckCircle size={22} />
              Finalizar Chamado na Loja
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <FinalizarChamadoModal 
          ticket={ticket} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            router.push(`/${lang}/tecnico`);
          }}
        />
      )}
    </div>
  );
}
