'use client';

import React from 'react';
import { BookOpen, Video, FileText, Search, PlayCircle } from 'lucide-react';
import styles from './base-conhecimento.module.css';

export default function BaseConhecimentoPage() {
  const modulos = [
    { title: 'Treinamento de Onboarding', type: 'Vídeo', duration: '45 min', icon: Video, colorHex: '#ef4444', colorClass: styles.bgRed },
    { title: 'Manual de Procedimentos PDV', type: 'Documento', duration: '12 pág', icon: FileText, colorHex: '#3b82f6', colorClass: styles.bgBlue },
    { title: 'Como solicitar Cartão Vexpenses', type: 'Guia Rápido', duration: '5 min', icon: BookOpen, colorHex: '#10b981', colorClass: styles.bgGreen },
    { title: 'Troubleshooting de Redes', type: 'Vídeo', duration: '1h 20m', icon: Video, colorHex: '#ef4444', colorClass: styles.bgRed },
    { title: 'Regras de Negócio: Burger King', type: 'Documento', duration: '8 pág', icon: FileText, colorHex: '#3b82f6', colorClass: styles.bgBlue },
    { title: 'Acesso ao Milvus IT Management', type: 'Tutorial', duration: '15 min', icon: PlayCircle, colorHex: '#8b5cf6', colorClass: styles.bgPurple },
  ];

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Base de Conhecimento</h1>
          <p className={styles.subtitle}>Treinamento do sistema, manuais e guias da equipe</p>
        </div>
      </div>

      <div className={styles.searchBarContainer}>
        <div className={styles.searchInputWrapper}>
          <Search size={18} color="#94a3b8" className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Buscar por artigos, tutoriais ou vídeos..." 
            className={styles.searchInput}
          />
        </div>
        <select className={styles.filterSelect}>
          <option>Todas as Categorias</option>
          <option>Treinamentos em Vídeo</option>
          <option>Manuais de Procedimento</option>
          <option>Regras de Franquias</option>
        </select>
      </div>

      <div className={styles.gridContainer}>
        {modulos.map((modulo, i) => (
          <div key={i} className={styles.card}>
            <div className={styles.cardHeader}>
              <div className={`${styles.iconWrapper} ${modulo.colorClass}`}>
                <modulo.icon size={24} color={modulo.colorHex} />
              </div>
              <span className={styles.durationBadge}>
                {modulo.duration}
              </span>
            </div>
            
            <div>
              <h3 className={styles.cardTitle}>{modulo.title}</h3>
              <span className={styles.cardType}>Tipo: {modulo.type}</span>
            </div>

            <div className={styles.cardFooter}>
              <button className={styles.btnAccess}>
                Acessar Conteúdo &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
