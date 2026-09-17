'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Bell as BellOff } from 'lucide-react';
import { useNotificacoes, Notificacao } from '@/hooks/useNotificacoes';
import Link from 'next/link';
import { useParams } from 'next/navigation';

function tempoRelativo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'agora mesmo';
  if (m < 60) return `${m}min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

const iconePorTipo: Record<Notificacao['tipo'], string> = {
  novo_chamado: '🎫',
  chamado_respondido: '💬',
  chamado_fechado: '✅',
  sistema: '⚙️',
};

export default function NotificacoesBell() {
  const { notificacoes, naoLidas, marcarLida, marcarTodasLidas, limparTodas, solicitarPermissaoDesktop } = useNotificacoes();
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const params = useParams();
  const lang = params.lang as string;

  useEffect(() => {
    solicitarPermissaoDesktop();
  }, [solicitarPermissaoDesktop]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setAberto(!aberto)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', position: 'relative', padding: '4px' }}
        title="Notificações"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span style={{
            position: 'absolute', top: '-5px', right: '-8px',
            background: '#ef4444', color: '#fff', fontSize: '0.65rem',
            padding: '2px 5px', borderRadius: '10px', fontWeight: 'bold',
            minWidth: '18px', textAlign: 'center'
          }}>
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 12px)', right: '-10px',
          width: '380px', background: '#1a1d26', border: '1px solid #32394c',
          borderRadius: '12px', boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
          zIndex: 200, overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #32394c', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem' }}>Notificações</span>
              {naoLidas > 0 && (
                <span style={{ marginLeft: '8px', background: '#ef4444', color: '#fff', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>
                  {naoLidas} novas
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas} title="Marcar todas como lidas"
                  style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.78rem' }}>
                  <CheckCheck size={14} /> Todas lidas
                </button>
              )}
              {notificacoes.length > 0 && (
                <button onClick={limparTodas} title="Limpar todas"
                  style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}>
                  <Trash2 size={14} />
                </button>
              )}
              <button onClick={() => setAberto(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
            {notificacoes.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>
                <BellOff size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.map(n => (
                <div
                  key={n.id}
                  style={{
                    padding: '14px 20px',
                    borderBottom: '1px solid rgba(50,57,76,0.5)',
                    background: n.lida ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    cursor: 'pointer', transition: 'background 0.15s'
                  }}
                  onClick={() => marcarLida(n.id)}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = n.lida ? 'transparent' : 'rgba(59, 130, 246, 0.05)')}
                >
                  <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{iconePorTipo[n.tipo]}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <span style={{ fontWeight: n.lida ? 400 : 600, color: n.lida ? '#94a3b8' : '#f1f5f9', fontSize: '0.88rem' }}>
                        {n.titulo}
                      </span>
                      {!n.lida && (
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', flexShrink: 0, marginTop: '4px' }} />
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.82rem', lineHeight: '1.4', wordBreak: 'break-word' }}>
                      {n.mensagem}
                    </p>
                    <span style={{ color: '#475569', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      {tempoRelativo(n.criada_em)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: '1px solid #32394c', textAlign: 'center' }}>
            <Link
              href={`/${lang}/admin/configuracoes`}
              style={{ color: '#3b82f6', fontSize: '0.85rem', textDecoration: 'none', fontWeight: 500 }}
              onClick={() => setAberto(false)}
            >
              ⚙️ Configurar Notificações
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
