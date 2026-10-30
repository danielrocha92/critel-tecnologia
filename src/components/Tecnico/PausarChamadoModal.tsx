'use client';

import { useState, type FormEvent } from 'react';
import { Camera, X } from 'lucide-react';
import { PAUSE_REASONS, type PauseReasonCode } from '@/lib/tickets/pauseReasons';
import styles from './PausarChamadoModal.module.css';

type PauseRecord = {
  id: string;
  reason_code: PauseReasonCode;
  started_at: string;
  expected_return_at: string;
  evidence_url: string;
  description: string | null;
  contact_name: string;
  contact_role: string;
  resumed_at: string | null;
};

const getLocalDateTimeMinimum = () => {
  const date = new Date(Date.now() + 60_000);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
};

export default function PausarChamadoModal({
  ticketId,
  lang,
  onClose,
  onSuccess,
}: {
  ticketId: string;
  lang: string;
  onClose: () => void;
  onSuccess: (pause: PauseRecord) => void;
}) {
  const [reasonCode, setReasonCode] = useState<PauseReasonCode>('LINK_OPERADORA');
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState('');
  const [expectedReturnAt, setExpectedReturnAt] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const reason = PAUSE_REASONS.find((item) => item.code === reasonCode)!;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!evidence) {
      setError('Anexe uma foto do impedimento antes de pausar.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      if (!expectedReturnAt || new Date(expectedReturnAt).getTime() <= Date.now()) throw new Error('A previsão de retorno deve estar no futuro.');
      formData.append('ticket_id', ticketId);
      formData.append('reason_code', reasonCode);
      formData.append('contact_name', contactName);
      formData.append('contact_role', contactRole);
      formData.append('expected_return_at', new Date(expectedReturnAt).toISOString());
      formData.append('description', description);
      formData.append('evidence', evidence);
      formData.append('lang', lang);

      if (reason.tracksRoute) {
        if (!window.isSecureContext || !navigator.geolocation) throw new Error('A localização GPS é necessária para registrar o trajeto da compra.');
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, () => reject(new Error('Permita o acesso à localização para iniciar o rastreamento do trajeto.')), {
            enableHighAccuracy: true, timeout: 15000, maximumAge: 0,
          });
        });
        formData.append('latitude', String(position.coords.latitude));
        formData.append('longitude', String(position.coords.longitude));
      }

      const response = await fetch('/api/tecnico/pausar-chamado', { method: 'POST', body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível pausar o chamado.');
      onSuccess(result.pause as PauseRecord);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Não foi possível pausar o chamado.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose(); }}>
      <section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="pause-title">
        <header className={styles.header}>
          <div>
            <h2 id="pause-title">Pausar chamado</h2>
            <p>Registre o impedimento para pausar o SLA e documentar a retomada.</p>
          </div>
          <button type="button" className={styles.closeButton} aria-label="Fechar" onClick={onClose} disabled={saving}><X size={20} /></button>
        </header>

        <form onSubmit={(event) => void handleSubmit(event)}>
          <div className={styles.body}>
            <label className={styles.field}>
              Motivo da pausa
              <select value={reasonCode} onChange={(event) => setReasonCode(event.target.value as PauseReasonCode)} required>
                {PAUSE_REASONS.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
              </select>
            </label>

            {reason.tracksRoute && <p className={styles.routeNotice} role="note">O trajeto será registrado enquanto o chamado estiver pausado. Mantenha o portal aberto e a localização ativa. O trajeto ficará visível somente para analistas.</p>}

            <div className={styles.fieldRow}>
              <label className={styles.field}>
                Responsável no local
                <input value={contactName} onChange={(event) => setContactName(event.target.value)} maxLength={150} autoComplete="name" required />
              </label>
              <label className={styles.field}>
                Cargo / função
                <input value={contactRole} onChange={(event) => setContactRole(event.target.value)} maxLength={100} required />
              </label>
            </div>

            <label className={styles.field}>
              Previsão de retorno
              <input type="datetime-local" value={expectedReturnAt} onChange={(event) => setExpectedReturnAt(event.target.value)} min={getLocalDateTimeMinimum()} required />
            </label>

            <label className={styles.field}>
              Observações do impedimento
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} maxLength={1000} placeholder="Descreva o que impede a continuidade do serviço." />
            </label>

            <label className={styles.field}>
              Foto do impedimento
              <span className={styles.fileControl}><Camera size={17} />{evidence?.name || 'Selecionar foto'}</span>
              <input className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={(event) => setEvidence(event.target.files?.[0] || null)} required />
              <span className={styles.fieldHint}>Obrigatória · JPEG, PNG ou WebP · até 10 MB</span>
            </label>

            {error && <p className={styles.error} role="alert">{error}</p>}
          </div>
          <footer className={styles.footer}>
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={saving}>Voltar</button>
            <button type="submit" className={styles.submitButton} disabled={saving}>{saving ? 'Registrando pausa...' : 'Confirmar pausa'}</button>
          </footer>
        </form>
      </section>
    </div>
  );
}
