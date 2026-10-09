'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import type { ITicket } from '@/types/ticket';
import styles from './ServiceReportSection.module.css';

type ServiceReport = {
  hora_inicio?: string | number | null;
  hora_termino?: string | number | null;
  descricao_servicos?: string | null;
  materiais_utilizados?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  assinatura_base64?: string | null;
  criado_em?: string | null;
};

function formatDate(value?: string | number | Date | null) {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleString('pt-BR');
}

function getMapEmbedUrl(latitude: number, longitude: number) {
  const latitudeOffset = 0.004;
  const longitudeOffset = 0.005;
  const bounds = [
    longitude - longitudeOffset,
    latitude - latitudeOffset,
    longitude + longitudeOffset,
    latitude + latitudeOffset,
  ].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bounds}&layer=mapnik&marker=${latitude},${longitude}`;
}

function isValidCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude)
    && latitude >= -90 && latitude <= 90
    && longitude >= -180 && longitude <= 180;
}

export default function ServiceReportSection({ ticket }: { ticket: ITicket }) {
  const [savedReport, setSavedReport] = useState<ServiceReport | null>(null);

  useEffect(() => {
    let active = true;
    const loadSavedReport = async () => {
      const { data } = await createClient()
        .from('servicos_concluidos')
        .select('hora_inicio, hora_termino, descricao_servicos, materiais_utilizados, latitude, longitude, assinatura_base64, criado_em')
        .eq('ticket_id', ticket.id)
        .order('criado_em', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (active && data) setSavedReport(data as ServiceReport);
    };
    void loadSavedReport();
    return () => { active = false; };
  }, [ticket.id]);

  const report = ticket.resolucao;
  const signature = report?.assinaturaUrl || report?.assinatura_base64 || savedReport?.assinatura_base64;
  const beforeImage = report?.evidenciaAntesUrl;
  const afterImage = report?.evidenciaDepoisUrl;
  const expenses = report?.despesas || ticket.despesas_json || [];
  const start = report?.horaInicio ?? savedReport?.hora_inicio ?? ticket.check_in_at;
  const end = report?.horaTermino ?? savedReport?.hora_termino ?? ticket.check_out_at ?? ticket.atualizado_em;
  const signatureAt = report?.assinaturaDataHora || report?.assinatura_datahora || ticket.assinatura_datahora || savedReport?.criado_em;
  const signatureDate = formatDate(signatureAt);
  const signatureDateValue = signatureAt ? new Date(signatureAt) : null;
  const description = report?.descricaoServicos || savedReport?.descricao_servicos;
  const materials = report?.materiaisUtilizados || savedReport?.materiais_utilizados;
  const latitude = report?.latitude ?? savedReport?.latitude ?? ticket.check_out_lat;
  const longitude = report?.longitude ?? savedReport?.longitude ?? ticket.check_out_lng;
  const checkInLocation = ticket.check_in_lat != null && ticket.check_in_lng != null
    && isValidCoordinate(ticket.check_in_lat, ticket.check_in_lng)
    ? { latitude: ticket.check_in_lat, longitude: ticket.check_in_lng }
    : null;
  const checkoutLocation = latitude != null && longitude != null
    && isValidCoordinate(latitude, longitude)
    ? { latitude, longitude }
    : null;
  const hasDetails = Boolean(report || savedReport || signature || beforeImage || afterImage);
  const totalExpenses = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.valor_numerico ?? item.valor ?? 0), 0), [expenses]);

  if (!hasDetails) return null;

  return (
    <section className={styles.report} aria-labelledby="service-report-title">
      <header className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Laudo técnico</p>
          <h2 id="service-report-title" className={styles.title}>Atendimento concluído</h2>
        </div>
        <span className={styles.status}>Finalizado</span>
      </header>

      <dl className={styles.metadata}>
        <div><dt>Categoria do problema</dt><dd>{ticket.categoria || 'Não informada'}</dd></div>
        <div><dt>Causa raiz selecionada</dt><dd>{ticket.causa_raiz || report?.causaRaiz || 'Não informada'}{(ticket.causa_raiz_detalhe || report?.causaRaizDetalhe) ? ` — ${ticket.causa_raiz_detalhe || report?.causaRaizDetalhe}` : ''}</dd></div>
        <div><dt>Início do atendimento</dt><dd>{formatDate(start) || 'Não informado'}</dd></div>
        <div><dt>Término do atendimento</dt><dd>{formatDate(end) || 'Não informado'}</dd></div>
      </dl>

      <div className={styles.locations}>
        <LocationMap title="Localização do check-in" location={checkInLocation} />
        <LocationMap title="Localização do encerramento" location={checkoutLocation} />
      </div>

      <div className={styles.textDetails}>
        <div><h3>Serviços executados</h3><p>{description || 'Não informado'}</p></div>
        <div><h3>Materiais utilizados</h3><p>{materials || 'Nenhum material informado'}</p></div>
      </div>

      {(beforeImage || afterImage || report) && (
        <div className={styles.evidenceGrid}>
          <figure className={styles.evidence}>
            {beforeImage ? <img src={beforeImage} alt="Registro fotográfico antes do atendimento" width={640} height={400} loading="lazy" /> : <div className={styles.missingEvidence}>Imagem anterior não disponível</div>}
            <figcaption>Antes do atendimento</figcaption>
          </figure>
          <figure className={styles.evidence}>
            {afterImage ? <img src={afterImage} alt="Registro fotográfico após o atendimento" width={640} height={400} loading="lazy" /> : <div className={styles.missingEvidence}>Imagem posterior não disponível</div>}
            <figcaption>Após o atendimento</figcaption>
          </figure>
        </div>
      )}

      <figure className={styles.signature}>
        <figcaption>
          <span>Assinatura do responsável</span>
          <time dateTime={signatureDateValue && !Number.isNaN(signatureDateValue.getTime()) ? signatureDateValue.toISOString() : undefined}>
            {signatureDate || 'Data e hora não informadas'}
          </time>
        </figcaption>
        {signature ? <img src={signature} alt="Assinatura digital do responsável pelo atendimento" width={500} height={200} loading="lazy" /> : <div className={styles.missingEvidence}>Assinatura não encontrada no registro desta OS</div>}
      </figure>

      {expenses.length > 0 && (
        <div className={styles.expenses}>
          <h3>Despesas e comprovantes</h3>
          <ul>{expenses.map((item, index) => (
            <li key={`${item.natureza || 'despesa'}-${index}`}>
              <span>{item.natureza || 'Despesa'}</span>
              <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(item.valor_numerico ?? item.valor ?? 0))}</strong>
              {item.anexoUrl && <a href={item.anexoUrl} target="_blank" rel="noopener noreferrer">Abrir comprovante</a>}
            </li>
          ))}</ul>
          <p className={styles.expenseTotal}>Total de despesas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalExpenses)}</p>
        </div>
      )}
    </section>
  );
}

function LocationMap({
  title,
  location,
}: {
  title: string;
  location: { latitude: number; longitude: number } | null;
}) {
  if (!location) {
    return (
      <section className={styles.locationCard} aria-label={title}>
        <h3>{title}</h3>
        <p className={styles.missingEvidence}>Coordenadas não informadas</p>
      </section>
    );
  }

  return (
    <section className={styles.locationCard} aria-label={title}>
      <div className={styles.locationHeader}>
        <h3>{title}</h3>
        <a
          href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}#map=17/${location.latitude}/${location.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >Abrir mapa</a>
      </div>
      <p className={styles.coordinates}>{location.latitude}, {location.longitude}</p>
      <iframe
        className={styles.mapFrame}
        src={getMapEmbedUrl(location.latitude, location.longitude)}
        title={`${title} no mapa`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </section>
  );
}
