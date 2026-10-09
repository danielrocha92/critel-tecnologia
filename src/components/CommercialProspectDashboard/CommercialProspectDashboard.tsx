'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Building2, Phone, Mail, Clock, MoreHorizontal } from 'lucide-react';
import { prospectService } from '../../services/prospectService';
import type { Prospect, ProspectStatus } from '../../services/prospectService';
import styles from './CommercialProspectDashboard.module.css';

const COLUMNS: { id: ProspectStatus; title: string; className: string }[] = [
  { id: 'LEAD', title: 'Leads Novos', className: 'columnHeaderLead' },
  { id: 'CONTATO', title: 'Em Contato', className: 'columnHeaderContact' },
  { id: 'NEGOCIACAO', title: 'Em Negociação', className: 'columnHeaderNegotiation' },
  { id: 'PROPOSTA', title: 'Proposta Enviada', className: 'columnHeaderProposal' },
  { id: 'FECHADO', title: 'Negócio Fechado', className: 'columnHeaderWon' },
  { id: 'PERDIDO', title: 'Perdido', className: 'columnHeaderLost' },
];

export default function CommercialProspectDashboard() {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProspects();
  }, []);

  const loadProspects = async () => {
    setIsLoading(true);
    try {
      const data = await prospectService.listProspects();
      setProspects(data);
    } catch (error) {
      console.error('Erro ao carregar prospectos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const timeAgo = (dateStr: string) => {
    const diffDays = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    return `Há ${diffDays} dias`;
  };

  return (
    <main className={styles.container}>

      <header className={styles.header}>
        <div className={styles.titleGroup}>
          <h1 className={styles.title}>Funil de Prospecção</h1>
          <p className={styles.description}>
            Gerencie o relacionamento com leads, acompanhe negociações e propostas comerciais.
          </p>
        </div>
        <button type="button" className={`${styles.btn} ${styles.btnPrimary}`}>
          <Plus size={18} />
          Novo Prospecto
        </button>
      </header>

      {isLoading ? (
        <div className={styles.loadingState}>
          Carregando funil comercial...
        </div>
      ) : (
        <section className={styles.kanbanBoard} aria-label="Quadro Kanban de Prospecção">
          {COLUMNS.map(col => {
            const columnProspects = prospects.filter(p => p.status === col.id);
            
            return (
              <div key={col.id} className={styles.column} aria-labelledby={`col-${col.id}`}>
                <div className={`${styles.columnHeader} ${styles[col.className]}`}>
                  <h2 id={`col-${col.id}`} className={styles.columnTitle}>
                    {col.title}
                    <span className={styles.columnCount}>{columnProspects.length}</span>
                  </h2>
                  <button type="button" className={styles.columnOptions} aria-label="Opções da coluna">
                    <MoreHorizontal size={18} />
                  </button>
                </div>
                
                <div className={styles.columnBody}>
                  {columnProspects.length === 0 ? (
                    <div className={styles.emptyState}>Nenhum lead nesta etapa</div>
                  ) : (
                    columnProspects.map(prospect => (
                      <article key={prospect.id} className={styles.card} tabIndex={0} aria-label={`Prospecto: ${prospect.name}`}>
                        <header className={styles.cardHeader}>
                          <div>
                            <h3 className={styles.prospectName}>{prospect.name}</h3>
                            <p className={styles.prospectCompany}>
                              <Building2 size={12} /> {prospect.company}
                            </p>
                          </div>
                          <span className={styles.prospectValue}>
                            {formatCurrency(prospect.value)}
                          </span>
                        </header>
                        
                        <div className={styles.cardBody}>
                          <div className={styles.contactInfo}>
                            <Phone size={12} /> {prospect.phone}
                          </div>
                          <div className={styles.contactInfo}>
                            <Mail size={12} /> {prospect.email}
                          </div>
                        </div>

                        <footer className={styles.cardFooter}>
                          <div className={styles.lastContact}>
                            <Clock size={12} /> Último contato: {timeAgo(prospect.lastContact)}
                          </div>
                        </footer>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
