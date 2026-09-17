'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criada_em: string;
  tipo: 'novo_chamado' | 'chamado_respondido' | 'chamado_fechado' | 'sistema';
  href?: string;
};

const STORAGE_KEY = 'critel_notificacoes';
const PREFS_KEY   = 'critel_notif_prefs';

export type NotifPrefs = {
  novoChamado: boolean;
  chamadoRespondido: boolean;
  chamadoFechado: boolean;
  som: boolean;
  desktop: boolean;
};

const defaultPrefs: NotifPrefs = {
  novoChamado: true,
  chamadoRespondido: true,
  chamadoFechado: false,
  som: true,
  desktop: true,
};

const DEPARTAMENTOS_TI = [
  'TI - Hardware',
  'TI - Software',
  'TI - Lojas',
  'TI - Telecom',
  'TI - Matriz',
  'TI - Acessos Protheus',
  'TI - Compras',
];

// ✅ FIX 1: Singleton de módulo — garante UMA única instância do GoTrueClient
// por toda a aplicação, independente de quantas vezes o hook for chamado.
let _supabase: ReturnType<typeof createBrowserClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
  }
  return _supabase;
}

function isEscopoTI(ticket: any): boolean {
  const depto: string = ticket.departamento || '';
  return DEPARTAMENTOS_TI.some(d => depto.toLowerCase().includes(d.toLowerCase()));
}

function tocarSom() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch {
    // Ignora se o navegador não suportar
  }
}

export function useNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [prefs, setPrefs]               = useState<NotifPrefs>(defaultPrefs);
  const naoLidas = notificacoes.filter(n => !n.lida).length;

  // ✅ FIX 2: Nome de canal único por instância do hook.
  // Mesmo em React Strict Mode (dupla montagem), cada ciclo cria um canal diferente,
  // eliminando o erro "cannot add postgres_changes after subscribe()".
  const channelName = useRef(`critel_ti_${Math.random().toString(36).slice(2)}`);

  // Carrega notificações e preferências do localStorage
  useEffect(() => {
    const saved     = localStorage.getItem(STORAGE_KEY);
    const savedPrefs = localStorage.getItem(PREFS_KEY);
    if (saved)      setNotificacoes(JSON.parse(saved));
    if (savedPrefs) setPrefs(JSON.parse(savedPrefs));
  }, []);

  // Salva notificações no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notificacoes));
  }, [notificacoes]);

  const adicionarNotificacao = useCallback((
    notif: Omit<Notificacao, 'id' | 'lida' | 'criada_em'>,
    prefsAtual: NotifPrefs
  ) => {
    const nova: Notificacao = {
      ...notif,
      id: crypto.randomUUID(),
      lida: false,
      criada_em: new Date().toISOString(),
    };

    setNotificacoes(prev => [nova, ...prev].slice(0, 50));

    if (prefsAtual.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(nova.titulo, {
        body: nova.mensagem,
        icon: '/critel-logo-light.svg',
      });
    }

    if (prefsAtual.som) tocarSom();
  }, []);

  // ✅ FIX 3: useRef para acessar o callback atualizado sem recriar o canal
  const adicionarRef = useRef(adicionarNotificacao);
  useEffect(() => { adicionarRef.current = adicionarNotificacao; }, [adicionarNotificacao]);

  // Subscrição Supabase Realtime — executa apenas 1x por instância
  useEffect(() => {
    const supabase   = getSupabase();
    const prefsAtual = JSON.parse(
      localStorage.getItem(PREFS_KEY) || JSON.stringify(defaultPrefs)
    ) as NotifPrefs;

    const channel = supabase
      .channel(channelName.current)   // nome único por instância
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'tickets' },
        (payload) => {
          if (!prefsAtual.novoChamado) return;
          const ticket = payload.new as any;
          if (!isEscopoTI(ticket)) return;

          adicionarRef.current({
            tipo: 'novo_chamado',
            titulo: '🎫 Novo Chamado — TI',
            mensagem: `#${ticket.protocolo_origem} · ${ticket.departamento || 'TI'} · ${ticket.cliente}: ${ticket.titulo || 'Sem assunto'}`,
            href: '/atendimento',
          }, prefsAtual);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets' },
        (payload) => {
          const ticket = payload.new as any;
          const old    = payload.old as any;
          if (!isEscopoTI(ticket)) return;

          if (prefsAtual.chamadoRespondido && ticket.status === 'RESPONDIDO' && old.status !== 'RESPONDIDO') {
            adicionarRef.current({
              tipo: 'chamado_respondido',
              titulo: '💬 Chamado Respondido — TI',
              mensagem: `#${ticket.protocolo_origem} · ${ticket.departamento || 'TI'} · ${ticket.cliente} respondeu`,
              href: '/atendimento',
            }, prefsAtual);
          }

          if (prefsAtual.chamadoFechado && ticket.status === 'FECHADO' && old.status !== 'FECHADO') {
            adicionarRef.current({
              tipo: 'chamado_fechado',
              titulo: '✅ Chamado Encerrado — TI',
              mensagem: `#${ticket.protocolo_origem} · ${ticket.departamento || 'TI'} · ${ticket.cliente} foi encerrado`,
              href: '/atendimento',
            }, prefsAtual);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []); // sem dependências — roda exatamente 1x no mount

  const marcarLida       = useCallback((id: string) => {
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  }, []);

  const marcarTodasLidas = useCallback(() => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  }, []);

  const limparTodas = useCallback(() => setNotificacoes([]), []);

  const salvarPrefs = useCallback((novasPrefs: NotifPrefs) => {
    setPrefs(novasPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(novasPrefs));
  }, []);

  const solicitarPermissaoDesktop = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return {
    notificacoes,
    naoLidas,
    prefs,
    marcarLida,
    marcarTodasLidas,
    limparTodas,
    salvarPrefs,
    solicitarPermissaoDesktop,
  };
}
