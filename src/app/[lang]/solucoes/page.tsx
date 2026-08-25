import type { Metadata } from 'next';
import styles from './SolutionsIndex.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import JsonLd, { getBreadcrumbSchema } from '@/components/JsonLd/JsonLd';
import { getDictionary } from '@/dictionaries';
import {
  ShieldCheck,
  Network,
  Building2,
  Cable,
  Headset,
  Truck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const solutionsSeo = dict.seo?.solutions;

  const title = solutionsSeo?.title ?? 'Nossas Soluções Corporativas em TI e Segurança';
  const description =
    solutionsSeo?.description ??
    'Conheça nossas soluções completas em Segurança da Informação, Ativos de Rede, Cabeamento Estruturado, Tecnologia Predial, Suporte de TI e Field Services.';

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolvedParams.lang}/solucoes`,
      languages: {
        'pt-BR': '/pt/solucoes',
        'en-US': '/en/solucoes',
        'es-ES': '/es/solucoes',
        'x-default': '/pt/solucoes',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://criteltecnologia.com.br/${resolvedParams.lang}/solucoes`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function SolutionsIndexPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const content = dict.solutionsIndexPage ?? {
    badge: 'Portfólio Completo',
    title: 'Soluções de Engenharia de TI e Segurança',
    subtitle:
      'Projetos de alta confiabilidade, suporte proativo e tecnologias líderes para impulsionar a operação da sua empresa.',
    ctaTitle: 'Precisa de um diagnóstico para a infraestrutura da sua empresa?',
    ctaBtn: 'Falar com Engenheiro Especialista',
    viewMore: 'Saiba Mais',
  };

  const solutionsData = (dict.solutionsData ?? {}) as Record<string, any>;

  const solutionsList = [
    {
      slug: 'suporte-ti-empresarial',
      icon: Headset,
      data: solutionsData['suporte-ti-empresarial'],
    },
    {
      slug: 'cabeamento-estruturado',
      icon: Cable,
      data: solutionsData['cabeamento-estruturado'],
    },
    {
      slug: 'ativos-de-rede',
      icon: Network,
      data: solutionsData['ativos-de-rede'],
    },
    {
      slug: 'seguranca-da-informacao',
      icon: ShieldCheck,
      data: solutionsData['seguranca-da-informacao'],
    },
    {
      slug: 'tecnologia-predial',
      icon: Building2,
      data: solutionsData['tecnologia-predial'],
    },
    {
      slug: 'field-services',
      icon: Truck,
      data: solutionsData['field-services'],
    },
  ];

  const breadcrumbs = [
    { name: dict.nav?.home ?? 'Home', url: `/${resolvedParams.lang}` },
    { name: dict.nav?.solutions ?? 'Soluções', url: `/${resolvedParams.lang}/solucoes` },
  ];

  return (
    <div className={styles.pageContainer}>
      <JsonLd data={getBreadcrumbSchema(breadcrumbs)} />

      {/* Hero */}
      <section className={styles.hero}>
        <div className="container">
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>{content.badge}</span>
            </div>
            <h1 className={styles.title}>{content.title}</h1>
            <p className={styles.subtitle}>{content.subtitle}</p>
          </ScrollReveal>
        </div>
      </section>

      {/* Solutions Grid */}
      <section className={styles.gridSection}>
        <div className="container">
          <div className={styles.grid}>
            {solutionsList.map((sol, index) => {
              const IconComponent = sol.icon;
              const title = sol.data?.title ?? sol.slug;
              const desc = sol.data?.description ?? '';
              const features = (sol.data?.features ?? []).slice(0, 3);

              return (
                <ScrollReveal
                  key={sol.slug}
                  animation="fadeInUp"
                  delay={index * 0.1}
                  className={styles.card}
                >
                  <div>
                    <div className={styles.iconWrapper}>
                      <IconComponent size={28} />
                    </div>
                    <h2 className={styles.cardTitle}>{title}</h2>
                    <p className={styles.cardDesc}>{desc}</p>
                    {features.length > 0 && (
                      <ul className={styles.featuresList}>
                        {features.map((feat: string, i: number) => (
                          <li key={i} className={styles.featureItem}>
                            <CheckCircle2 size={16} className={styles.featureIcon} />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <Link
                    href={`/${resolvedParams.lang}/solucoes/${sol.slug}`}
                    className={styles.cardLink}
                  >
                    <span>{content.viewMore}</span>
                    <ArrowRight size={16} />
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <ScrollReveal animation="fadeInUp">
              <h2 className={styles.ctaTitle}>{content.ctaTitle}</h2>
              <Link
                href={`/${resolvedParams.lang}/#formulario`}
                className={styles.primaryBtn}
              >
                {content.ctaBtn}
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
