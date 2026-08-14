"use client";

import styles from './SocialProof.module.css';

export default function SocialProof({ dict }: { dict: any }) {
  const partners = [
    { name: 'Bradesco', desc: 'Infraestrutura corporativa e suporte.', logoSrc: '/bradesco.svg' },
    { name: 'Bacio di Latte', desc: 'Aberturas de loja, service desk e Field Services.', logoSrc: '/bacio-di-latte.svg' },
    { name: 'Ofner', desc: 'Suporte especializado em infraestrutura.', logoSrc: '/ofner.png' },
    { name: 'Engemon', desc: 'Infraestrutura de rede e Field Services nos clientes da Engemon.', logoSrc: '/engemon.svg' },
    { name: 'Sonda IT', desc: 'Infraestrutura de rede e Field Services.', logoSrc: '/sonda.svg' },
    { name: 'Connectcom', desc: 'Infraestrutura de rede e Field Services.', logoSrc: '/connectcom.svg' },
    { name: 'Tecnocomp', desc: 'Infraestrutura de rede e Field Services.', logoSrc: '/tecnocomp.svg' },
    { name: 'Pizza Hut', desc: 'Montagem de novas lojas (Grupo IMC).', logoSrc: '/pizza-hut.svg' },
    { name: 'KFC', desc: 'Montagem de novas lojas (Grupo IMC).', logoSrc: '/kfc.svg' }
  ];
  
  return (
    <div className={styles.socialProof} id="clientes">
      <div className={`container ${styles.container}`}>
        <div className={styles.labelWrapper}>
          <span className={styles.labelDot}></span>
          <p className={styles.label}>{dict.label}</p>
        </div>
      </div>

      <div className={styles.carouselContainer}>
        <div className={styles.carouselTrack}>
          {/* Primeira Tropa de Logos */}
          {partners.map((partner, index) => (
            <div key={`set1-${index}`} className={styles.logoItem} title={partner.desc}>
              {partner.logoSrc ? (
                <img src={partner.logoSrc} alt={partner.name} className={styles.logoImage} />
              ) : (
                <span>{partner.name}</span>
              )}
            </div>
          ))}
          {/* Segunda Tropa para Ilusão de Scroll Infinito */}
          {partners.map((partner, index) => (
            <div key={`set2-${index}`} className={styles.logoItem} aria-hidden="true" title={partner.desc}>
              {partner.logoSrc ? (
                <img src={partner.logoSrc} alt={partner.name} className={styles.logoImage} />
              ) : (
                <span>{partner.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
