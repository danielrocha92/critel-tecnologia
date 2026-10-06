import React from 'react';
import { DollarSign, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import type { OSSummary } from '../../services/osFinanceService';
import styles from './FinancialOSDashboard.module.css';

interface OSSummaryCardsProps {
  summary: OSSummary;
}

export default function OSSummaryCards({ summary }: OSSummaryCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <section className={styles.summaryGrid} aria-label="Resumo Financeiro de Ordens de Serviço">
      <div className={`${styles.summaryCard} ${styles.cardPrimary}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Total Faturável</h3>
          <DollarSign size={24} className={styles.cardIcon} aria-hidden="true" />
        </div>
        <p className={styles.cardValue}>{formatCurrency(summary.totalBillable)}</p>
      </div>

      <div className={`${styles.summaryCard} ${styles.cardWarning}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Pendente de Validação</h3>
          <Clock size={24} className={styles.cardIcon} aria-hidden="true" />
        </div>
        <p className={styles.cardValue}>{formatCurrency(summary.pendingValidation)}</p>
      </div>

      <div className={`${styles.summaryCard} ${styles.cardDanger}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Em Conflito / Glosa</h3>
          <AlertTriangle size={24} className={styles.cardIcon} aria-hidden="true" />
        </div>
        <p className={styles.cardValue}>{formatCurrency(summary.inConflict)}</p>
      </div>

      <div className={`${styles.summaryCard} ${styles.cardSuccess}`}>
        <div className={styles.cardHeader}>
          <h3 className={styles.cardTitle}>Pronto para Fechamento</h3>
          <CheckCircle size={24} className={styles.cardIcon} aria-hidden="true" />
        </div>
        <p className={styles.cardValue}>{formatCurrency(summary.readyToClose)}</p>
      </div>
    </section>
  );
}
