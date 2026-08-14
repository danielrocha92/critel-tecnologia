import { notFound } from 'next/navigation';
import styles from './Solution.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import { getDictionary } from '@/dictionaries';
import { Shield, Sparkles, CheckCircle2, ArrowRight, PhoneCall } from 'lucide-react';
import Link from 'next/link';

export default async function SolutionPage({ params }: { params: Promise<{ slug: string, lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  
  // Acessa as soluções traduzidas
  const solutions = dict.solutionsData as Record<string, any>;
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
    'field-services': '/images/cabeamento.png'
  };

  return (
    <div className={styles.pageContainer}>
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
              <Link href={`/${resolvedParams.lang}/#formulario`} className={styles.primaryBtn}>
                Solicitar Proposta Técnica
              </Link>
              <a 
                href="https://wa.me/5511999999999?text=Ol%C3%A1!%20Gostaria%20de%20um%20diagn%C3%B3stico%20t%C3%A9cnico%20de%20infraestrutura." 
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
              <p>
                {solution.detailedText}
              </p>
              
              <h3 className={styles.featuresTitle}>{dict.solutionPage.featuresTitle}</h3>
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
                <img src={imageMap[resolvedParams.slug] || '/images/rede.png'} alt={solution.title} className={styles.image} />
                <div className={styles.imageBadge}>
                  <strong>30 Anos de Excelência</strong>
                  <span>Projetos Corporativos B2B</span>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className={styles.bottomCtaSection}>
        <div className={`container ${styles.bottomCtaCard}`}>
          <h2>Precisa de {solution.title} para sua empresa?</h2>
          <p>Nossos engenheiros e consultores elaboram um diagnóstico sob medida para sua infraestrutura.</p>
          <Link href={`/${resolvedParams.lang}/#formulario`} className={styles.primaryBtn}>
            Falar com a Equipe de Engenharia <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
