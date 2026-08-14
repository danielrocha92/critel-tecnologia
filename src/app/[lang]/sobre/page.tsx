import styles from './About.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import { getDictionary } from '@/dictionaries';
import { Award, ShieldCheck, Cpu, Users, Target, Eye, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const about = dict.aboutPage;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>{about.badge}</span>
            </div>
            <h1 className={styles.title}>{about.title}</h1>
            <p className={styles.subtitle}>{about.subtitle}</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Trajetória / História */}
      <section className={styles.historySection}>
        <div className={`container ${styles.historyGrid}`}>
          <ScrollReveal animation="fadeInLeft" className={styles.historyContent}>
            <h2 className={styles.sectionTitle}>{about.historyTitle}</h2>
            <p className={styles.historyText}>{about.historyP1}</p>
            <p className={styles.historyText}>{about.historyP2}</p>
            <div className={styles.ctaWrapper}>
              <Link href={`/${resolvedParams.lang}/#formulario`} className={styles.primaryBtn}>
                Fale com um Especialista
              </Link>
            </div>
          </ScrollReveal>
          <ScrollReveal animation="fadeInRight" className={styles.statsCard}>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>30</span>
              <span className={styles.statLabel}>Anos de Atuação no Brasil</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>+1.000</span>
              <span className={styles.statLabel}>Projetos Críticos Concluídos</span>
            </div>
            <div className={styles.statDivider}></div>
            <div className={styles.statBox}>
              <span className={styles.statNumber}>99.8%</span>
              <span className={styles.statLabel}>SLA e Disponibilidade</span>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className={styles.mvvSection}>
        <div className="container">
          <div className={styles.mvvGrid}>
            <ScrollReveal animation="fadeInUp" className={styles.mvvCard}>
              <div className={styles.iconCircle}>
                <Target size={28} />
              </div>
              <h3>{about.missionTitle}</h3>
              <p>{about.missionDesc}</p>
            </ScrollReveal>

            <ScrollReveal animation="fadeInUp" className={styles.mvvCard}>
              <div className={styles.iconCircle}>
                <Eye size={28} />
              </div>
              <h3>{about.visionTitle}</h3>
              <p>{about.visionDesc}</p>
            </ScrollReveal>

            <ScrollReveal animation="fadeInUp" className={styles.mvvCard}>
              <div className={styles.iconCircle}>
                <ShieldCheck size={28} />
              </div>
              <h3>{about.valuesTitle}</h3>
              <ul className={styles.valuesList}>
                {about.values.map((v: string, i: number) => (
                  <li key={i}>✓ {v}</li>
                ))}
              </ul>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
