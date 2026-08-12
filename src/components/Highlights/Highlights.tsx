import styles from './Highlights.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { Target, Leaf, Briefcase } from 'lucide-react';

export default function Highlights({ dict }: { dict: any }) {
  return (
    <section className={styles.highlights}>
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          <ScrollReveal animation="fadeInUp" delay={0.1} className={styles.card}>
            <div className={styles.iconWrapper}>
              <Target size={32} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>{dict.card1.title}</h3>
            <p className={styles.description}>
              {dict.card1.desc}
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fadeInUp" delay={0.2} className={styles.card}>
            <div className={styles.iconWrapper}>
              <Leaf size={32} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>{dict.card2.title}</h3>
            <p className={styles.description}>
              {dict.card2.desc}
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fadeInUp" delay={0.3} className={styles.card}>
            <div className={styles.iconWrapper}>
              <Briefcase size={32} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>{dict.card3.title}</h3>
            <p className={styles.description}>
              {dict.card3.desc}
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
