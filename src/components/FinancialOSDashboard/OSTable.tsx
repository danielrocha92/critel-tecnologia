'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Calculator, Eye } from 'lucide-react';
import type { FinancialOS } from '@/services/osFinanceService';
import styles from './FinancialOSDashboard.module.css';

interface OSTableProps {
  osList: FinancialOS[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onReconcile: (os: FinancialOS) => void;
}

export default function OSTable({ osList, selectedIds, onSelect, onSelectAll, onReconcile }: OSTableProps) {
  const params = useParams();
  const lang = params.lang as string;
  const closableIds = osList.filter((os) => os.financialStatus === 'CONCILIADO').map((os) => os.id);
  const isAllSelected = closableIds.length > 0 && closableIds.every((id) => selectedIds.includes(id));

  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

  const formatDate = (dateStr: string) => new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(dateStr));

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'CONCILIADO':
      case 'FATURADO':
        return styles.badgeConciliado;
      case 'DIVERGENTE':
      case 'GLOSADO':
        return styles.badgeDivergente;
      default:
        return styles.badgePendente;
    }
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table} aria-label="Conciliação financeira das ordens de serviço">
        <thead>
          <tr>
            <th scope="col" className={styles.checkboxCell}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(event) => onSelectAll(event.target.checked)}
                aria-label="Selecionar todas as OS conciliadas"
              />
            </th>
            <th scope="col">OS e data</th>
            <th scope="col">Técnico</th>
            <th scope="col">Cliente</th>
            <th scope="col">Mão de obra</th>
            <th scope="col">Outros custos</th>
            <th scope="col">Impostos</th>
            <th scope="col">Total faturável</th>
            <th scope="col">Situação financeira</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {osList.length === 0 ? (
            <tr className={styles.emptyTableRow}>
              <td colSpan={10} className={styles.emptyTableCell}>Nenhuma ordem de serviço encontrada.</td>
            </tr>
          ) : osList.map((os) => (
            <tr key={os.id}>
              <td className={styles.rowCheckboxCell} data-label="Selecionar">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(os.id)}
                  disabled={os.financialStatus !== 'CONCILIADO'}
                  onChange={(event) => onSelect(os.id, event.target.checked)}
                  aria-label={`Selecionar OS ${os.osNumber} para fechamento`}
                />
              </td>
              <td data-label="OS e data">
                <div className={styles.osNumber}>{os.osNumber}</div>
                <div className={styles.tableSubtext}>{formatDate(os.completionDate)}</div>
              </td>
              <td data-label="Técnico">{os.technicianName}</td>
              <td data-label="Cliente">{os.clientName}</td>
              <td data-label="Mão de obra" className={styles.currency}>{formatCurrency(os.laborValue)}</td>
              <td data-label="Outros custos" className={styles.currency}>{formatCurrency(os.partsValue)}</td>
              <td data-label="Impostos" className={styles.currency}>{formatCurrency(os.taxValue)}</td>
              <td data-label="Total faturável" className={`${styles.currency} ${styles.currencyTotal}`}>{formatCurrency(os.finalPrice)}</td>
              <td data-label="Situação financeira"><span className={`${styles.badge} ${getBadgeClass(os.financialStatus)}`}>{os.financialStatus}</span></td>
              <td data-label="Ações">
                <div className={styles.actionsCell}>
                  <Link
                    href={`/${lang}/os/${encodeURIComponent(os.ticketId)}`}
                    className={styles.btnAction}
                    title="Abrir ordem de serviço"
                    aria-label={`Abrir OS ${os.osNumber}`}
                  >
                    <Eye size={16} />
                  </Link>
                  <button
                    type="button"
                    className={styles.btnAction}
                    title="Conciliar valores"
                    aria-label={`Conciliar valores da OS ${os.osNumber}`}
                    onClick={() => onReconcile(os)}
                  >
                    <Calculator size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
