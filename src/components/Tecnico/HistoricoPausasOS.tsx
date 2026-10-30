'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/utils/supabase/client';
import { getPauseReasonLabel } from '@/lib/tickets/pauseReasons';
import PauseRouteMap, { type PauseLocation } from './PauseRouteMap';
import styles from './HistoricoPausasOS.module.css';

type PauseRecord = {
  id: string;
  reason_code: string;
  description: string | null;
  contact_name: string;
  contact_role: string;
  expected_return_at: string;
  evidence_url: string;
  started_at: string;
  resumed_at: string | null;
};

const supabase = createClient();

function elapsedLabel(start: string, end?: string | null) {
  const seconds = Math.max(0, Math.floor((new Date(end || Date.now()).getTime() - new Date(start).getTime()) / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}min`;
}

export default function HistoricoPausasOS({ ticketId, canViewRoute }: { ticketId: string; canViewRoute: boolean }) {
  const [pauses, setPauses] = useState<PauseRecord[]>([]);
  const [locations, setLocations] = useState<Record<string, PauseLocation[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const loadPauses = async () => {
      const { data, error: pausesError } = await supabase.from('ticket_pauses').select('*')
        .eq('ticket_id', ticketId).order('started_at', { ascending: false });
      if (!active) return;
      if (pausesError) {
        setError('Não foi possível carregar o histórico de pausas.');
        setLoading(false);
        return;
      }
      const rows = (data || []) as PauseRecord[];
      setPauses(rows);

      const routePauseIds = canViewRoute ? rows.filter((pause) => pause.reason_code === 'COMPRA_MATERIAL').map((pause) => pause.id) : [];
      if (routePauseIds.length) {
        const { data: routeData, error: routeError } = await supabase.from('ticket_pause_locations').select('pause_id,latitude,longitude,recorded_at')
          .in('pause_id', routePauseIds).order('recorded_at', { ascending: true });
        if (!active) return;
        if (routeError) {
          setError('Não foi possível carregar os trajetos registrados.');
        } else {
          const grouped: Record<string, PauseLocation[]> = {};
          for (const location of routeData || []) {
            const pauseId = String(location.pause_id);
            (grouped[pauseId] ||= []).push({
              latitude: Number(location.latitude), longitude: Number(location.longitude), recorded_at: String(location.recorded_at),
            });
          }
          setLocations(grouped);
        }
      }
      if (active) setLoading(false);
    };
    void loadPauses();
    return () => { active = false; };
  }, [ticketId, canViewRoute]);

  if (loading) return <section className={styles.section}><p role="status">Carregando pausas...</p></section>;
  if (!pauses.length && !error) return null;

  return (
    <section className={styles.section} aria-labelledby="ticket-pause-history-heading">
      <h3 id="ticket-pause-history-heading" className={styles.heading}>Pausas do atendimento</h3>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <div className={styles.list}>
        {pauses.map((pause) => (
          <article key={pause.id} className={styles.pauseCard}>
            <div className={styles.cardHeading}>
              <h4>{getPauseReasonLabel(pause.reason_code)}</h4>
              <span className={pause.resumed_at ? styles.resumedBadge : styles.activeBadge}>{pause.resumed_at ? 'Retomado' : 'Pausado'}</span>
            </div>
            <p className={styles.duration}>Duração da pausa: {elapsedLabel(pause.started_at, pause.resumed_at)}</p>
            <dl className={styles.details}>
              <div><dt>Responsável</dt><dd>{pause.contact_name} · {pause.contact_role}</dd></div>
              <div><dt>Início</dt><dd>{new Date(pause.started_at).toLocaleString('pt-BR')}</dd></div>
              <div><dt>Previsão de retorno</dt><dd>{new Date(pause.expected_return_at).toLocaleString('pt-BR')}</dd></div>
              {pause.resumed_at && <div><dt>Retomada</dt><dd>{new Date(pause.resumed_at).toLocaleString('pt-BR')}</dd></div>}
            </dl>
            {pause.description && <p className={styles.description}>{pause.description}</p>}
            <a className={styles.evidenceLink} href={pause.evidence_url} target="_blank" rel="noopener noreferrer">
              <Image src={pause.evidence_url} alt={`Foto do impedimento: ${getPauseReasonLabel(pause.reason_code)}`} width={640} height={480} loading="lazy" unoptimized />
              <span>Ver foto do impedimento</span>
            </a>
            {canViewRoute && pause.reason_code === 'COMPRA_MATERIAL' && <div className={styles.routeSection}>
              <h5>Trajeto da compra de material</h5>
              <PauseRouteMap points={locations[pause.id] || []} />
              <p className={styles.privacyNote}>Este trajeto é visível somente para analistas e administradores.</p>
            </div>}
          </article>
        ))}
      </div>
    </section>
  );
}
