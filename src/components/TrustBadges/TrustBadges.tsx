import styles from './TrustBadges.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { ShieldCheck, Clock, Award, FileCheck2 } from 'lucide-react';

export default function TrustBadges({ dict }: { dict: any }) {
  const badges = [
    {
      icon: <Award size={28} className={styles.icon} />,
      title: dict.badge1_title,
      subtitle: dict.badge1_sub
    },
    {
      icon: <Clock size={28} className={styles.icon} />,
      title: dict.badge2_title,
      subtitle: dict.badge2_sub
    },
    {
      icon: <FileCheck2 size={28} className={styles.icon} />,
      title: dict.badge3_title,
      subtitle: dict.badge3_sub
    },
    {
      icon: <ShieldCheck size={28} className={styles.icon} />,
      title: dict.badge4_title,
      subtitle: dict.badge4_sub
    }
  ];

  return (
    <section className={styles.trustBadges}>
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          {badges.map((badge, idx) => (
            <ScrollReveal 
              key={idx} 
              animation="fadeInUp" 
              delay={0.1 * (idx + 1)} 
              className={styles.badgeCard}
            >
              <div className={styles.iconWrapper}>
                {badge.icon}
              </div>
              <div className={styles.content}>
                <h4 className={styles.title}>{badge.title}</h4>
                <p className={styles.subtitle}>{badge.subtitle}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
