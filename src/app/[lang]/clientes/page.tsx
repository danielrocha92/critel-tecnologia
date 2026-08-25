import type { Metadata } from 'next';
import styles from './Clients.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import JsonLd, { getBreadcrumbSchema } from '@/components/JsonLd/JsonLd';
import { getDictionary } from '@/dictionaries';
import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const clientsSeo = dict.seo?.clients;

  const title = clientsSeo?.title ?? 'Clientes e Casos de Sucesso | Critel Tecnologia';
  const description =
    clientsSeo?.description ??
    'Empresas líderes como Bradesco, Grupo IMC (Pizza Hut e KFC), Bacio di Latte, Ofner e Sonda confiam na engenharia e suporte da Critel Tecnologia.';

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolvedParams.lang}/clientes`,
      languages: {
        'pt-BR': '/pt/clientes',
        'en-US': '/en/clientes',
        'es-ES': '/es/clientes',
        'x-default': '/pt/clientes',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://criteltecnologia.com.br/${resolvedParams.lang}/clientes`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function ClientsPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const clientsData = dict.clientsPage;

  const breadcrumbs = [
    { name: dict.nav?.home ?? 'Home', url: `/${resolvedParams.lang}` },
    { name: dict.nav?.clients ?? 'Clientes', url: `/${resolvedParams.lang}/clientes` },
  ];

  const clientCases = [
    {
      name: 'Bradesco',
      logo: '/bradesco.svg',
      tag: 'Setor Financeiro & Corporativo',
      desc: 'Projetos de infraestrutura de alta performance, cabeamento estruturado e sustentação de operações críticas.',
      scope: ['Cabeamento Cat6A e Fibra', 'SLA de Atendimento Rígido', 'Certificação de Rede']
    },
    {
      name: 'Bacio di Latte',
      logo: '/bacio-di-latte.svg',
      logoLight: '/bacio-di-latte-dark.svg',
      tag: 'Varejo & Franquias Premium',
      desc: 'Field Services contínuos e montagem completa de conectividade, PDVs e tecnologia predial em expansão de lojas.',
      scope: ['Rollout de Novas Unidades', 'Suporte Técnico em Campo', 'CFTV & Controle de Acesso']
    },
    {
      name: 'Ofner',
      logo: '/ofner.png',
      tag: 'Indústria & Varejo Alimentício',
      desc: 'Suporte especializado em infraestrutura e redes para fábricas, centros de distribuição e rede de lojas.',
      scope: ['Infraestrutura de Rede e Wi-Fi', 'Service Desk Corporativo', 'Segurança da Informação']
    },
    {
      name: 'Engemon',
      logo: '/engemon.svg',
      logoLight: '/engemon-dark.svg',
      tag: 'Engenharia & Soluções Integradas',
      desc: 'Parceria técnica em engenharia de redes, automação e implementação de infraestrutura de telecom.',
      scope: ['Grandes Obras de Infraestrutura', 'Fusão e Lançamento de Fibra', 'Projetos Críticos']
    },
    {
      name: 'Sonda IT',
      logo: '/sonda.svg',
      tag: 'Líder em Serviços de TI',
      desc: 'Atuação conjunta em projetos de Field Services e conectividade corporativa para grandes clientes.',
      scope: ['Field Services Nacional', 'Ativos de Rede Enterprise', 'Manutenção Preventiva']
    },
    {
      name: 'Pizza Hut & KFC (IMC)',
      logo: '/pizza-hut.svg',
      logoLight: '/pizza-hut-dark.svg',
      tag: 'Food Service & Redes de Fast Food',
      desc: 'Infraestrutura tecnológica completa de PDV, rede estruturada e conectividade de alta disponibilidade para franquias.',
      scope: ['Abertura de Lojas Rápidas', 'Infraestrutura de PDV', 'Monitoramento CFTV']
    }
  ];

  return (
    <div className={styles.page}>
      <JsonLd data={getBreadcrumbSchema(breadcrumbs)} />

      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>{clientsData.badge}</span>
            </div>
            <h1 className={styles.title}>{clientsData.title}</h1>
            <p className={styles.subtitle}>{clientsData.subtitle}</p>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.casesSection}>
        <div className="container">
          <div className={styles.casesGrid}>
            {clientCases.map((c, idx) => (
              <ScrollReveal key={idx} animation="fadeInUp" className={styles.caseCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.logoBox}>
                    <img 
                      src={c.logo} 
                      alt={`Logo ${c.name}`} 
                      className={`${styles.logoImg} ${c.logoLight ? styles.logoForDark : ''}`} 
                    />
                    {c.logoLight && (
                      <img 
                        src={c.logoLight} 
                        alt={`Logo ${c.name}`} 
                        className={`${styles.logoImg} ${styles.logoForLight}`} 
                      />
                    )}
                  </div>
                  <span className={styles.tagBadge}>{c.tag}</span>
                </div>
                <h2 className={styles.clientName}>{c.name}</h2>
                <p className={styles.clientDesc}>{c.desc}</p>
                <div className={styles.scopeList}>
                  {c.scope.map((s, i) => (
                    <div key={i} className={styles.scopeItem}>
                      <CheckCircle2 size={15} className={styles.checkIcon} />
                      <span>{s}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.ctaSection}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2>{clientsData.ctaTitle}</h2>
            <Link href={`/${resolvedParams.lang}/#formulario`} className={styles.ctaBtn}>
              {clientsData.ctaBtn} <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
