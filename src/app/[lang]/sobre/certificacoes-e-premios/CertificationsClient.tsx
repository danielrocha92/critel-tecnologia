'use client';

import { useState } from 'react';
import styles from './Certifications.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import {
  ShieldCheck,
  HardHat,
  Zap,
  Building2,
  Flame,
  Maximize2,
  ArrowUpRight,
  CheckCircle2,
  Network,
  Wifi,
  Lock,
  Camera,
  FileText,
  Sparkles,
  Award,
  Layers,
} from 'lucide-react';

interface NRItem {
  code: string;
  name: string;
  title: string;
  desc: string;
}

interface CertItem {
  category: string;
  categoryLabel: string;
  title: string;
  issuer: string;
  desc: string;
  highlight: string;
}

interface CertificationsClientProps {
  dict: any;
}

export default function CertificationsClient({ dict }: CertificationsClientProps) {
  const [activeTab, setActiveTab] = useState<string>('all');
  const certData = dict.certificationsPage;
  const nrsList: NRItem[] = certData.nrs || [];
  const certsList: CertItem[] = certData.certifications || [];

  const getNrIcon = (code: string) => {
    switch (code) {
      case 'NR-05':
        return <ShieldCheck size={22} />;
      case 'NR-06':
        return <HardHat size={22} />;
      case 'NR-10':
        return <Zap size={22} />;
      case 'NR-18':
        return <Building2 size={22} />;
      case 'NR-20':
        return <Flame size={22} />;
      case 'NR-33':
        return <Layers size={22} />;
      case 'NR-35':
        return <ArrowUpRight size={22} />;
      default:
        return <ShieldCheck size={22} />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cabling':
        return <Network size={16} />;
      case 'network':
        return <Wifi size={16} />;
      case 'governance':
        return <FileText size={16} />;
      case 'building':
        return <Camera size={16} />;
      default:
        return <Award size={16} />;
    }
  };

  const showNrs = activeTab === 'all' || activeTab === 'nrs';

  const filteredCerts = certsList.filter((cert) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'nrs') return false;
    return cert.category === activeTab;
  });

  return (
    <section className={styles.contentSection}>
      <div className="container">
        {/* Filtros em Abas Interativas */}
        <div className={styles.filterTabsWrapper} role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'all'}
            className={`${styles.filterTab} ${activeTab === 'all' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <Sparkles size={15} />
            <span>{certData.filters.all}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'nrs'}
            className={`${styles.filterTab} ${activeTab === 'nrs' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab('nrs')}
          >
            <HardHat size={15} />
            <span>{certData.filters.nrs}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'cabling'}
            className={`${styles.filterTab} ${activeTab === 'cabling' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab('cabling')}
          >
            <Network size={15} />
            <span>{certData.filters.cabling}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'network'}
            className={`${styles.filterTab} ${activeTab === 'network' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab('network')}
          >
            <Wifi size={15} />
            <span>{certData.filters.network}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'governance'}
            className={`${styles.filterTab} ${activeTab === 'governance' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab('governance')}
          >
            <FileText size={15} />
            <span>{certData.filters.governance}</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'building'}
            className={`${styles.filterTab} ${activeTab === 'building' ? styles.filterTabActive : ''}`}
            onClick={() => setActiveTab('building')}
          >
            <Camera size={15} />
            <span>{certData.filters.building}</span>
          </button>
        </div>

        {/* Bloco 1: Normas Regulamentadoras (NRs) */}
        {showNrs && (
          <ScrollReveal animation="fadeInUp">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <HardHat className={styles.sectionTitleIcon} size={28} />
                <span>{certData.nrsSectionTitle}</span>
              </h2>
              <p className={styles.sectionDesc}>{certData.nrsSectionDesc}</p>
            </div>

            <div className={styles.nrsGrid}>
              {nrsList.map((nr, index) => (
                <div key={index} className={styles.nrCard}>
                  <div className={styles.nrCardHeader}>
                    <span className={styles.nrCodeBadge}>{nr.code}</span>
                    <div className={styles.nrIconCircle}>{getNrIcon(nr.code)}</div>
                  </div>
                  <h3 className={styles.nrTitle}>{nr.title}</h3>
                  <p className={styles.nrDesc}>{nr.desc}</p>
                  <div className={styles.nrFooter}>
                    <CheckCircle2 size={15} className={styles.nrCheckIcon} />
                    <span>Equipe 100% Capacitada &amp; Ativa</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}

        {/* Bloco 2: Certificações Técnicas de Fabricantes e Engenharia */}
        {filteredCerts.length > 0 && (
          <ScrollReveal animation="fadeInUp">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <Award className={styles.sectionTitleIcon} size={28} />
                <span>{certData.techSectionTitle}</span>
              </h2>
              <p className={styles.sectionDesc}>{certData.techSectionDesc}</p>
            </div>

            <div className={styles.certGrid}>
              {filteredCerts.map((cert, index) => (
                <div key={index} className={styles.certCard}>
                  <div className={styles.certTop}>
                    <span className={styles.categoryTag}>
                      {getCategoryIcon(cert.category)}
                      <span>{cert.categoryLabel}</span>
                    </span>
                    <span className={styles.certIssuer}>{cert.issuer}</span>
                  </div>
                  <h3 className={styles.certTitle}>{cert.title}</h3>
                  <p className={styles.certDesc}>{cert.desc}</p>
                  <div className={styles.certHighlight}>
                    <Sparkles size={14} className={styles.certHighlightIcon} />
                    <span>{cert.highlight}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
