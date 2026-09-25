'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Bell as BellOff } from 'lucide-react';
import { useNotificacoes, Notificacao } from '@/hooks/useNotificacoes';
import Link from 'next/link';
import styles from './NotificacoesBell.module.css';
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
    <div ref={ref} className={styles.wrapper}>
      <button
        onClick={() => setAberto(!aberto)}
        className={styles.bellButton}
        title="Notificações"
      >
        <Bell size={20} />
        {naoLidas > 0 && (
          <span className={styles.badge}>
            {naoLidas > 99 ? '99+' : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <div className={styles.dropdown}>
          {/* Header */}
          <div className={styles.header}>
            <div>
              <span className={styles.title}>Notificações</span>
              {naoLidas > 0 && (
                <span className={styles.newBadge}>
                  {naoLidas} novas
                </span>
              )}
            </div>
            <div className={styles.actions}>
              {naoLidas > 0 && (
                <button onClick={marcarTodasLidas} title="Marcar todas como lidas" className={styles.markAllBtn}>
                  <CheckCheck size={14} /> Todas lidas
                </button>
              )}
              {notificacoes.length > 0 && (
                <button onClick={limparTodas} title="Limpar todas" className={styles.clearBtn}>
                  <Trash2 size={14} />
                </button>
              )}
              <button onClick={() => setAberto(false)} className={styles.closeBtn}>
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className={styles.list}>
            {notificacoes.length === 0 ? (
              <div className={styles.emptyState}>
                <BellOff size={32} className={styles.emptyIcon} />
                <p className={styles.emptyText}>Nenhuma notificação</p>
              </div>
            ) : (
              notificacoes.map(n => (
                <div
                  key={n.id}
                  className={`${styles.item} ${n.lida ? styles.itemLida : styles.itemNaoLida}`}
                  onClick={() => marcarLida(n.id)}
                >
                  <span className={styles.icon}>{iconePorTipo[n.tipo]}</span>
                  <div className={styles.content}>
                    <div className={styles.itemHeader}>
                      <span className={`${styles.itemTitle} ${n.lida ? styles.titleLida : styles.titleNaoLida}`}>
                        {n.titulo}
                      </span>
                      {!n.lida && (
                        <div className={styles.dot} />
                      )}
                    </div>
                    <p className={styles.message}>
                      {n.mensagem}
                    </p>
                    <span className={styles.time}>
                      {tempoRelativo(n.criada_em)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className={styles.footer}>
            <Link
              href={`/${lang}/admin/configuracoes`}
              className={styles.configLink}
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
