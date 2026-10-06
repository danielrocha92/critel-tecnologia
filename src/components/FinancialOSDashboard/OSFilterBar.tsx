import React from 'react';
import { Search, Filter } from 'lucide-react';
import type { OSFilterParams } from '../../services/osFinanceService';
import styles from './FinancialOSDashboard.module.css';

interface OSFilterBarProps {
  filters: OSFilterParams;
  onFilterChange: (filters: OSFilterParams) => void;
}

export default function OSFilterBar({ filters, onFilterChange }: OSFilterBarProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    onFilterChange({ ...filters, [name]: value });
  };

  return (
    <section className={styles.filterSection} aria-label="Barra de Filtros">
      <div className={styles.filterGroup}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-secondary)' }} aria-hidden="true" />
          <input
            type="search"
            name="searchQuery"
            value={filters.searchQuery || ''}
            onChange={handleChange}
            placeholder="Buscar por Nº OS, Cliente ou CNPJ..."
            className={styles.searchInput}
            aria-label="Buscar Ordens de Serviço"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <input
          type="date"
          name="startDate"
          value={filters.startDate || ''}
          onChange={handleChange}
          className={styles.dateInput}
          aria-label="Data Inicial"
        />
        <span style={{ color: 'var(--text-secondary)' }}>até</span>
        <input
          type="date"
          name="endDate"
          value={filters.endDate || ''}
          onChange={handleChange}
          className={styles.dateInput}
          aria-label="Data Final"
        />

        <select
          name="financialStatus"
          value={filters.financialStatus || ''}
          onChange={handleChange}
          className={styles.selectInput}
          aria-label="Filtrar por Status Financeiro"
        >
          <option value="">Todos os Status</option>
          <option value="PENDENTE">Pendente</option>
          <option value="CONCILIADO">Conciliado</option>
          <option value="DIVERGENTE">Divergente</option>
          <option value="FATURADO">Faturado</option>
          <option value="GLOSADO">Glosado</option>
        </select>
      </div>

      <div>
        <button type="button" className={styles.btnSecondary}>
          <Filter size={16} aria-hidden="true" />
          Filtros Avançados
        </button>
      </div>
    </section>
  );
}
