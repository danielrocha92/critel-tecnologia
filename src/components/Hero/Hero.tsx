import styles from './Hero.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

import Typewriter from '../Typewriter/Typewriter';

export default function Hero() {
  const typewriterWords = [
    "soluções integradas de TI.",
    "segurança da informação.",
    "ativos de rede corporativos.",
    "cabeamento estruturado."
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      <div className={`container ${styles.content}`}>
        <ScrollReveal animation="fadeInUp" duration={0.8}>
          <div className={styles.badge}>Excelência em Tecnologia</div>
          <h1 className={styles.title}>
            Potencializamos o desempenho do seu negócio com<br />
            <span className="text-gradient">
              <Typewriter 
                words={typewriterWords} 
                typingSpeed={50} 
                deletingSpeed={25} 
                pauseTime={1500} 
              />
            </span>
          </h1>
          <p className={styles.subtitle}>
            Proteção de dados, infraestrutura robusta e serviços personalizados para impulsionar a operação da sua empresa com máxima eficiência.
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
