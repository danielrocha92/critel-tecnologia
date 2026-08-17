import styles from './Contact.module.css';
import ScrollReveal from '@/components/ScrollReveal/ScrollReveal';
import ContactForm from '@/components/ContactForm/ContactForm';
import { getDictionary } from '@/dictionaries';
import { MapPin, Phone, Mail, Clock, MessageSquare, Sparkles } from 'lucide-react';

export default async function ContactPage({ params }: { params: Promise<{ lang: string }> }) {
  const resolvedParams = await params;
  const dict = await getDictionary(resolvedParams.lang as any);
  const footerDict = dict.footer;

  return (
    <div className={styles.page}>
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
