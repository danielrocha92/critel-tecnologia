import styles from './Institutional.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function Institutional() {
  return (
    <section className={styles.institutional} id="empresa">
      <ScrollReveal animation="fadeInLeft" className={styles.imageHalf}>
      </ScrollReveal>
      <ScrollReveal animation="fadeInRight" className={styles.textHalf}>
        <h2 className={styles.title}>A Empresa</h2>
        <p className={styles.subtitle}>Engenharia real. Resultados visíveis.</p>
        <p className={styles.description}>
          <strong>30 ANOS resolvendo problemas de TI para redes varejistas de todo o Brasil.</strong>
        </p>
        <p className={styles.description}>
          A Critel integra help desk, field service, segurança eletrônica e cabeamento sob um único parceiro técnico. Com atendimento nacional e soluções personalizadas por unidade, sua operação se torna padronizada, segura e escalável. Com a Critel, você não depende da sorte — você conta com experiência comprovada.
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
