'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, MapPin, Clock, CheckCircle, Navigation, AlertTriangle } from 'lucide-react';
import FinalizarChamadoModal from '@/components/Tecnico/FinalizarChamadoModal';
import styles from './os.module.css';

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

  if (loading) return <div className={styles.loadingContainer}>Carregando dados da OS...</div>;
  if (!ticket) return <div className={styles.loadingContainer}>OS não encontrada.</div>;

  const isCheckedIn = !!ticket.check_in_at;

  return (
  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.btnBack}>
          <ChevronLeft size={24} />
        </button>
        <h2 className={styles.headerTitle}>OS #{ticket.protocolo_origem}</h2>
      </header>

      <div className={styles.contentWrapper}>
        <div className={styles.titleSection}>
          <h1 className={styles.clientTitle}>{ticket.cliente}</h1>
          <p className={styles.ticketTitle}>
            {ticket.titulo}
          </p>
        </div>

        <div className={styles.cardSection}>
          <h3 className={styles.sectionHeading}>Detalhes do Serviço</h3>
          
          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <Clock size={18} color="#00d2ff" className={styles.detailIcon} />
              <div>
                <strong className={styles.detailLabel}>Abertura</strong>
                <span className={styles.detailValue}>{new Date(ticket.criado_em).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            
            <div className={styles.detailItem}>
              <MapPin size={18} color="#00d2ff" className={styles.detailIcon} />
              <div>
                <strong className={styles.detailLabel}>Departamento</strong>
                <span className={styles.detailValue}>{ticket.departamento}</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.cardSection}>
          <h3 className={`${styles.sectionHeading} ${styles.sectionHeadingDesc}`}>Descrição Reportada</h3>
          <p className={styles.descText}>
            {ticket.descricao}
          </p>
        </div>
      </div>

      <div className={styles.bottomBar}>
        {geoError && <p className={styles.geoError}>{geoError}</p>}
        
        {!isCheckedIn ? (
          <button 
            onClick={handleCheckIn}
            disabled={isCheckingIn}
            className={`${styles.btnCheckIn} ${isCheckingIn ? styles.btnCheckInDisabled : ''}`}>
            <Navigation size={22} />
            {isCheckingIn ? 'Registrando Check-in...' : 'Check-in (Cheguei no local)'}
          </button>
        ) : (
          <div className={styles.actionsContainer}>
            {distanciaAtual !== null && (
              <div className={styles.distanceInfo}>
                {distanciaAtual > 400 ? <AlertTriangle size={14} color="#f59e0b" /> : <MapPin size={14} />}
                Distância do check-in: {Math.round(distanciaAtual)}m
              </div>
            )}
            <button 
              onClick={() => setShowModal(true)}
              className={styles.btnFinalize}>
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
