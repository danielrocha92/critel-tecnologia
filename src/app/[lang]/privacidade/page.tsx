import styles from './Legal.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import { getDictionary } from '@/dictionaries';
import { Shield, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const legal = dict.privacyPage;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <Shield size={14} />
              <span>{legal.badge}</span>
            </div>
            <h1 className={styles.title}>{legal.title}</h1>
            <p className={styles.subtitle}>{legal.subtitle}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={`container ${styles.legalContainer}`}>
          <div className={styles.legalBox}>
            <h2>{legal.section1Title}</h2>
            <p>{legal.section1Text}</p>

            <h2>{legal.section2Title}</h2>
            <p>{legal.section2Text}</p>

            <h2>{legal.section3Title}</h2>
            <p>{legal.section3Text}</p>

            <h2>{legal.section4Title}</h2>
            <p>{legal.section4Text}</p>

            <div className={styles.dpoBox}>
              <h3>Canal de Privacidade e DPO</h3>
              <p>Para dúvidas ou solicitações referentes à LGPD:</p>
              <a href="mailto:comercial@criteltecnologia.com.br" className={styles.contactBtn}>
                comercial@criteltecnologia.com.br
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
