'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ClipboardList,
  DollarSign,
  Headset,
  CircleDot,
  Users,
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './DashboardHome.module.css';

type DashboardStats = {
  tickets: number | null;
  contacts: number | null;
  open: number | null;
  inProgress: number | null;
  finalized: number | null;
  pendingApproval: number | null;
};

export default function DashboardHome() {
  const pathname = usePathname();
  const lang = pathname.split('/')[1] || 'pt';
  const [name, setName] = useState('');
  const [stats, setStats] = useState<DashboardStats>({
    tickets: null, contacts: null, open: null, inProgress: null, finalized: null, pendingApproval: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        if (isMounted) {
          setError(`Não foi possível carregar seu perfil: ${userError.message}`);
          setLoading(false);
        }
        return;
      }

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('perfis')
          .select('nome')
          .eq('user_id', user.id)
          .maybeSingle();

        if (profileError) {
          if (isMounted) {
            setError(`Não foi possível carregar seu perfil: ${profileError.message}`);
            setLoading(false);
          }
          return;
        }

        if (isMounted) setName(profile?.nome || user.email?.split('@')[0] || '');
      }

      const [ticketsResult, contactsResult, openResult, inProgressResult, finalizedResult, approvalResult] = await Promise.all([
        supabase
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .like('protocolo_origem', 'OS-%'),
        supabase.from('lojas_contatos').select('nome_loja', { count: 'exact', head: true }),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).like('protocolo_origem', 'OS-%').in('status', ['FILA', 'NOVO']),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).like('protocolo_origem', 'OS-%').in('status', ['ABERTO', 'EM_ANDAMENTO']),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).like('protocolo_origem', 'OS-%').in('status', ['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO']),
        supabase.from('tickets').select('id', { count: 'exact', head: true }).like('protocolo_origem', 'OS-%').eq('status', 'FINALIZADO').is('financeiro_aprovado_em', null),
      ]);

      if (!isMounted) return;

      const errors = [ticketsResult.error, contactsResult.error, openResult.error, inProgressResult.error, finalizedResult.error, approvalResult.error].filter(Boolean);
      if (errors.length > 0) {
        setError(`Alguns indicadores não puderam ser carregados: ${errors.map((item) => item?.message).join('; ')}`);
      }

      setStats({
        tickets: ticketsResult.error ? null : ticketsResult.count,
        contacts: contactsResult.error ? null : contactsResult.count,
        open: openResult.error ? null : openResult.count,
        inProgress: inProgressResult.error ? null : inProgressResult.count,
        finalized: finalizedResult.error ? null : finalizedResult.count,
        pendingApproval: approvalResult.error ? null : approvalResult.count,
      });
      setLoading(false);
    };

    void loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  const quickLinks = [
    {
      title: 'Painel do Analista',
      description: 'Acompanhe e gerencie as solicitações recebidas.',
      href: `/${lang}/analista`,
      icon: Headset,
      className: styles.iconSupport,
    },
    {
      title: 'Ordens de Serviço',
      description: 'Acesse a fila operacional e os serviços de campo.',
      href: `/${lang}/os`,
      icon: ClipboardList,
      className: styles.iconOrders,
    },
    {
      title: 'Financeiro',
      description: 'Consulte lançamentos e despesas das ordens.',
      href: `/${lang}/financeiro`,
      icon: DollarSign,
      className: styles.iconDepartments,
    },
    {
      title: 'Comercial',
      description: 'Consulte os cadastros comerciais das lojas.',
      href: `/${lang}/comercial`,
      icon: Users,
      className: styles.iconClients,
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.eyebrow}>CRITEL CORE · VISÃO GERAL</span>
          <h1 className={styles.title}>{name ? `Olá, ${name}` : 'Bem-vindo ao Critel Core'}</h1>
          <p className={styles.subtitle}>
            Acesse suas ferramentas e acompanhe a operação em um só lugar.
          </p>
        </div>
        <Link href={`/${lang}/analista`} className={styles.primaryAction}>
          Abrir painel
          <ArrowRight size={17} />
        </Link>
      </header>

      {error && (
        <div className={styles.errorNotice} role="status">
          {error}
        </div>
      )}

      <section className={styles.ticketStatusGrid} aria-label="Resumo dos chamados">
        <Link href={`/${lang}/os?statusGroup=open`} className={styles.statusCard}>
          <span className={`${styles.statusIcon} ${styles.statusOpen}`}><CircleDot size={19} /></span>
          <span className={styles.statusCopy}><span>Chamados em Aberto</span><strong>{loading ? '—' : stats.open ?? '—'}</strong></span>
          <ArrowRight size={17} className={styles.statusArrow} />
        </Link>
        <Link href={`/${lang}/os?statusGroup=in-progress`} className={styles.statusCard}>
          <span className={`${styles.statusIcon} ${styles.statusProgress}`}><Clock3 size={19} /></span>
          <span className={styles.statusCopy}><span>Em Andamento</span><strong>{loading ? '—' : stats.inProgress ?? '—'}</strong></span>
          <ArrowRight size={17} className={styles.statusArrow} />
        </Link>
        <Link href={`/${lang}/os?statusGroup=finalized`} className={styles.statusCard}>
          <span className={`${styles.statusIcon} ${styles.statusFinalized}`}><CheckCircle2 size={19} /></span>
          <span className={styles.statusCopy}><span>Finalizados</span><strong>{loading ? '—' : stats.finalized ?? '—'}</strong></span>
          <ArrowRight size={17} className={styles.statusArrow} />
        </Link>
        <Link href={`/${lang}/financeiro?filter=pendingValidation`} className={styles.statusCard}>
          <span className={`${styles.statusIcon} ${styles.statusValidation}`}><DollarSign size={19} /></span>
          <span className={styles.statusCopy}><span>Pendente de Validação (Financeiro)</span><strong>{loading ? '—' : stats.pendingApproval ?? '—'}</strong></span>
          <ArrowRight size={17} className={styles.statusArrow} />
        </Link>
      </section>

      <section className={styles.metrics} aria-label="Indicadores operacionais">
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.iconSupport}`}><ClipboardList size={19} /></span>
          <div>
            <p className={styles.metricLabel}>Solicitações cadastradas</p>
            <strong className={styles.metricValue}>
              {loading ? '—' : stats.tickets ?? 'Indisponível'}
            </strong>
          </div>
        </article>
        <article className={styles.metricCard}>
          <span className={`${styles.metricIcon} ${styles.iconClients}`}><Users size={19} /></span>
          <div>
            <p className={styles.metricLabel}>Contatos de lojas</p>
            <strong className={styles.metricValue}>
              {loading ? '—' : stats.contacts ?? 'Indisponível'}
            </strong>
          </div>
        </article>
      </section>

      <section className={styles.section} aria-labelledby="quick-links-title">
        <div className={styles.sectionHeader}>
          <div>
            <span className={styles.sectionEyebrow}>NAVEGAÇÃO</span>
            <h2 id="quick-links-title" className={styles.sectionTitle}>Acesso rápido</h2>
          </div>
          <span className={styles.sectionHint}>Escolha um ambiente para continuar</span>
        </div>

        <div className={styles.linkGrid}>
          {quickLinks.map(({ title, description, href, icon: Icon, className }) => (
            <Link key={title} href={href} className={styles.linkCard}>
              <span className={`${styles.linkIcon} ${className}`}><Icon size={21} /></span>
              <span className={styles.linkText}>
                <strong>{title}</strong>
                <span>{description}</span>
              </span>
              <ArrowRight size={17} className={styles.linkArrow} />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
