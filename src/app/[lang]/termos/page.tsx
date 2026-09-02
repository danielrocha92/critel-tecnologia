import type { Metadata } from 'next';
import styles from '../privacidade/Legal.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import JsonLd, { getBreadcrumbSchema } from '@/components/JsonLd/JsonLd';
import { getDictionary } from '@/dictionaries';
import { FileText } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const termsSeo = dict.seo?.terms;

  const title = termsSeo?.title ?? 'Termos de Uso do Website | Critel Tecnologia';
  const description =
    termsSeo?.description ??
    'Diretrizes, responsabilidades e condições gerais de uso do portal da Critel Tecnologia.';

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolvedParams.lang}/termos`,
      languages: {
        'pt-BR': '/pt/termos',
        'en-US': '/en/termos',
        'es-ES': '/es/termos',
        'x-default': '/pt/termos',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://criteltecnologia.com.br/${resolvedParams.lang}/termos`,
    },
    twitter: {
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

import Image from 'next/image';

export default async function TermsPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const terms = dict.termsPage;

  const breadcrumbs = [
    { name: dict.nav?.home ?? 'Home', url: `/${resolvedParams.lang}` },
    { name: dict.footer?.institutional?.terms ?? 'Termos de Uso', url: `/${resolvedParams.lang}/termos` },
  ];

  return (
    <div className={styles.page}>
      <JsonLd data={getBreadcrumbSchema(breadcrumbs)} />

      <section className={styles.hero}>
        <Image 
          src="/images/banners/terms_hero.jpg"
          alt={terms.title}
          fill
          priority
          quality={80}
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
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
