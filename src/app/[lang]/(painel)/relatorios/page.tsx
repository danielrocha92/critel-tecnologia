'use client';

import React from 'react';
import { BarChart3, TrendingUp, Users, Clock, CalendarDays, Activity } from 'lucide-react';
import styles from './relatorios.module.css';

export default function RelatoriosPage() {
  const kpis = [
    { title: 'Chamados no Mês', value: '1,248', trend: '+12%', colorClass: styles.kpiBgBlue, colorHex: '#3b82f6', icon: Activity },
    { title: 'Tempo Médio de Resposta', value: '15 min', trend: '-2 min', colorClass: styles.kpiBgGreen, colorHex: '#10b981', icon: Clock },
    { title: 'Ordens de Serviço (Campo)', value: '142', trend: '+5%', colorClass: styles.kpiBgOrange, colorHex: '#f59e0b', icon: Users },
    { title: 'Taxa de SLA Cumprido', value: '98.5%', trend: '+0.5%', colorClass: styles.kpiBgPurple, colorHex: '#8b5cf6', icon: TrendingUp },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Acompanhamento CRM</h1>
          <p className={styles.subtitle}>Métricas, performance da equipe e saúde dos clientes</p>
        </div>
        <div className={styles.actions}>
          <button className={styles.btnDate}>
            <CalendarDays size={18} /> Últimos 30 Dias
          </button>
          <button className={styles.btnExport}>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.kpiGrid}>
        {kpis.map((kpi, i) => (
          <div key={i} className={styles.kpiCard}>
            <div className={styles.kpiHeader}>
              <span className={styles.kpiTitle}>{kpi.title}</span>
              <div 
                className={`${styles.kpiIconWrapper} ${kpi.colorClass}`} 
              >
                <kpi.icon size={20} color={kpi.colorHex} />
              </div>
            </div>
            <div className={styles.kpiValues}>
              <span className={styles.kpiValue}>{kpi.value}</span>
              <span 
                className={`${styles.kpiTrend} ${kpi.trend.startsWith('+') ? styles.trendUp : kpi.trend.startsWith('-') ? styles.trendUp : styles.trendDown}`} 
              >
                {kpi.trend}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Gráficos Mockados */}
      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Volume de Chamados por Cliente</h3>
          <div className={styles.barChartArea}>
            {/* Barras Mockadas */}
            {[
              { label: 'Bacio', height: '80%', colorClass: styles.bgBlue },
              { label: 'Burger K.', height: '60%', colorClass: styles.bgBlueLight },
              { label: 'Ofner', height: '40%', colorClass: styles.bgBlueLighter },
              { label: 'KFC', height: '50%', colorClass: styles.bgBlueLightest },
            ].map((bar, i) => (
              <div key={i} className={styles.barColumn}>
                <div className={`${styles.bar} ${bar.colorClass}`} style={{ height: bar.height }} />
                <span className={styles.barLabel}>{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Categorias Mais Frequentes</h3>
          <div className={styles.categoryList}>
            <div className={styles.categoryItem}>
              <div className={`${styles.categoryDot} ${styles.bgBlue}`} />
              <div className={styles.categoryName}>Hardware / PDV</div>
              <div className={styles.categoryPercent}>45%</div>
            </div>
            <div className={styles.categoryItem}>
              <div className={`${styles.categoryDot} ${styles.bgGreen}`} />
              <div className={styles.categoryName}>Redes e Conectividade</div>
              <div className={styles.categoryPercent}>30%</div>
            </div>
            <div className={styles.categoryItem}>
              <div className={`${styles.categoryDot} ${styles.bgOrange}`} />
              <div className={styles.categoryName}>Cartão Vexpenses</div>
              <div className={styles.categoryPercent}>15%</div>
            </div>
            <div className={styles.categoryItem}>
              <div className={`${styles.categoryDot} ${styles.bgPurple}`} />
              <div className={styles.categoryName}>Outros</div>
              <div className={styles.categoryPercent}>10%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
