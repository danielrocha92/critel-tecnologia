import styles from './DiagnosticBanner.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { ShieldAlert, ArrowRight, MessageSquareCheck } from 'lucide-react';
import Link from 'next/link';

export default function DiagnosticBanner({ dict }: { dict: any }) {
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
              <a
                href="https://wa.me/5511996839480?text=Ol%C3%A1!%20Gostaria%20de%20solicitar%20um%20diagn%C3%B3stico%20gratuito%20de%20TI."
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryBtn}
              >
                <MessageSquareCheck size={18} />
                <span>{dict.ctaSecondary}</span>
              </a>
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
