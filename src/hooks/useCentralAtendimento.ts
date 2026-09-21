import { useState, useEffect } from 'react';
import { createClient } from '../utils/supabase/client';
import { ITicket, IPerfil } from '../types/ticket';

export function useCentralAtendimento() {
  const [tickets, setTickets] = useState<ITicket[]>([]);
  const [perfis, setPerfis] = useState<IPerfil[]>([]);
  const [pdvs, setPdvs] = useState<any[]>([]);
  const [operadorAtual, setOperadorAtual] = useState<IPerfil | null>(null);
  const [loading, setLoading] = useState(true);

  // O cliente deve ser inicializado dentro do hook ou importado do singleton para evitar multiplas instancias
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        setLoading(true);
        // 1. Carregar Tickets
        const { data: ticketsData } = await supabase
          .from('tickets')
          .select('*')
          .order('criado_em', { ascending: false });
        if (ticketsData && isMounted) setTickets(ticketsData);

        // 2. Carregar Perfis
        const { data: perfisData } = await supabase
          .from('perfis')
          .select('id, nome, cargo, user_id')
          .order('nome');
        if (perfisData && isMounted) setPerfis(perfisData);

        // 3. Carregar PDVs (Loja)
        const { data: pdvsData } = await supabase
          .from('pdv')
          .select('loja, status_conexao');
        if (pdvsData && isMounted) setPdvs(pdvsData);

        // 4. Identificar Operador Logado
        const { data: authData } = await supabase.auth.getUser();
        if (authData?.user && isMounted) {
          const { data: perfil } = await supabase
            .from('perfis')
            .select('id, nome, cargo, user_id')
            .eq('user_id', authData.user.id)
            .eq('status', 'ATIVO')
            .single();
          if (perfil) setOperadorAtual(perfil);
        }
      } catch (error) {
        console.error('[Atendimento] Erro ao carregar dados:', error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchData();

    // 5. Configurar Realtime Tickets
    const channelTickets = supabase.channel('realtime_tickets_atendimento')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        supabase.from('tickets').select('*').order('criado_em', { ascending: false })
          .then(({ data }: { data: any }) => { if (data && isMounted) setTickets(data); });
      })
      .subscribe();

    // 6. Configurar Realtime PDVs (Status e Automação)
    const channelPdvs = supabase.channel('realtime_pdvs_atendimento')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'status_pdv' }, async (payload: any) => {
        // Recarrega lista
        supabase.from('pdv').select('loja, status_conexao')
          .then(({ data }: { data: any }) => { if (data && isMounted) setPdvs(data); });
        
        // Automação: Criação automática de ticket se PDV cair
        const record = payload.new as any;
        if (record && record.status_conexao) {
          const loja = record.loja;
          let isOffline = false;
          try {
            const pdvsList = JSON.parse(record.status_conexao);
            isOffline = pdvsList.some((p: any) => p.status === 'OFFLINE');
          } catch {
            isOffline = record.status_conexao === 'OFFLINE';
          }

          if (isOffline && loja.toLowerCase() !== 'bacio di latte') {
            // Usa o state mais recente de tickets (pode haver race condition aqui, ideal é fetch no server, mas mantemos a logica do cliente por hr)
            setTickets(currentTickets => {
              const temTicket = currentTickets.some(t => t.cliente === loja && t.status !== 'RESOLVIDO');
              if (!temTicket) {
                console.log(`Automação: Criando ticket para ${loja} (PDV Offline)`);
                fetch('/api/tomticket/webhook', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'ticket',
                    protocolo: `AUTO-${Date.now()}`,
                    subject: `[ALERTA AUTOMÁTICO] PDV Offline - ${loja}`,
                    description: `O monitoramento detectou que um ou mais caixas da loja ${loja} estão offline. Verifique imediatamente.`,
                    client: { name: loja }
                  })
                });
              }
              return currentTickets;
            });
          }
        }
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channelTickets);
      supabase.removeChannel(channelPdvs);
    };
  }, []);

  return { tickets, perfis, pdvs, operadorAtual, loading };
}
