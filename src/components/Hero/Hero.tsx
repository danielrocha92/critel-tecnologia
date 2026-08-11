import styles from './Hero.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      <div className={`container ${styles.content}`}>
        <ScrollReveal animation="fadeInUp" duration={0.8}>
          <div className={styles.badge}>30 anos de mercado</div>
          <h1 className={styles.title}>
            TI padronizada e suporte nacional para<br />
            <span className="text-gradient">empresas com múltiplas unidades.</span>
          </h1>
          <p className={styles.subtitle}>
            Help desk, suporte em campo, cabeamento estruturado e locação de equipamentos de segurança. Tudo sob medida para operações que não podem parar.
          </p>
          <div className={styles.actions}>
            <a href="#formulario" className={styles.primaryBtn}>
              Solicitar Diagnóstico Gratuito
            </a>
            <a href="#solucoes" className={styles.secondaryBtn}>
              Conheça nossas Soluções
            </a>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
