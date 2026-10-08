'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import { osFinanceService } from '../../services/osFinanceService';
import type { FinancialOS, OSSummary, OSFilterParams, OSPricing } from '../../services/osFinanceService';
import OSSummaryCards, { type OSSummaryFilter } from './OSSummaryCards';
import OSFilterBar from './OSFilterBar';
import OSTable from './OSTable';
import OSExportModal from './OSExportModal';
import OSPricingModal from './OSPricingModal';
import styles from './FinancialOSDashboard.module.css';

export default function FinancialOSDashboard() {
  const [summary, setSummary] = useState<OSSummary | null>(null);
  const [osList, setOsList] = useState<FinancialOS[]>([]);
  const [filters, setFilters] = useState<OSFilterParams>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedSummaryFilter, setSelectedSummaryFilter] = useState<OSSummaryFilter | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProcessingExport, setIsProcessingExport] = useState(false);
  const [pricingOS, setPricingOS] = useState<FinancialOS | null>(null);
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  useEffect(() => {
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [summaryData, listData] = await Promise.all([
        osFinanceService.getSummary(filters),
        osFinanceService.listOS(filters)
      ]);
      setSummary(summaryData);
      setOsList(listData);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard financeiro:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: OSFilterParams) => {
    setFilters(newFilters);
    setSelectedSummaryFilter(null);
    setSelectedIds([]); // Reseta seleção ao filtrar
  };

  const handleSummaryFilter = (filter: OSSummaryFilter) => {
    setSelectedSummaryFilter((current) => current === filter ? null : filter);
    setFilters((current) => current.financialStatus ? { ...current, financialStatus: undefined } : current);
    setSelectedIds([]);
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => 
      selected ? [...prev, id] : prev.filter(item => item !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(osList.filter((os) => os.financialStatus === 'CONCILIADO').map(os => os.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handlePricingSave = async (pricing: OSPricing) => {
    if (!pricingOS) return;
    setIsSavingPricing(true);
    try {
      await osFinanceService.savePricing(pricingOS.id, pricing);
      await loadDashboardData();
      setPricingOS(null);
    } finally {
      setIsSavingPricing(false);
    }
  };

  const downloadClosingCsv = () => {
    const columns = ['OS', 'Cliente', 'Técnico', 'Mão de obra', 'Outros custos', 'Impostos', 'Total faturável', 'Status'];
    const escapeCsv = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const rows = selectedOSList.map((os) => [
      os.osNumber,
      os.clientName,
      os.technicianName,
      os.laborValue.toFixed(2),
      os.partsValue.toFixed(2),
      os.taxValue.toFixed(2),
      os.finalPrice.toFixed(2),
      'FATURADO',
    ]);
    const csv = [columns, ...rows].map((row) => row.map(escapeCsv).join(';')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `fechamento-financeiro-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleExportConfirm = async () => {
    setIsProcessingExport(true);
    try {
      const success = await osFinanceService.closeOSBatch(selectedIds);
      if (success) {
        downloadClosingCsv();
        // Sucesso: recarrega dados e fecha modal
        await loadDashboardData();
        setSelectedIds([]);
        setIsExportModalOpen(false);
        alert('Fechamento concluído e arquivo CSV gerado.');
      } else {
        alert('Não foi possível fechar todas as OS selecionadas. Concilie os valores e tente novamente.');
      }
    } catch (error) {
      console.error('Erro no fechamento:', error);
      alert('Ocorreu um erro ao processar o fechamento.');
    } finally {
      setIsProcessingExport(false);
    }
  };

  const selectedOSList = useMemo(() => {
    return osList.filter(os => selectedIds.includes(os.id));
  }, [osList, selectedIds]);

  const visibleOSList = useMemo(() => {
    if (!selectedSummaryFilter) return osList;
    return osList.filter((os) => {
      if (selectedSummaryFilter === 'totalBillable') return os.financialStatus === 'FATURADO';
      if (selectedSummaryFilter === 'pendingValidation') return os.financialStatus === 'PENDENTE';
      if (selectedSummaryFilter === 'inConflict') return os.financialStatus === 'DIVERGENTE' || os.financialStatus === 'GLOSADO';
      return os.financialStatus === 'CONCILIADO';
    });
  }, [osList, selectedSummaryFilter]);

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Conciliação e Fechamento de OS</h1>
        <p className={styles.description}>
          Acompanhe os indicadores financeiros, concilie valores e realize o fechamento do ciclo.
        </p>
      </header>

      {summary && (
        <OSSummaryCards
          summary={summary}
          selectedFilter={selectedSummaryFilter}
          onSelectFilter={handleSummaryFilter}
        />
      )}

      <OSFilterBar filters={filters} onFilterChange={handleFilterChange} />

      <section aria-label="Ações de lote" className={styles.batchActions}>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={selectedIds.length === 0}
          onClick={() => setIsExportModalOpen(true)}
          aria-label="Exportar e fechar OSs conciliadas"
        >
          <Download size={18} aria-hidden="true" />
          Fechar conciliadas ({selectedIds.length})
        </button>
      </section>

      {isLoading ? (
        <div className={styles.loadingState} role="status" aria-live="polite">
          Carregando dados financeiros...
        </div>
      ) : (
        <OSTable
          osList={visibleOSList}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
          onReconcile={setPricingOS}
        />
      )}

      <OSExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExportConfirm}
        selectedOSList={selectedOSList}
        isProcessing={isProcessingExport}
      />
      {pricingOS && (
        <OSPricingModal
          key={pricingOS.id}
          os={pricingOS}
          isSaving={isSavingPricing}
          onClose={() => setPricingOS(null)}
          onSave={handlePricingSave}
        />
      )}
    </main>
  );
}
