'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ExternalLink, RefreshCw, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import styles from './FinancialApprovalDashboard.module.css';

type PendingTicket = {
  id: string;
  protocolo_origem: string | null;
  titulo: string | null;
  cliente: string | null;
  tecnico_id: string | null;
  valor_pagamento: number | string | null;
  despesas_json: Array<{ natureza?: string; valor?: number | string; valor_numerico?: number | string }> | null;
  criado_em: string | null;
};

type TechnicianProfile = { user_id: string; nome: string | null };

const supabase = createClient();

function currency(value: number | string | null | undefined) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(value || 0));
}

function expensesTotal(expenses: PendingTicket['despesas_json']) {
  return (expenses || []).reduce((sum, expense) => sum + Number(expense.valor_numerico ?? expense.valor ?? 0), 0);
}

export default function FinancialApprovalDashboard() {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'pt';
  const [tickets, setTickets] = useState<PendingTicket[]>([]);
  const [technicians, setTechnicians] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingTicketId, setProcessingTicketId] = useState<string | null>(null);

  const loadTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('id, protocolo_origem, titulo, cliente, tecnico_id, valor_pagamento, despesas_json, criado_em')
      .like('protocolo_origem', 'OS-%')
      .eq('status', 'FINALIZADO')
      .is('financeiro_aprovado_em', null)
      .order('atualizado_em', { ascending: false })
      .limit(500);

    if (error) throw error;
    const rows = (data || []) as PendingTicket[];
    setTickets(rows);
    const technicianIds = [...new Set(rows.map((ticket) => ticket.tecnico_id).filter((id): id is string => Boolean(id)))];
    if (!technicianIds.length) {
      setTechnicians({});
      return;
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('perfis')
      .select('user_id, nome')
      .in('user_id', technicianIds);
    if (profilesError) throw profilesError;
    setTechnicians(Object.fromEntries(((profiles || []) as TechnicianProfile[]).map((profile) => [profile.user_id, profile.nome || 'Técnico'])));
  }, []);

  useEffect(() => {
    let active = true;
    const initializeQueue = async () => {
      try {
        await loadTickets();
      } catch (error) {
        console.error('Erro ao carregar OSs para validação:', error);
        if (active) toast.error('Não foi possível carregar as OSs pendentes de validação.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void initializeQueue();
    return () => { active = false; };
  }, [loadTickets]);

  const refresh = async () => {
    setRefreshing(true);
    try {
      await loadTickets();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar a fila.');
    } finally {
      setRefreshing(false);
    }
  };

  const returnToTechnician = async (ticket: PendingTicket) => {
    const protocol = ticket.protocolo_origem || ticket.id.slice(0, 8);
    const confirmed = window.confirm(`Reabrir a OS ${protocol} e devolvê-la ao técnico para ajustes? O valor não será liberado.`);
    if (!confirmed) return;
    setProcessingTicketId(ticket.id);
    try {
      const response = await fetch('/api/financeiro/aprovar-os', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticket.id, action: 'reabrir' }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível atualizar esta OS.');
      setTickets((previous) => previous.filter((item) => item.id !== ticket.id));
      toast.success('OS reaberta e devolvida ao técnico para ajustes.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Não foi possível atualizar esta OS.');
    } finally {
      setProcessingTicketId(null);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>DEPARTAMENTO FINANCEIRO</span>
          <h1 className={styles.title}>Validação de ordens de serviço</h1>
          <p className={styles.description}>Abra os detalhes para revisar o laudo e os valores antes de fechar e liberar o pagamento.</p>
        </div>
        <button type="button" className={styles.refreshButton} onClick={() => void refresh()} disabled={refreshing || loading}>
          <RefreshCw size={16} className={refreshing ? styles.spinning : undefined} /> Atualizar
        </button>
      </header>

      <section className={styles.panel} aria-labelledby="pending-approvals-title">
        <div className={styles.panelHeader}>
          <div>
            <h2 className={styles.panelTitle} id="pending-approvals-title">Pendente de validação</h2>
            <p className={styles.panelSubtitle}>{tickets.length} ordem(ns) finalizada(s)</p>
          </div>
        </div>
        {loading ? (
          <p className={styles.stateMessage} role="status">Carregando ordens de serviço...</p>
        ) : tickets.length === 0 ? (
          <p className={styles.stateMessage}>Não há OSs encerradas aguardando validação.</p>
        ) : (
          <div className={styles.tableScroll}>
            <table className={styles.table}>
              <thead>
                <tr><th>OS</th><th>Cliente</th><th>Técnico</th><th>Valor da abertura</th><th>Despesas</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td data-label="OS">
                      <strong>{ticket.protocolo_origem || ticket.id.slice(0, 8)}</strong>
                      <span className={styles.secondaryText}>{ticket.criado_em ? new Date(ticket.criado_em).toLocaleDateString('pt-BR') : '—'}</span>
                    </td>
                    <td data-label="Cliente">{ticket.cliente || 'Não informado'}</td>
                    <td data-label="Técnico">{ticket.tecnico_id ? technicians[ticket.tecnico_id] || 'Carregando...' : 'Não atribuído'}</td>
                    <td data-label="Valor da abertura" className={styles.currency}>{currency(ticket.valor_pagamento)}</td>
                    <td data-label="Despesas" className={styles.currency}>{currency(expensesTotal(ticket.despesas_json))}</td>
                    <td data-label="Ações" className={styles.actions}>
                      <Link href={`/${lang}/os/${encodeURIComponent(ticket.id)}`} className={styles.detailsLink} aria-label={`Abrir OS ${ticket.protocolo_origem || ticket.id}`}>
                        <ExternalLink size={16} /> Detalhes
                      </Link>
                      <button type="button" className={styles.returnButton} onClick={() => void returnToTechnician(ticket)} disabled={processingTicketId !== null}>
                        <RotateCcw size={16} /> {processingTicketId === ticket.id ? 'Devolvendo...' : 'Reabrir e devolver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
