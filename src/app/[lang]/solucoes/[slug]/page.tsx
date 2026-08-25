import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import styles from './Solution.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import JsonLd, { getBreadcrumbSchema, getServiceSchema } from '@/components/JsonLd/JsonLd';
import { getDictionary } from '@/dictionaries';
import { Sparkles, CheckCircle2, ArrowRight, PhoneCall } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const solutions = (dict.solutionsData ?? {}) as Record<string, any>;
  const solution = solutions[resolvedParams.slug];

  if (!solution) {
    return {
      title: 'Solução não encontrada | Critel Tecnologia',
    };
  }

  const title = `${solution.title} | Critel Tecnologia`;
  const description = solution.description;
  const url = `https://criteltecnologia.com.br/${resolvedParams.lang}/solucoes/${resolvedParams.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        'pt-BR': `https://criteltecnologia.com.br/pt/solucoes/${resolvedParams.slug}`,
        'en-US': `https://criteltecnologia.com.br/en/solucoes/${resolvedParams.slug}`,
        'es-ES': `https://criteltecnologia.com.br/es/solucoes/${resolvedParams.slug}`,
        'x-default': `https://criteltecnologia.com.br/pt/solucoes/${resolvedParams.slug}`,
      },
    },
    openGraph: {
      title,
      description,
      url,
      images: [
        {
          url: '/400PngdpiLogoCropped.png',
          width: 1200,
          height: 630,
          alt: `${solution.title} - Critel Tecnologia`,
        },
      ],
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string; lang: string }>;
}) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);

  const solutions = (dict.solutionsData ?? {}) as Record<string, any>;
  const solution = solutions[resolvedParams.slug];

  if (!solution) {
    notFound();
  }

  const imageMap: Record<string, string> = {
    'seguranca-da-informacao': '/images/seguranca.png',
    'ativos-de-rede': '/images/rede.png',
    'tecnologia-predial': '/images/predial.png',
    'cabeamento-estruturado': '/images/cabeamento.png',
    'suporte-ti-empresarial': '/images/rede.png',
    'field-services': '/images/cabeamento.png',
  };

  const currentUrl = `/${resolvedParams.lang}/solucoes/${resolvedParams.slug}`;
  const breadcrumbs = [
    { name: dict.nav?.home ?? 'Home', url: `/${resolvedParams.lang}` },
    { name: dict.nav?.solutions ?? 'Soluções', url: `/${resolvedParams.lang}/solucoes` },
    { name: solution.title, url: currentUrl },
  ];

  return (
    <div className={styles.pageContainer}>
      <JsonLd data={getBreadcrumbSchema(breadcrumbs)} />
      <JsonLd
        data={getServiceSchema({
          name: solution.title,
          description: solution.description,
          url: currentUrl,
          image: imageMap[resolvedParams.slug],
        })}
      />

      {/* Hero da Solução */}
      <section className={styles.hero}>
        <div className="container">
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>{dict.solutionPage.badge}</span>
            </div>
            <h1 className={styles.title}>{solution.title}</h1>
            <p className={styles.subtitle}>{solution.description}</p>
            <div className={styles.heroActions}>
              <Link
                href={`/${resolvedParams.lang}/#formulario`}
                className={styles.primaryBtn}
              >
                Solicitar Proposta Técnica
              </Link>
              <a
                href="https://wa.me/5511996839480?text=Ol%C3%A1!%20Gostaria%20de%20um%20diagn%C3%B3stico%20t%C3%A9cnico%20de%20infraestrutura."
                target="_blank"
                rel="noopener noreferrer"
                className={styles.secondaryBtn}
              >
                <PhoneCall size={16} /> Atendimento WhatsApp
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Conteúdo Detalhado e Diferenciais */}
      <section className={styles.contentSection}>
        <div className="container">
          <div className={styles.grid}>
            <ScrollReveal animation="fadeInLeft" className={styles.textContent}>
              <h2>{dict.solutionPage.overview}</h2>
              <p>{solution.detailedText}</p>

              <h3 className={styles.featuresTitle}>
                {dict.solutionPage.featuresTitle}
              </h3>
              <ul className={styles.featureList}>
                {solution.features.map((feat: string, idx: number) => (
                  <li key={idx}>
                    <CheckCircle2 size={20} className={styles.checkIcon} />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal animation="fadeInRight" className={styles.imageContent}>
              <div className={styles.imageWrapper}>
                <img
                  src={imageMap[resolvedParams.slug] || '/images/rede.png'}
                  alt={solution.title}
                  className={styles.image}
                />
                <div className={styles.imageBadge}>
                  <strong>30 Anos de Excelência</strong>
                  <span>Projetos Corporativos B2B</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      <section className={styles.bottomCtaSection}>
        <div className="container">
          <div className={styles.bottomCtaCard}>
            <h2>Precisa de {solution.title} para sua empresa?</h2>
          <p>
            Nossos engenheiros e consultores elaboram um diagnóstico sob medida
            para sua infraestrutura.
          </p>
          <Link
            href={`/${resolvedParams.lang}/#formulario`}
            className={styles.primaryBtn}
          >
            Falar com a Equipe de Engenharia <ArrowRight size={18} />
          </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
