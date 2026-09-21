'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, Volume2, VolumeX, Monitor, Ticket, MessageSquare, CheckCircle2, Shield, Users, UserCheck, UserX, Crown, Wrench } from 'lucide-react';
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

  type PerfilRow = { id: string; nome: string; email: string; cargo: string; status: string };
  const [usuarios, setUsuarios] = useState<PerfilRow[]>([]);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    supabase.from('perfis').select('id,nome,email,cargo,status').order('nome').then(({ data }) => {
      if (data) setUsuarios(data);
    });
  }, []);

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

      {/* SEÇÃO: Gerenciar Usuários */}
      <div id="usuarios" style={{ marginTop: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Users size={22} color="#3b82f6" />
          <h2 style={{ margin: 0, color: '#f8fafc', fontSize: '1.3rem', fontWeight: 700 }}>Gerenciar Usuários</h2>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#0f172a' }}>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Colaborador</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cargo Atual</th>
                <th style={{ padding: '14px 20px', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                <th style={{ padding: '14px 20px', textAlign: 'right', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Alterar Cargo</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => {
                const cargoIcon = u.cargo === 'SUPER_ADMIN' ? <Crown size={14} color="#f59e0b" /> : u.cargo === 'ADMIN' ? <Shield size={14} color="#3b82f6" /> : <Wrench size={14} color="#94a3b8" />;
                const cargoCor = u.cargo === 'SUPER_ADMIN' ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' } : u.cargo === 'ADMIN' ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' } : { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
                const statusCor = u.status === 'ATIVO' ? '#10b981' : u.status === 'BANIDO' ? '#ef4444' : '#f59e0b';

                return (
                  <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid rgba(51,65,85,0.5)' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem', flexShrink: 0 }}>
                          {(u.nome || '?').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' }}>{u.nome}</div>
                          <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: cargoCor.bg, color: cargoCor.text, padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {cargoIcon} {u.cargo === 'TECNICO' ? 'TÉCNICO' : u.cargo}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ color: statusCor, fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusCor }}></div>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                      {u.cargo !== 'SUPER_ADMIN' && (
                        <select
                          value={u.cargo}
                          disabled={atualizando === u.id}
                          onChange={async (e) => {
                            const novoCargo = e.target.value;
                            setAtualizando(u.id);
                            await supabase.from('perfis').update({ cargo: novoCargo }).eq('id', u.id);
                            setUsuarios(prev => prev.map(p => p.id === u.id ? { ...p, cargo: novoCargo } : p));
                            setAtualizando(null);
                          }}
                          style={{ background: '#0f172a', border: '1px solid #334155', color: '#e2e8f0', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                        >
                          <option value="TECNICO">TÉCNICO</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        </select>
                      )}
                      {u.cargo === 'SUPER_ADMIN' && (
                        <span style={{ color: '#475569', fontSize: '0.82rem', fontStyle: 'italic' }}>Protegido</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
