import styles from './Clients.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import { getDictionary } from '@/dictionaries';
import { Sparkles, Building2, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default async function ClientsPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const clientsData = dict.clientsPage;

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
      tag: 'Food Service & Redes de Fast Food',
      desc: 'Infraestrutura tecnológica completa de PDV, rede estruturada e conectividade de alta disponibilidade para franquias.',
      scope: ['Abertura de Lojas Rápidas', 'Infraestrutura de PDV', 'Monitoramento CFTV']
    }
  ];

  return (
    <div className={styles.page}>
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
                    <img src={c.logo} alt={c.name} className={styles.logoImg} />
                  </div>
                  <span className={styles.tagBadge}>{c.tag}</span>
                </div>
                <h3 className={styles.clientName}>{c.name}</h3>
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
        <div className={`container ${styles.ctaBox}`}>
          <h2>{clientsData.ctaTitle}</h2>
          <Link href={`/${resolvedParams.lang}/#formulario`} className={styles.ctaBtn}>
            {clientsData.ctaBtn} <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
