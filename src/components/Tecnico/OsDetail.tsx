'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { ChevronLeft, MapPin, Clock, CheckCircle, Navigation, AlertTriangle } from 'lucide-react';
import FinalizarChamadoModal from '@/components/Tecnico/FinalizarChamadoModal';
import { formatTicketDescription, getTicketAddress } from '@/utils/tickets/description';
import styles from './OsDetail.module.css';

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

export default function OsDetail({ ticketId, lang }: { ticketId: string, lang: string }) {
  const router = useRouter();
  
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
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
    if (ticket?.check_in_at && ticket?.status !== 'FINALIZADO' && ticket?.status !== 'CONCLUIDO') {
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
              
              router.replace(`/${lang}/tecnico/historico`);
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
    setCheckInMessage('Solicitando sua localização GPS...');

    if (!window.isSecureContext) {
      setGeoError('O GPS exige uma conexão segura (HTTPS). Abra o sistema pelo endereço HTTPS.');
      setCheckInMessage(null);
      setIsCheckingIn(false);
      return;
    }

    if (!navigator.geolocation) {
      setGeoError('Este navegador não oferece suporte à localização GPS.');
      setCheckInMessage(null);
      setIsCheckingIn(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          setCheckInMessage('Localização obtida. Registrando o check-in...');
          const res = await fetch('/api/tecnico/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ticket_id: ticket.id,
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            })
          });

          const result = await res.json();
          if (!res.ok || !result.success) {
            throw new Error(result.error || 'Não foi possível registrar o check-in.');
          }

          await fetchTicket();
          setCheckInMessage(null);
        } catch (err: any) {
          setGeoError(err instanceof Error ? err.message : 'Erro inesperado ao registrar o check-in.');
          setCheckInMessage(null);
        } finally {
          setIsCheckingIn(false);
        }
      },
      (err) => {
        const messages: Record<number, string> = {
          1: 'Permissão de localização negada. Autorize o acesso ao GPS nas configurações do navegador.',
          2: 'Não foi possível obter sua localização. Verifique se o GPS está ativado e tente novamente.',
          3: 'A localização demorou demais. Verifique o sinal do GPS e tente novamente.',
        };
        setGeoError(messages[err.code] || 'Falha ao obter a localização. Tente novamente.');
        setCheckInMessage(null);
        setIsCheckingIn(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  if (loading) return <div className={styles.loadingContainer}>Carregando dados da OS...</div>;
  if (!ticket) return <div className={styles.loadingContainer}>OS não encontrada.</div>;

  const isCheckedIn = !!ticket.check_in_at;
  const isFinalized = ticket.status === 'FINALIZADO' || ticket.status === 'CONCLUIDO';
  const { text: descricao, address: enderecoDaDescricao } = formatTicketDescription(ticket.descricao);
  const endereco = getTicketAddress({ endereco: ticket.endereco, descricao: ticket.descricao });

  const handleNavigate = () => {
    if (!endereco) return;
    const preference = localStorage.getItem('navAppPref');
    const useWaze = preference
      ? preference === 'waze'
      : window.confirm('Deseja usar o Waze? (Clique "OK" para Waze ou "Cancelar" para Google Maps)');

    if (!preference) {
      localStorage.setItem('navAppPref', useWaze ? 'waze' : 'maps');
    }

    const query = encodeURIComponent(endereco);
    const url = useWaze
      ? `https://waze.com/ul?q=${query}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

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
            {(endereco || enderecoDaDescricao) && (
              <div className={styles.detailItem}>
                <MapPin size={18} color="#00d2ff" className={styles.detailIcon} />
                <div className={styles.addressContent}>
                  <strong className={styles.detailLabel}>Endereço da loja</strong>
                  <span className={styles.detailValue}>{endereco || enderecoDaDescricao}</span>
                  {endereco && (
                    <button type="button" onClick={handleNavigate} className={styles.addressButton}>
                      <Navigation size={15} />
                      Abrir no mapa
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {descricao && (
          <section className={styles.cardSection}>
            <h3 className={`${styles.sectionHeading} ${styles.sectionHeadingDesc}`}>Descrição Reportada</h3>
            <p className={styles.descText}>{descricao}</p>
          </section>
        )}
      </div>

      <div className={styles.bottomBar}>
        {isFinalized ? (
          <Link href={`/${lang}/tecnico/historico`} className={styles.btnHistory}>
            <CheckCircle size={20} />
            Chamado finalizado · Voltar ao histórico
          </Link>
        ) : (
          <>
            {checkInMessage && <p className={styles.checkInMessage} role="status">{checkInMessage}</p>}
            {geoError && <p className={styles.geoError}>{geoError}</p>}

            {!isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={isCheckingIn}
                className={`${styles.btnCheckIn} ${isCheckingIn ? styles.btnCheckInDisabled : ''}`}>
                <Navigation size={22} />
                {isCheckingIn ? 'Obtendo localização...' : 'Check-in (Cheguei no local)'}
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
          </>
        )}
      </div>

      {showModal && (
        <FinalizarChamadoModal 
          ticket={ticket} 
          onClose={() => setShowModal(false)} 
          onSuccess={() => {
            setShowModal(false);
            router.replace(`/${lang}/tecnico/historico`);
          }}
        />
      )}
    </div>
  );
}
