'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Volume2, VolumeX, Monitor, Ticket, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useNotificacoes, NotifPrefs } from '@/hooks/useNotificacoes';
import { createBrowserClient } from '@supabase/ssr';

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '44px', height: '24px', borderRadius: '12px', cursor: 'pointer', position: 'relative', flexShrink: 0,
        background: checked ? '#3b82f6' : '#334155', transition: 'background 0.2s'
      }}
    >
      <div style={{
        width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
        position: 'absolute', top: '3px', transition: 'left 0.2s',
        left: checked ? '23px' : '3px'
      }} />
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
    <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div style={{ color: '#3b82f6' }}>{icon}</div>
        <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.1rem', fontWeight: 700 }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {children}
      </div>
    </div>
  );

  const Row = ({ label, desc, checked, onChange }: { label: string; desc?: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: '1px solid rgba(51,65,85,0.5)' }}>
      <div>
        <div style={{ color: '#e2e8f0', fontWeight: 500, fontSize: '0.95rem' }}>{label}</div>
        {desc && <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '2px' }}>{desc}</div>}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );

  return (
    <div style={{ padding: '2rem', flex: 1, maxWidth: '720px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>Configurações do Sistema</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Personalize alertas, notificações e comportamentos do painel</p>
      </div>

      {/* Permissão Desktop */}
      <div style={{
        background: permStatus === 'granted' ? 'rgba(16, 185, 129, 0.1)' : permStatus === 'denied' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
        border: `1px solid ${permStatus === 'granted' ? 'rgba(16,185,129,0.3)' : permStatus === 'denied' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
        borderRadius: '12px', padding: '16px 20px', marginBottom: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Monitor size={22} color={permStatus === 'granted' ? '#10b981' : permStatus === 'denied' ? '#ef4444' : '#f59e0b'} />
          <div>
            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.95rem' }}>Notificações de Desktop</div>
            <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '2px' }}>
              {permStatus === 'granted' && '✅ Permissão concedida — você receberá alertas mesmo fora do sistema'}
              {permStatus === 'denied' && '❌ Permissão negada — habilite nas configurações do seu navegador'}
              {permStatus === 'default' && '⚠️ Clique para permitir notificações do sistema operacional'}
              {permStatus === 'unsupported' && '⚠️ Seu navegador não suporta notificações desktop'}
            </div>
          </div>
        </div>
        {permStatus === 'default' && (
          <button onClick={pedirPermissao} style={{
            background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 18px',
            borderRadius: '8px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0
          }}>
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

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <button
          onClick={() => setLocal(prefs)}
          style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '10px 24px', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
        >
          Cancelar
        </button>
        <button
          onClick={salvar}
          style={{
            background: salvo ? '#10b981' : '#3b82f6', color: '#fff', border: 'none',
            padding: '10px 28px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700,
            transition: 'background 0.3s', display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          {salvo ? <><CheckCircle2 size={18} /> Salvo!</> : 'Salvar Preferências'}
        </button>
      </div>

    </div>
  );
}
