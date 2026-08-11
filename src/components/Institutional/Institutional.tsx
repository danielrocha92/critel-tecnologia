import styles from './Institutional.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function Institutional() {
  return (
    <section className={styles.institutional} id="empresa">
      <ScrollReveal animation="fadeInLeft" className={styles.imageHalf}>
      </ScrollReveal>
      <ScrollReveal animation="fadeInRight" className={styles.textHalf}>
        <h2 className={styles.title}>Sobre a Critel</h2>
        <p className={styles.subtitle}>Sólida expertise em Infraestrutura de TI.</p>
        <p className={styles.description}>
          <strong>Soluções Integradas para Setor Público e Privado.</strong>
        </p>
        <p className={styles.description}>
          A Critel Tecnologia é especializada em oferecer soluções integradas em infraestrutura e segurança de TI. Focamos em inovação, excelência operacional e na proteção dos dados dos nossos clientes. Nossos serviços são desenhados para atender necessidades específicas, proporcionando resultados que alavancam sua produtividade.
        </p>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>30</span>
            <span className={styles.statLabel}>Anos de Mercado</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>+1.000</span>
            <span className={styles.statLabel}>Projetos Executados</span>
          </div>
        </div>
      </ScrollReveal>
    </section>
  );
}
