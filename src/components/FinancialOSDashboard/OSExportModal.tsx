import React, { useEffect, useRef } from 'react';
import { X, Download, CheckCircle } from 'lucide-react';
import type { FinancialOS } from '../../services/osFinanceService';
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

    if (isOpen) {
      if (!dialog.open) dialog.showModal();
    } else {
      if (dialog.open) dialog.close();
    }
  }, [isOpen]);

  const totalValue = selectedOSList.reduce((acc, os) => acc + os.totalValue, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.modalDialog}
      onClose={onClose}
      aria-labelledby="modal-title"
    >
      <header className={styles.modalHeader}>
        <h2 id="modal-title" className={styles.modalTitle}>Fechamento e Exportação</h2>
        <button
          type="button"
          onClick={onClose}
          className={styles.modalClose}
          aria-label="Fechar janela"
          disabled={isProcessing}
        >
          <X size={20} />
        </button>
      </header>

      <div className={styles.modalBody}>
        <p style={{ marginBottom: '20px', lineHeight: '1.5' }}>
          Você está prestes a fechar e consolidar as Ordens de Serviço selecionadas. Esta ação travará o ciclo dessas OSs, impedindo alterações posteriores pelos técnicos.
        </p>

        <ul className={styles.summaryList}>
          <li>
            <span>OSs Selecionadas:</span>
            <strong>{selectedOSList.length} itens</strong>
          </li>
          <li>
            <span>Valor Total a Faturar:</span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--accent-brand)' }}>
              {formatCurrency(totalValue)}
            </strong>
          </li>
        </ul>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          Ao confirmar, o sistema gerará os arquivos de integração (CSV/JSON) para o seu ERP.
        </p>
      </div>

      <footer className={styles.modalFooter}>
        <button
          type="button"
          onClick={onClose}
          className={styles.btnSecondary}
          disabled={isProcessing}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={styles.btnPrimary}
          disabled={isProcessing || selectedOSList.length === 0}
        >
          {isProcessing ? (
            'Processando...'
          ) : (
            <>
              <CheckCircle size={18} />
              Confirmar Fechamento
            </>
          )}
        </button>
      </footer>
    </dialog>
  );
}
