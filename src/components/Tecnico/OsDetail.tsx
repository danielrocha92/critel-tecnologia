'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import type { User } from '@supabase/supabase-js';
import { ChevronLeft, MapPin, Clock, CheckCircle, Navigation, AlertTriangle } from 'lucide-react';
import FinalizarChamadoModal from '@/components/Tecnico/FinalizarChamadoModal';
import { db } from '@/utils/firebase/client';
import { doc, onSnapshot } from 'firebase/firestore';
import { fazerCheckin, autoFinalizar } from '@/lib/firebase/ticket-service';
import { Ticket } from '@/types/ticket';
import styles from './OsDetail.module.css';

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

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
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(db !== null);
  const [showModal, setShowModal] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [checkInMessage, setCheckInMessage] = useState<string | null>(null);
  const [distanciaAtual, setDistanciaAtual] = useState<number | null>(null);

  const watchId = useRef<number | null>(null);

  // Fetch Auth User
  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!isMounted) return;
      if (error) {
        setGeoError(`Não foi possível verificar a sessão: ${error.message}`);
        return;
      }
      setCurrentUser(data.user);
    };
    void loadUser();
    return () => {
      isMounted = false;
    };
  }, []);

  // Firebase Realtime Listener
  useEffect(() => {
    if (!db) return;

    const docRef = doc(db, 'tickets', ticketId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setTicket({ id: docSnap.id, ...docSnap.data() } as Ticket);
      } else {
        setTicket(null);
      }
      setLoading(false);
    }, (error) => {
      console.error('Erro no onSnapshot do OS Detail:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [ticketId]);

  // Watch position para check-out automático
  useEffect(() => {
    if (ticket?.checkInAt && ticket?.status !== 'FINALIZADO' && ticket?.status !== 'FECHADO' && ticket?.status !== 'CONCLUIDO') {
      if ('geolocation' in navigator && ticket.checkInLat && ticket.checkInLng) {
        watchId.current = navigator.geolocation.watchPosition(
          async (position) => {
            const dist = getDistanceFromLatLonInMeters(
              ticket.checkInLat!,
              ticket.checkInLng!,
              position.coords.latitude,
              position.coords.longitude
            );
            setDistanciaAtual(dist);

            if (dist > 500) {
              navigator.geolocation.clearWatch(watchId.current!);
              alert('Atenção: Você se afastou mais de 500m do local do Check-in. O chamado está sendo fechado automaticamente por segurança.');
              
              // Executa Finalização Automática Nativa
              await autoFinalizar(ticket.id, position.coords.latitude, position.coords.longitude);
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
  }, [ticket?.checkInAt, ticket?.status, ticket?.checkInLat, ticket?.checkInLng, ticket?.id, lang, router]);

  const handleCheckIn = () => {
    if (!currentUser) {
      setGeoError('Você precisa estar logado para fazer check-in.');
      return;
    }
    
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
          setCheckInMessage('Localização obtida. Registrando o check-in nativamente...');
          
          await fazerCheckin(ticket!.id, currentUser.id, position.coords.latitude, position.coords.longitude);
          
          setCheckInMessage(null);
        } catch (err) {
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

  if (!db) return <div className={styles.loadingContainer}>Firebase não está configurado para consultar esta ordem de serviço.</div>;
  if (loading) return <div className={styles.loadingContainer}>Sincronizando OS com Firebase...</div>;
  if (!ticket) return <div className={styles.loadingContainer}>OS não encontrada.</div>;

  const isCheckedIn = !!ticket.checkInAt;
  const isFinalized = ticket.status === 'FECHADO' || ticket.status === 'RESOLVIDO';

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.btnBack}>
          <ChevronLeft size={24} />
        </button>
        <h2 className={styles.headerTitle}>OS #{ticket.id.substring(0, 6).toUpperCase()}</h2>
      </header>

      <div className={styles.contentWrapper}>
        <div className={styles.titleSection}>
          <h1 className={styles.clientTitle}>{ticket.department}</h1>
          <p className={styles.ticketTitle}>
            {ticket.title}
          </p>
        </div>

        <div className={styles.cardSection}>
          <h3 className={styles.sectionHeading}>Detalhes do Serviço</h3>
          
          <div className={styles.detailsList}>
            <div className={styles.detailItem}>
              <Clock size={18} color="#00d2ff" className={styles.detailIcon} />
              <div>
                <strong className={styles.detailLabel}>Abertura</strong>
                <span className={styles.detailValue}>
                  {ticket.createdAt ? new Date(ticket.createdAt).toLocaleString('pt-BR') : '-'}
                </span>
              </div>
            </div>
            
            <div className={styles.detailItem}>
              <MapPin size={18} color="#00d2ff" className={styles.detailIcon} />
              <div>
                <strong className={styles.detailLabel}>Departamento / Categoria</strong>
                <span className={styles.detailValue}>{ticket.department} - {ticket.category}</span>
              </div>
            </div>
          </div>
        </div>

        {ticket.description && (
          <section className={styles.cardSection}>
            <h3 className={`${styles.sectionHeading} ${styles.sectionHeadingDesc}`}>Descrição Reportada</h3>
            <p className={styles.descText}>{ticket.description}</p>
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
