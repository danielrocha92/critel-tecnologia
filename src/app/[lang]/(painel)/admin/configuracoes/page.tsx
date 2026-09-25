'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Volume2, VolumeX, Monitor, Ticket, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useNotificacoes, NotifPrefs } from '@/hooks/useNotificacoes';
import { createBrowserClient } from '@supabase/ssr';
import styles from './configuracoes.module.css';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`${styles.toggleTrack} ${checked ? styles.toggleTrackOn : styles.toggleTrackOff}`}
    >
      <div className={`${styles.toggleThumb} ${checked ? styles.toggleThumbOn : styles.toggleThumbOff}`} />
    </div>
  );
}

type PermStatus = 'granted' | 'denied' | 'default' | 'unsupported';

export default function ConfiguracoesPage() {
  const { prefs, salvarPrefs, solicitarPermissaoDesktop } = useNotificacoes();
  const [local, setLocal] = useState<NotifPrefs>(prefs);
  const [permStatus, setPermStatus] = useState<PermStatus>('unsupported');
  const [salvo, setSalvo] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setLocal(prefs);
  }, [prefs]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermStatus(Notification.permission as PermStatus);
    }
  }, []);

  const atualizar = (key: keyof NotifPrefs, value: boolean) => {
    setLocal(prev => ({ ...prev, [key]: value }));
  };

  const salvar = () => {
    salvarPrefs(local);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  };

  const pedirPermissao = async () => {
    await solicitarPermissaoDesktop();
    if ('Notification' in window) {
      setPermStatus(Notification.permission as PermStatus);
    }
  };

  const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionIcon}>{icon}</div>
        <h2 className={styles.sectionTitle}>{title}</h2>
      </div>
      <div className={styles.sectionContent}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className={styles.rowContainer}>
      <div>
        <div className={styles.rowLabel}>{label}</div>
        {desc && <div className={styles.rowDesc}>{desc}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Configurações do Sistema</h1>
        <p className={styles.pageSubtitle}>Personalize alertas, notificações e comportamentos do painel</p>
      </div>

      {/* Permissão Desktop */}
      <div className={`${styles.permBox} ${permStatus === 'granted' ? styles.permGranted : permStatus === 'denied' ? styles.permDenied : styles.permDefault}`}>
        <div className={styles.permInfo}>
          <Monitor size={22} color={permStatus === 'granted' ? '#10b981' : permStatus === 'denied' ? '#ef4444' : '#f59e0b'} />
          <div>
            <div className={styles.permTitle}>Notificações de Desktop</div>
            <div className={styles.permDesc}>
              {permStatus === 'granted' && '✅ Permissão concedida — você receberá alertas mesmo fora do sistema'}
              {permStatus === 'denied' && '❌ Permissão negada — habilite nas configurações do seu navegador'}
              {permStatus === 'default' && '⚠️ Clique para permitir notificações do sistema operacional'}
              {permStatus === 'unsupported' && '⚠️ Seu navegador não suporta notificações desktop'}
            </div>
          </div>
        </div>
        {permStatus === 'default' && (
          <button onClick={pedirPermissao} className={styles.btnPerm}>
            Permitir Agora
          </button>
        )}
      </div>

      <Section title="Alertas de Chamados" icon={<Ticket size={20} />}>
        <Row
          label="Novo Chamado Recebido"
          desc="Notifica sempre que um chamado entrar pelo TomTicket"
          checked={local.novoChamado}
          onChange={v => atualizar('novoChamado', v)}
        />
        <Row
          label="Chamado Respondido pelo Cliente"
          desc="Notifica quando o cliente responder a um chamado existente"
          checked={local.chamadoRespondido}
          onChange={v => atualizar('chamadoRespondido', v)}
        />
        <Row
          label="Chamado Encerrado/Fechado"
          desc="Notifica quando um chamado for marcado como concluído"
          checked={local.chamadoFechado}
          onChange={v => atualizar('chamadoFechado', v)}
        />
      </Section>

      <Section title="Canal de Entrega" icon={<Bell size={20} />}>
        <Row
          label="Alerta Sonoro"
          desc="Toca um sinal de áudio ao receber notificações"
          checked={local.som}
          onChange={v => atualizar('som', v)}
        />
        <Row
          label="Notificações no Desktop (Sistema Operacional)"
          desc="Exibe alertas nativos do SO mesmo com o navegador minimizado"
          checked={local.desktop}
          onChange={v => atualizar('desktop', v)}
        />
      </Section>

      <div className={styles.actionsBar}>
        <button
          onClick={() => setLocal(prefs)}
          className={styles.btnCancel}
        >
          Cancelar
        </button>
        <button
          onClick={salvar}
          className={`${styles.btnSave} ${salvo ? styles.btnSaveSuccess : styles.btnSaveNormal}`}
        >
          {salvo ? <><CheckCircle2 size={18} /> Salvo!</> : 'Salvar Preferências'}
        </button>
      </div>

    </div>
  );
}
