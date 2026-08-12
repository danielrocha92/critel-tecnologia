import styles from './Institutional.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function Institutional({ dict }: { dict: any }) {
  return (
    <section className={styles.institutional} id="empresa">
      <ScrollReveal animation="fadeInLeft" className={styles.imageHalf}>
      </ScrollReveal>
      <ScrollReveal animation="fadeInRight" className={styles.textHalf}>
        <h2 className={styles.title}>{dict.title}</h2>
        <p className={styles.subtitle}>{dict.subtitle}</p>
        <p className={styles.description}>
          <strong>{dict.desc1}</strong>
        </p>
        <p className={styles.description}>
          {dict.desc2}
        </p>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{dict.stat1_num}</span>
            <span className={styles.statLabel}>{dict.stat1_label}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{dict.stat2_num}</span>
            <span className={styles.statLabel}>{dict.stat2_label}</span>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
