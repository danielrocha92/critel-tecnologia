import type { Metadata } from 'next';
import styles from './Certifications.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import JsonLd, { getBreadcrumbSchema } from '@/components/JsonLd/JsonLd';
import { getDictionary } from '@/dictionaries';
import { Sparkles, Trophy, Award, ArrowRight, MessageSquare, ShieldCheck, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import CertificationsClient from './CertificationsClient';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const certSeo = dict.seo?.certifications;

  const title = certSeo?.title ?? 'Certificações, Normas e Prêmios | Critel Tecnologia';
  const description =
    certSeo?.description ??
    'Conheça as certificações técnicas (Furukawa, Cisco, Fortinet, Fluke, PMP), conformidade com NRs (NR-10, NR-35, NR-18) e prêmios da Critel Tecnologia.';

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolvedParams.lang}/sobre/certificacoes-e-premios`,
      languages: {
        'pt-BR': '/pt/sobre/certificacoes-e-premios',
        'en-US': '/en/sobre/certificacoes-e-premios',
        'es-ES': '/es/sobre/certificacoes-e-premios',
        'x-default': '/pt/sobre/certificacoes-e-premios',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://criteltecnologia.com.br/${resolvedParams.lang}/sobre/certificacoes-e-premios`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function CertificationsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const certPage = dict.certificationsPage;

  const breadcrumbs = [
    { name: dict.nav?.home ?? 'Home', url: `/${resolvedParams.lang}` },
    { name: dict.nav?.about ?? 'Quem Somos', url: `/${resolvedParams.lang}/sobre` },
    {
      name: dict.nav?.certifications ?? 'Certificações e Prêmios',
      url: `/${resolvedParams.lang}/sobre/certificacoes-e-premios`,
    },
  ];

  return (
    <div className={styles.page}>
      <JsonLd data={getBreadcrumbSchema(breadcrumbs)} />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>{certPage.badge}</span>
            </div>
            <h1 className={styles.title}>{certPage.title}</h1>
            <p className={styles.subtitle}>{certPage.subtitle}</p>

            {/* Destaques Numéricos */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>{certPage.stat1_num}</span>
                <span className={styles.statLabel}>{certPage.stat1_label}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>{certPage.stat2_num}</span>
                <span className={styles.statLabel}>{certPage.stat2_label}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>{certPage.stat3_num}</span>
                <span className={styles.statLabel}>{certPage.stat3_label}</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNumber}>{certPage.stat4_num}</span>
                <span className={styles.statLabel}>{certPage.stat4_label}</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Área Interativa de NRs e Certificações Técnicas */}
      <CertificationsClient dict={dict} />

      {/* Prêmios e Reconhecimentos Operacionais */}
      <section className={styles.awardsSection}>
        <div className="container">
          <ScrollReveal animation="fadeInUp">
            <div className={styles.sectionHeader} style={{ textAlign: 'center', margin: '0 auto 2.5rem' }}>
              <div className={styles.badge} style={{ margin: '0 auto 1rem' }}>
                <Trophy size={14} />
                <span>Reconhecimento de Mercado</span>
              </div>
              <h2 className={styles.sectionTitle} style={{ justifyContent: 'center' }}>
                {certPage.awardsSectionTitle}
              </h2>
              <p className={styles.sectionDesc} style={{ margin: '0 auto' }}>
                {certPage.awardsSectionDesc}
              </p>
            </div>

            <div className={styles.awardsGrid}>
              {certPage.awards.map((award: any, index: number) => (
                <div key={index} className={styles.awardCard}>
                  <div className={styles.awardIconWrap}>
                    <Trophy size={26} />
                  </div>
                  <span className={styles.awardCategory}>{award.category}</span>
                  <h3 className={styles.awardTitle}>{award.title}</h3>
                  <p className={styles.awardDesc}>{award.desc}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Seção CTA Final */}
      <section className={styles.ctaSection}>
        <div className="container">
          <ScrollReveal animation="fadeInUp">
            <div className={styles.ctaCard}>
              <h2 className={styles.ctaTitle}>{certPage.ctaTitle}</h2>
              <p className={styles.ctaSubtitle}>{certPage.ctaSubtitle}</p>
              <div className={styles.ctaButtons}>
                <Link href={`/${resolvedParams.lang}/#formulario`} className={styles.primaryBtn}>
                  <MessageSquare size={18} />
                  <span>{certPage.ctaPrimary}</span>
                </Link>
                <Link href={`/${resolvedParams.lang}/solucoes`} className={styles.secondaryBtn}>
                  <span>{certPage.ctaSecondary}</span>
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
