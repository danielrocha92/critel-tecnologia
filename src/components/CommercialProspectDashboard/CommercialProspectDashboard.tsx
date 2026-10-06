'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Plus, Building2, Phone, Mail, Clock, MoreHorizontal } from 'lucide-react';
import { prospectService } from '../../services/prospectService';
import type { Prospect, ProspectStatus } from '../../services/prospectService';
import styles from './CommercialProspectDashboard.module.css';

const COLUMNS: { id: ProspectStatus; title: string; color: string }[] = [
  { id: 'LEAD', title: 'Leads Novos', color: '#3b82f6' },
  { id: 'CONTATO', title: 'Em Contato', color: '#8b5cf6' },
  { id: 'NEGOCIACAO', title: 'Em Negociação', color: '#f59e0b' },
  { id: 'PROPOSTA', title: 'Proposta Enviada', color: '#ec4899' },
  { id: 'FECHADO', title: 'Negócio Fechado', color: '#10b981' },
  { id: 'PERDIDO', title: 'Perdido', color: '#ef4444' },
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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Painel Comercial e CRM',
    description: 'Gestão de leads e funil de prospecção comercial.',
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
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          Carregando funil comercial...
        </div>
      ) : (
        <section className={styles.kanbanBoard} aria-label="Quadro Kanban de Prospecção">
          {COLUMNS.map(col => {
            const columnProspects = prospects.filter(p => p.status === col.id);
            
            return (
              <div key={col.id} className={styles.column} aria-labelledby={`col-${col.id}`}>
                <div className={styles.columnHeader} style={{ borderTop: `4px solid ${col.color}` }}>
                  <h2 id={`col-${col.id}`} className={styles.columnTitle}>
                    {col.title}
                    <span className={styles.columnCount}>{columnProspects.length}</span>
                  </h2>
                  <button type="button" aria-label="Opções da coluna" style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
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
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
