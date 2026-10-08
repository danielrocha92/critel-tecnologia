'use client';

import { useEffect, useRef } from 'react';
import { CheckCircle, X } from 'lucide-react';
import type { FinancialOS } from '@/services/osFinanceService';
import styles from './FinancialOSDashboard.module.css';

interface OSExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedOSList: FinancialOS[];
  isProcessing: boolean;
}

export default function OSExportModal({ isOpen, onClose, onConfirm, selectedOSList, isProcessing }: OSExportModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  const totalValue = selectedOSList.reduce((total, os) => total + os.finalPrice, 0);
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

  return (
    <dialog ref={dialogRef} className={styles.modalDialog} onClose={onClose} aria-labelledby="modal-title">
      <header className={styles.modalHeader}>
        <h2 id="modal-title" className={styles.modalTitle}>Fechamento financeiro</h2>
        <button type="button" onClick={onClose} className={styles.modalClose} aria-label="Fechar janela" disabled={isProcessing}>
          <X size={20} />
        </button>
      </header>

      <div className={styles.modalBody}>
        <p className={styles.modalDescription}>
          Confirme o fechamento das OS conciliadas. O sistema baixará os lançamentos e gerará um arquivo CSV para integração financeira.
        </p>
        <ul className={styles.summaryList}>
          <li><span>OS conciliadas</span><strong>{selectedOSList.length}</strong></li>
          <li className={styles.summaryTotal}>
            <span>Total faturável</span>
            <strong>{formatCurrency(totalValue)}</strong>
          </li>
        </ul>
      </div>

      <footer className={styles.modalFooter}>
        <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={isProcessing}>Voltar</button>
        <button type="button" onClick={onConfirm} className={styles.btnPrimary} disabled={isProcessing || selectedOSList.length === 0}>
          {isProcessing ? 'Fechando...' : <><CheckCircle size={18} /> Confirmar fechamento</>}
        </button>
      </footer>
    </dialog>
  );
}
