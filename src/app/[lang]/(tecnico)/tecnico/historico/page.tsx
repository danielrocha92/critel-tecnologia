'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { CheckCircle, Calendar } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './historico.module.css';

export default function HistoricoPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchHistory = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from('tickets')
        .select('*')
        .or(`tecnico_id.eq.${userData.user.id},analista_id.eq.${userData.user.id}`)
        .eq('status', 'FINALIZADO')
        .order('atualizado_em', { ascending: false })
        .limit(20);

      setTickets(data || []);
      setLoading(false);
    };

    fetchHistory();
  }, [supabase]);

  if (loading) {
    return <div className={styles.loadingContainer}>Carregando histórico...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <h2 className={styles.title}>Histórico</h2>
      
      {tickets.length === 0 ? (
        <div className={styles.emptyState}>
          <Calendar size={48} className={styles.emptyIcon} />
          <h3 className={styles.emptyTitle}>Nenhum serviço</h3>
          <p className={styles.emptySubtitle}>Você ainda não finalizou nenhum chamado.</p>
        </div>
      ) : (
        <div className={styles.ticketsList}>
          {tickets.map(ticket => (
            <div key={ticket.id} className={styles.ticketCard}>
              <div className={styles.ticketStatusBorder}></div>
              <div className={styles.ticketHeader}>
                <strong className={styles.ticketClient}>{ticket.cliente}</strong>
                <span className={styles.ticketStatus}>
                  <CheckCircle size={14} /> Concluído
                </span>
              </div>
              <p className={styles.ticketTitle}>
                {ticket.titulo}
              </p>
              
              <div className={styles.ticketFooter}>
                <span className={styles.ticketDate}>
                  {new Date(ticket.atualizado_em).toLocaleDateString('pt-BR')}
                </span>
                <Link 
                  href={`/${lang}/tecnico/os/${ticket.id}`}
                  className={styles.btnDetails}
                >
                  Ver Detalhes
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
