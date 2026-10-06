import React from 'react';
import Link from 'next/link';
import { Eye, FileText, AlertTriangle } from 'lucide-react';
import type { FinancialOS } from '../../services/osFinanceService';
import styles from './FinancialOSDashboard.module.css';

interface OSTableProps {
  osList: FinancialOS[];
  selectedIds: string[];
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

export default function OSTable({ osList, selectedIds, onSelect, onSelectAll }: OSTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dateStr));
  };

  const isAllSelected = osList.length > 0 && selectedIds.length === osList.length;

  const getBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDENTE': return styles.badgePendente;
      case 'CONCILIADO': return styles.badgeConciliado;
      case 'APROVADA': return styles.badgeAprovada;
      case 'FATURADA': return styles.badgeFaturada;
      case 'DIVERGENTE': return styles.badgeDivergente;
      case 'GLOSADA': return styles.badgeGlosada;
      default: return styles.badgePendente;
    }
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table} aria-label="Tabela de Conciliação de Ordens de Serviço">
        <thead>
          <tr>
            <th scope="col" style={{ width: '40px' }}>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => onSelectAll(e.target.checked)}
                aria-label="Selecionar todas as Ordens de Serviço"
              />
            </th>
            <th scope="col">Nº OS & Data</th>
            <th scope="col">Técnico Responsável</th>
            <th scope="col">Cliente / Unidade</th>
            <th scope="col">Mão de Obra</th>
            <th scope="col">Peças</th>
            <th scope="col">Total</th>
            <th scope="col">Status Fin.</th>
            <th scope="col">Ações</th>
          </tr>
        </thead>
        <tbody>
          {osList.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                Nenhuma Ordem de Serviço encontrada com os filtros atuais.
              </td>
            </tr>
          ) : (
            osList.map((os) => (
              <tr key={os.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(os.id)}
                    onChange={(e) => onSelect(os.id, e.target.checked)}
                    aria-label={`Selecionar OS ${os.osNumber}`}
                  />
                </td>
                <td>
                  <div className={styles.osNumber}>{os.osNumber}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formatDate(os.completionDate)}</div>
                </td>
                <td>{os.technicianName}</td>
                <td>{os.clientName}</td>
                <td className={styles.currency}>{formatCurrency(os.laborValue)}</td>
                <td className={styles.currency}>{formatCurrency(os.partsValue)}</td>
                <td className={`${styles.currency} ${styles.currencyTotal}`}>{formatCurrency(os.totalValue)}</td>
                <td>
                  <span className={`${styles.badge} ${getBadgeClass(os.financialStatus)}`}>
                    {os.financialStatus}
                  </span>
                </td>
                <td>
                  <div className={styles.actionsCell}>
                    <Link href={`/pt/os/${os.id}`} className={styles.btnAction} title="Detalhar OS" aria-label={`Detalhar OS ${os.osNumber}`}>
                      <Eye size={16} />
                    </Link>
                    <button type="button" className={styles.btnAction} title="Anexos" aria-label={`Anexos da OS ${os.osNumber}`} onClick={() => alert('Visualização de anexos em desenvolvimento')}>
                      <FileText size={16} />
                    </button>
                    <button type="button" className={styles.btnAction} title="Marcar Conflito" aria-label={`Marcar Conflito na OS ${os.osNumber}`} onClick={() => alert('Funcionalidade de glosa/conflito em desenvolvimento')}>
                      <AlertTriangle size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
