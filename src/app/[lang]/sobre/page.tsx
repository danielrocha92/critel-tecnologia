import type { Metadata } from 'next';
import Image from 'next/image';
import styles from './About.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import JsonLd, { getBreadcrumbSchema } from '@/components/JsonLd/JsonLd';
import { getDictionary } from '@/dictionaries';
import { ShieldCheck, Target, Eye, Sparkles, Building2 } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const aboutSeo = dict.seo?.about;

  const title = aboutSeo?.title ?? 'Quem Somos | 30 Anos de Excelência em TI';
  const description =
    aboutSeo?.description ??
    'Conheça a história de 30 anos da Critel Tecnologia: transformando infraestrutura e segurança em vantagens competitivas para grandes empresas.';

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolvedParams.lang}/sobre`,
      languages: {
        'pt-BR': '/pt/sobre',
        'en-US': '/en/sobre',
        'es-ES': '/es/sobre',
        'x-default': '/pt/sobre',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://criteltecnologia.com.br/${resolvedParams.lang}/sobre`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function AboutPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const about = dict.aboutPage;

  const breadcrumbs = [
    { name: dict.nav?.home ?? 'Home', url: `/${resolvedParams.lang}` },
    { name: dict.nav?.about ?? 'Quem Somos', url: `/${resolvedParams.lang}/sobre` },
  ];

  return (
    <div className={styles.page}>
      <JsonLd data={getBreadcrumbSchema(breadcrumbs)} />

      {/* Hero */}
      <section className={styles.hero}>
        <Image 
          src="/images/banners/about_hero.jpg"
          alt={about.title}
          fill
          priority
          quality={80}
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={`container ${styles.heroContainer}`}>
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <Building2 size={14} />
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
