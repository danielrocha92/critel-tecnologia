"use client";

import styles from './SocialProof.module.css';

export default function SocialProof() {
  const partners = [
    { name: 'Bradesco', desc: 'Infraestrutura corporativa e suporte.', logoSrc: '/bradesco.sgv.svg' },
    { name: 'Bacio di Latte', desc: 'Aberturas de loja, service desk e Field Services.', logoSrc: '/Bacio-di-latte.sgv.svg' },
    { name: 'Ofner', desc: 'Suporte especializado em infraestrutura.', logoSrc: '/ofner.png' },
    { name: 'Engemon', desc: 'Infraestrutura de rede e Field Services nos clientes da Engemon.', logoSrc: '/engemon.svg' },
    { name: 'Sonda IT', desc: 'Infraestrutura de rede e Field Services.', logoSrc: '/sonda.jpg' },
    { name: 'Connectcom', desc: 'Infraestrutura de rede e Field Services.', logoSrc: null },
    { name: 'Tecnocomp', desc: 'Infraestrutura de rede e Field Services.', logoSrc: null },
    { name: 'Pizza Hut', desc: 'Montagem de novas lojas (Grupo IMC).', logoSrc: '/pizza-hut.svg' },
    { name: 'KFC', desc: 'Montagem de novas lojas (Grupo IMC).', logoSrc: '/kfc.svg' }
  ];
  
  return (
    <div className={styles.socialProof} id="clientes">
      <div className={`container ${styles.container}`}>
        <p className={styles.label}>Nossos Clientes e Parceiros</p>
        <div className={styles.logos}>
          {partners.map((partner, index) => (
            <div key={index} className={styles.logoItem} title={partner.desc}>
              {partner.logoSrc ? (
                <img 
                  src={partner.logoSrc} 
                  alt={partner.name} 
                  className={styles.logoImage} 
                />
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
