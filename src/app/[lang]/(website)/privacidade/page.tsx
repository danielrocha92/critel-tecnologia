import type { Metadata } from 'next';
import styles from './Legal.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import JsonLd, { getBreadcrumbSchema } from '@/components/JsonLd/JsonLd';
import { getDictionary } from '@/dictionaries';
import { Shield } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const privacySeo = dict.seo?.privacy;

  const title = privacySeo?.title ?? 'Política de Privacidade e Proteção de Dados (LGPD)';
  const description =
    privacySeo?.description ??
    'Saiba como a Critel Tecnologia trata e protege os dados pessoais em conformidade com a LGPD (Lei nº 13.709/2018).';

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolvedParams.lang}/privacidade`,
      languages: {
        'pt-BR': '/pt/privacidade',
        'en-US': '/en/privacidade',
        'es-ES': '/es/privacidade',
        'x-default': '/pt/privacidade',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://criteltecnologia.com.br/${resolvedParams.lang}/privacidade`,
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

export default async function PrivacyPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const legal = dict.privacyPage;

  const breadcrumbs = [
    { name: dict.nav?.home ?? 'Home', url: `/${resolvedParams.lang}` },
    { name: dict.footer?.institutional?.privacy ?? 'Privacidade', url: `/${resolvedParams.lang}/privacidade` },
  ];

  return (
    <div className={styles.page}>
      <JsonLd data={getBreadcrumbSchema(breadcrumbs)} />

      <section className={styles.hero}>
        <Image 
          src="/images/banners/privacy_hero.jpg"
          alt={legal.title}
          fill
          priority
          quality={80}
          className={styles.heroImage}
        />
        <div className={styles.heroOverlay} />
        <div className={`container ${styles.heroContainer}`}>
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <Shield size={14} />
              <span>{legal.badge}</span>
            </div>
            <h1 className={styles.title}>{legal.title}</h1>
            <p className={styles.subtitle}>{legal.subtitle}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.contentSection}>
        <div className={`container ${styles.legalContainer}`}>
          <div className={styles.legalBox}>
            {legal.sections?.map((section: any, index: number) => (
              <div key={index} style={{ marginBottom: '2rem' }}>
                <h2>{section.title}</h2>
                <p>{section.text}</p>
              </div>
            ))}

            <div className={styles.dpoBox}>
              <h3>Canal de Privacidade e DPO</h3>
              <p>Para dúvidas ou solicitações referentes à LGPD:</p>
              <a href="mailto:comercial@criteltecnologia.com.br" className={styles.contactBtn}>
                comercial@criteltecnologia.com.br
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
