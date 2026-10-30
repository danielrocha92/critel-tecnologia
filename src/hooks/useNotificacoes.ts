'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export type Notificacao = {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  criada_em: string;
  tipo: 'novo_chamado' | 'chamado_respondido' | 'chamado_fechado' | 'evidencia_enviada' | 'sistema';
  href?: string;
};

const STORAGE_KEY = 'critel_notificacoes';
const PREFS_KEY = 'critel_notif_prefs';

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
  'TI - Lojas',
  'TI - Pdv Parado',
  'TI - SmartPOS',
  'TI - Software',
  'TI - Telecom',
];

type TicketNotificationRow = Record<string, unknown> & {
  id: string;
  departamento?: string | null;
  protocolo_origem?: string | null;
  cliente?: string | null;
  titulo?: string | null;
  status?: string | null;
  analista_id?: string | null;
};

let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

function getSupabase() {
  if (!supabaseClient) {
    supabaseClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return supabaseClient;
}

function isEscopoTI(ticket: TicketNotificationRow) {
  const department = ticket.departamento || '';
  return DEPARTAMENTOS_TI.some((item) => department.toLowerCase().includes(item.toLowerCase()));
}

function tocarSom() {
  try {
    const AudioContextConstructor = window.AudioContext;
    const context = new AudioContextConstructor();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, context.currentTime);
    gain.gain.setValueAtTime(0.3, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.5);
  } catch {
    // O navegador pode não oferecer suporte a áudio.
  }
}

function readStoredNotifications(): Notificacao[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value as Notificacao[] : [];
  } catch {
    return [];
  }
}

function readStoredPrefs(): NotifPrefs {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    return value && typeof value === 'object' ? { ...defaultPrefs, ...value } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

export function useNotificacoes() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [prefs, setPrefs] = useState<NotifPrefs>(defaultPrefs);
  const [storageReady, setStorageReady] = useState(false);
  const prefsRef = useRef(prefs);
  const naoLidas = notificacoes.filter((notification) => !notification.lida).length;

  useEffect(() => {
    const storedNotifications = readStoredNotifications();
    const storedPrefs = readStoredPrefs();
    // Local storage is read after hydration to keep server and first client render aligned.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotificacoes(storedNotifications);
    setPrefs(storedPrefs);
    prefsRef.current = storedPrefs;
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notificacoes));
  }, [notificacoes, storageReady]);

  const adicionarNotificacao = useCallback((notification: Omit<Notificacao, 'id' | 'lida' | 'criada_em'>) => {
    const newNotification: Notificacao = {
      ...notification,
      id: crypto.randomUUID(),
      lida: false,
      criada_em: new Date().toISOString(),
    };

    setNotificacoes((current) => [newNotification, ...current].slice(0, 50));
    const currentPrefs = prefsRef.current;
    if (currentPrefs.desktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotification.titulo, {
        body: newNotification.mensagem,
        icon: '/400PngdpiLogoCropped.png',
      });
    }
    if (currentPrefs.som) tocarSom();
  }, []);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<ReturnType<typeof getSupabase>['channel']> | null = null;
    const supabase = getSupabase();

    const subscribe = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (!active) return;
      if (error) {
        console.error('Não foi possível iniciar as notificações em tempo real:', error.message);
        return;
      }
      const currentUserId = data.user?.id;
      if (!currentUserId) return;
      const language = window.location.pathname.split('/')[1] || 'pt';
      channel = supabase
        .channel(`critel_notifications_${crypto.randomUUID()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' },
          (payload: RealtimePostgresChangesPayload<TicketNotificationRow>) => {
            const ticket = payload.new as TicketNotificationRow;
            if (!prefsRef.current.novoChamado || !isEscopoTI(ticket)) return;
            adicionarNotificacao({
              tipo: 'novo_chamado',
              titulo: 'Novo chamado — TI',
              mensagem: `#${ticket.protocolo_origem || ticket.id} · ${ticket.departamento || 'TI'} · ${ticket.cliente || 'Cliente'}: ${ticket.titulo || 'Sem assunto'}`,
              href: `/${language}/analista`,
            });
          })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets' },
          (payload: RealtimePostgresChangesPayload<TicketNotificationRow>) => {
            const ticket = payload.new as TicketNotificationRow;
            const oldTicket = payload.old as Partial<TicketNotificationRow>;
            if (!isEscopoTI(ticket)) return;

            if (prefsRef.current.chamadoRespondido && ticket.status === 'RESPONDIDO' && oldTicket.status !== 'RESPONDIDO') {
              adicionarNotificacao({
                tipo: 'chamado_respondido',
                titulo: 'Chamado respondido — TI',
                mensagem: `#${ticket.protocolo_origem || ticket.id} · ${ticket.departamento || 'TI'} · ${ticket.cliente || 'Cliente'} respondeu`,
                href: `/${language}/analista`,
              });
            }
            if (prefsRef.current.chamadoFechado && ticket.status === 'FECHADO' && oldTicket.status !== 'FECHADO') {
              adicionarNotificacao({
                tipo: 'chamado_fechado',
                titulo: 'Chamado encerrado — TI',
                mensagem: `#${ticket.protocolo_origem || ticket.id} · ${ticket.departamento || 'TI'} · ${ticket.cliente || 'Cliente'} foi encerrado`,
                href: `/${language}/analista`,
              });
            }
          })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${currentUserId}` },
          (payload: RealtimePostgresChangesPayload<Notificacao>) => {
            const notification = payload.new as Notificacao;
            setNotificacoes((current) => current.some((item) => item.id === notification.id)
              ? current
              : [notification, ...current].slice(0, 50));
            const currentPrefs = prefsRef.current;
            if (currentPrefs.desktop && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(notification.titulo, { body: notification.mensagem, icon: '/400PngdpiLogoCropped.png' });
            }
            if (currentPrefs.som) tocarSom();
          })
        .subscribe((status: string, subscriptionError?: Error) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error('Realtime de notificações desconectado:', status, subscriptionError);
          }
        });
      const { data: savedNotifications, error: savedNotificationsError } = await supabase
        .from('notificacoes').select('*').order('criada_em', { ascending: false }).limit(50);
      if (savedNotificationsError) {
        console.error('Could not load saved notifications:', savedNotificationsError.message);
      } else if (active && savedNotifications) {
        setNotificacoes((current) => {
          const combined = [...savedNotifications as Notificacao[], ...current];
          return Array.from(new Map(combined.map((item) => [item.id, item])).values())
            .sort((a, b) => new Date(b.criada_em).getTime() - new Date(a.criada_em).getTime())
            .slice(0, 50);
        });
      }
    };

    void subscribe();
    return () => {
      active = false;
      if (channel) void supabase.removeChannel(channel);
    };
  }, [adicionarNotificacao]);

  const marcarLida = useCallback((id: string) => {
    setNotificacoes((current) => current.map((item) => item.id === id ? { ...item, lida: true } : item));
    void (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('notificacoes').update({ lida: true }).eq('id', id).eq('user_id', user.id);
    })();
  }, []);

  const marcarTodasLidas = useCallback(() => {
    setNotificacoes((current) => current.map((item) => ({ ...item, lida: true })));
    void (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('notificacoes').update({ lida: true }).eq('user_id', user.id).eq('lida', false);
    })();
  }, []);

  const limparTodas = useCallback(() => {
    setNotificacoes([]);
    void (async () => {
      const supabase = getSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('notificacoes').delete().eq('user_id', user.id);
    })();
  }, []);

  const salvarPrefs = useCallback((newPrefs: NotifPrefs) => {
    prefsRef.current = newPrefs;
    setPrefs(newPrefs);
    localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
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
