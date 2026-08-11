import styles from './Highlights.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';
import { Target, Leaf, Briefcase } from 'lucide-react';

export default function Highlights() {
  return (
    <section className={styles.highlights}>
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          <ScrollReveal animation="fadeInUp" delay={0.1} className={styles.card}>
            <div className={styles.iconWrapper}>
              <Target size={32} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>INOVAÇÃO CONSTANTE</h3>
            <p className={styles.description}>
              Aplicando as melhores tecnologias do mercado para impulsionar resultados contínuos.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fadeInUp" delay={0.2} className={styles.card}>
            <div className={styles.iconWrapper}>
              <Leaf size={32} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>COMPROMISSO COM O AMANHÃ</h3>
            <p className={styles.description}>
              Práticas responsáveis que garantem segurança e eficiência a longo prazo para o seu negócio.
            </p>
          </ScrollReveal>

          <ScrollReveal animation="fadeInUp" delay={0.3} className={styles.card}>
            <div className={styles.iconWrapper}>
              <Briefcase size={32} strokeWidth={1.5} />
            </div>
            <h3 className={styles.title}>EXPERTISE TÉCNICA</h3>
            <p className={styles.description}>
              Abordagem consultiva e execução totalmente sob medida para as demandas corporativas.
            </p>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
