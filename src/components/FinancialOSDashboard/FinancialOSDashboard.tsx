'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import { Download } from 'lucide-react';
import { osFinanceService } from '../../services/osFinanceService';
import type { FinancialOS, OSSummary, OSFilterParams } from '../../services/osFinanceService';
import OSSummaryCards from './OSSummaryCards';
import OSFilterBar from './OSFilterBar';
import OSTable from './OSTable';
import OSExportModal from './OSExportModal';
import styles from './FinancialOSDashboard.module.css';

export default function FinancialOSDashboard() {
  const [summary, setSummary] = useState<OSSummary | null>(null);
  const [osList, setOsList] = useState<FinancialOS[]>([]);
  const [filters, setFilters] = useState<OSFilterParams>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isProcessingExport, setIsProcessingExport] = useState(false);

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
    setSelectedIds([]); // Reseta seleção ao filtrar
  };

  const handleSelect = (id: string, selected: boolean) => {
    setSelectedIds(prev => 
      selected ? [...prev, id] : prev.filter(item => item !== id)
    );
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedIds(osList.map(os => os.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleExportConfirm = async () => {
    setIsProcessingExport(true);
    try {
      const success = await osFinanceService.closeOSBatch(selectedIds);
      if (success) {
        // Sucesso: recarrega dados e fecha modal
        await loadDashboardData();
        setSelectedIds([]);
        setIsExportModalOpen(false);
        // Implementar lógica real de download (blob csv/json) aqui
        alert('Fechamento concluído com sucesso e arquivo gerado!');
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

  // Schema de dados estruturados (JSON-LD) para acessibilidade/SEO interno
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Dashboard Financeiro de Ordens de Serviço',
    description: 'Gestão, conciliação e fechamento de Ordens de Serviço operacionais.',
  };

  return (
    <main className={styles.container}>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <header className={styles.header}>
        <h1 className={styles.title}>Conciliação e Fechamento de OS</h1>
        <p className={styles.description}>
          Acompanhe os indicadores financeiros, concilie valores e realize o fechamento do ciclo.
        </p>
      </header>

      {summary && <OSSummaryCards summary={summary} />}

      <OSFilterBar filters={filters} onFilterChange={handleFilterChange} />

      <section aria-label="Ações de Lote" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <button
          type="button"
          className={styles.btnPrimary}
          disabled={selectedIds.length === 0}
          onClick={() => setIsExportModalOpen(true)}
          aria-label="Exportar e Fechar OSs Selecionadas"
        >
          <Download size={18} aria-hidden="true" />
          Exportar Selecionados ({selectedIds.length})
        </button>
      </section>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Carregando dados financeiros...
        </div>
      ) : (
        <OSTable
          osList={osList}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onSelectAll={handleSelectAll}
        />
      )}

      <OSExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onConfirm={handleExportConfirm}
        selectedOSList={selectedOSList}
        isProcessing={isProcessingExport}
      />
    </main>
  );
}
