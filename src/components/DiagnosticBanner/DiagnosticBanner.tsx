import styles from './DiagnosticBanner.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { ShieldAlert, ArrowRight } from 'lucide-react';
import Link from 'next/link';

type DiagnosticBannerCopy = {
  badge: string;
  title: string;
  desc: string;
  ctaPrimary: string;
  point1_title: string;
  point1_desc: string;
  point2_title: string;
  point2_desc: string;
  point3_title: string;
  point3_desc: string;
};

export default function DiagnosticBanner({ dict }: { dict: DiagnosticBannerCopy }) {
  return (
    <section className={styles.diagnosticSection}>
      <div className={`container ${styles.container}`}>
        <ScrollReveal animation="fadeInUp" className={styles.banner}>
          <div className={styles.content}>
            <div className={styles.badge}>
              <ShieldAlert size={18} className={styles.badgeIcon} />
              <span>{dict.badge}</span>
            </div>

            <h3 className={styles.title}>{dict.title}</h3>
            <p className={styles.description}>{dict.desc}</p>

            <div className={styles.actions}>
              <Link href="#contato" className={styles.primaryBtn}>
                <span>{dict.ctaPrimary}</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className={styles.highlightsList}>
            <div className={styles.highlightItem}>
              <div className={styles.checkIcon}>✓</div>
              <div>
                <strong>{dict.point1_title}</strong>
                <p>{dict.point1_desc}</p>
              </div>
            </div>

            <div className={styles.highlightItem}>
              <div className={styles.checkIcon}>✓</div>
              <div>
                <strong>{dict.point2_title}</strong>
                <p>{dict.point2_desc}</p>
              </div>
            </div>

            <div className={styles.highlightItem}>
              <div className={styles.checkIcon}>✓</div>
              <div>
                <strong>{dict.point3_title}</strong>
                <p>{dict.point3_desc}</p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
