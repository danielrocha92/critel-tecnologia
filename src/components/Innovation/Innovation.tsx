import styles from './Innovation.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function Innovation({ dict }: { dict: any }) {
  return (
    <section className={styles.innovation} id="dashboard">
      <div className={`container ${styles.container}`}>
        <ScrollReveal animation="fadeInLeft" className={styles.content}>
          <h2 className={styles.title}>{dict.title}</h2>
          <p className={styles.description}>
            {dict.desc}
          </p>
          <ul className={styles.features}>
            <li><strong>{dict.p1_title}</strong> {dict.p1_desc}</li>
            <li><strong>{dict.p2_title}</strong> {dict.p2_desc}</li>
            <li><strong>{dict.p3_title}</strong> {dict.p3_desc}</li>
            <li><strong>{dict.p4_title}</strong> {dict.p4_desc}</li>
            <li><strong>{dict.p5_title}</strong> {dict.p5_desc}</li>
          </ul>
        </ScrollReveal>
        <ScrollReveal animation="fadeInRight" className={styles.mockup}>
          {/* Decorative dashboard representation */}
          <div className={styles.screen}>
            <div className={styles.screenHeader}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
            <div className={styles.dashboardGrid}>
              <div className={styles.dashCard}>
                <h4>{dict.dash1}</h4>
                <div className={styles.statusOn}>5/5</div>
              </div>
              <div className={styles.dashCard}>
                <h4>{dict.dash2}</h4>
                <div className={styles.statValue}>100%</div>
              </div>
              <div className={styles.dashCardLarge}>
                <h4>{dict.dash3}</h4>
                <div className={styles.chart}></div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
