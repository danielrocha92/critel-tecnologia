import type { Metadata } from 'next';
import styles from './Contact.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import ContactForm from '@/components/ContactForm/ContactForm';
import JsonLd, { getBreadcrumbSchema } from '@/components/JsonLd/JsonLd';
import { getDictionary } from '@/dictionaries';
import { MapPin, Phone, Mail, MessageSquare, Sparkles } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const contactSeo = dict.seo?.contact;

  const title = contactSeo?.title ?? 'Fale com um Especialista | Contato e Orçamentos';
  const description =
    contactSeo?.description ??
    'Entre em contato com a equipe técnica e comercial da Critel Tecnologia. Solicite uma proposta técnica ou diagnóstico de infraestrutura.';

  return {
    title,
    description,
    alternates: {
      canonical: `/${resolvedParams.lang}/contato`,
      languages: {
        'pt-BR': '/pt/contato',
        'en-US': '/en/contato',
        'es-ES': '/es/contato',
        'x-default': '/pt/contato',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://criteltecnologia.com.br/${resolvedParams.lang}/contato`,
    },
    twitter: {
      title,
      description,
    },
  };
}

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const footerDict = dict.footer;

  const breadcrumbs = [
    { name: dict.nav?.home ?? 'Home', url: `/${resolvedParams.lang}` },
    { name: dict.nav?.contact ?? 'Contato', url: `/${resolvedParams.lang}/contato` },
  ];

  return (
    <div className={styles.page}>
      <JsonLd data={getBreadcrumbSchema(breadcrumbs)} />

      <section className={styles.hero}>
        <div className={`container ${styles.heroContainer}`}>
          <ScrollReveal animation="fadeInUp">
            <div className={styles.badge}>
              <Sparkles size={14} />
              <span>Canais de Atendimento</span>
            </div>
            <h1 className={styles.title}>Fale com Nossos Especialistas</h1>
            <p className={styles.subtitle}>
              Estamos prontos para entender a infraestrutura da sua empresa e desenhar a melhor solução técnica.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className={styles.infoSection}>
        <div className="container">
          <div className={styles.cardsGrid}>
            <div className={styles.infoCard}>
              <div className={styles.iconBox}>
                <Phone size={24} />
              </div>
              <h3>Telefone Central</h3>
              <p>Atendimento comercial e corporativo</p>
              <a href="tel:+551131362592" className={styles.cardLink}>{footerDict.contact.phone}</a>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconBox}>
                <MessageSquare size={24} />
              </div>
              <h3>WhatsApp Comercial</h3>
              <p>Resposta ágil com engenharia consultiva</p>
              <a
                href="https://wa.me/5511996839480?text=Ol%C3%A1!%20Gostaria%20de%20um%20atendimento%20para%20minha%20empresa."
                target="_blank"
                rel="noopener noreferrer"
                className={styles.cardLink}
              >
                Conversar pelo WhatsApp →
              </a>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconBox}>
                <Mail size={24} />
              </div>
              <h3>E-mail</h3>
              <p>Envio de RFPs, editais e cotações</p>
              <a href="mailto:comercial@criteltecnologia.com.br" className={styles.cardLink}>{footerDict.contact.email}</a>
            </div>

            <div className={styles.infoCard}>
              <div className={styles.iconBox}>
                <MapPin size={24} />
              </div>
              <h3>Escritório Central</h3>
              <p>{footerDict.contact.address}</p>
              <span className={styles.cardSubtext}>{footerDict.contact.hours}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Formulário Integrado */}
      <section className={styles.formSection}>
        <ContactForm dict={dict.contactForm} />
      </section>
    </div>
  );
}
