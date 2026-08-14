import styles from '../privacidade/Legal.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import { getDictionary } from '@/dictionaries';
import { FileText } from 'lucide-react';

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const terms = dict.termsPage;

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <FileText size={14} />
              <span>{terms.badge}</span>
            </div>
            <h1 className={styles.title}>{terms.title}</h1>
            <p className={styles.subtitle}>{terms.subtitle}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={`container ${styles.legalContainer}`}>
          <div className={styles.legalBox}>
            <h2>{terms.section1Title}</h2>
            <p>{terms.section1Text}</p>

            <h2>{terms.section2Title}</h2>
            <p>{terms.section2Text}</p>

            <h2>{terms.section3Title}</h2>
            <p>{terms.section3Text}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
