import React from 'react';
import { DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { OSSummary } from '../../services/osFinanceService';
import styles from './FinancialOSDashboard.module.css';

interface OSSummaryCardsProps {
  summary: OSSummary;
  selectedFilter: OSSummaryFilter | null;
  onSelectFilter: (filter: OSSummaryFilter) => void;
}

export type OSSummaryFilter = keyof OSSummary;

export default function OSSummaryCards({ summary, selectedFilter, onSelectFilter }: OSSummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const cards = [
    { key: 'totalBillable', title: 'Total Faturável', value: summary.totalBillable, icon: DollarSign, tone: styles.cardPrimary },
    { key: 'pendingValidation', title: 'Pendente de Validação', value: summary.pendingValidation, icon: Clock, tone: styles.cardWarning },
    { key: 'inConflict', title: 'Em Conflito / Glosa', value: summary.inConflict, icon: AlertTriangle, tone: styles.cardDanger },
    { key: 'readyToClose', title: 'Pronto para Fechamento', value: summary.readyToClose, icon: CheckCircle, tone: styles.cardSuccess },
  ] as const;

  return (
    <section className={styles.summaryGrid} aria-label="Resumo Financeiro de Ordens de Serviço">
      {cards.map(({ key, title, value, icon: Icon, tone }) => (
        <button
          type="button"
          key={key}
          className={`${styles.summaryCard} ${styles.summaryCardButton} ${tone} ${selectedFilter === key ? styles.summaryCardSelected : ''}`}
          onClick={() => onSelectFilter(key)}
          aria-pressed={selectedFilter === key}
          aria-label={`${title}: ${formatCurrency(value)}. Clique para ver as ordens correspondentes.`}
        >
          <span className={styles.cardIconWrap}>
            <Icon size={19} className={styles.cardIcon} aria-hidden="true" />
          </span>
          <span className={styles.summaryCopy}>
            <span className={styles.cardTitle}>{title}</span>
            <strong className={styles.cardValue}>{formatCurrency(value)}</strong>
          </span>
        </button>
      ))}
    </section>
  );
}
