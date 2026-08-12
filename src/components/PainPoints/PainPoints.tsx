import styles from './PainPoints.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function PainPoints() {
  return (
    <section className={styles.painPoints} id="dor">
      <div className={`container ${styles.container}`}>
        <div className={styles.grid}>
          <div className={styles.content}>
            <ScrollReveal animation="fadeInLeft">
              <h2 className={styles.title}>
                Sua operação cresce, mas a TI parece cada vez mais fora de padrão?
              </h2>
              <p className={styles.description}>
                Chamados em aberto, lojas sem suporte presencial, cabeamento improvisado, equipamentos obsoletos e múltiplos fornecedores que não se falam. Você não está sozinho e não precisa mais conviver com isso.
              </p>
              <div className={styles.highlight}>
                <p><strong>Crescer exige padrão, estabilidade e suporte técnico de verdade.</strong> Varejo com múltiplas unidades exige mais que suporte pontual. Você precisa de padronização entre lojas, suporte rápido e uma infraestrutura que acompanhe sua expansão.</p>
              </div>
              <a href="#formulario" className={styles.btn}>Solicite uma análise</a>
            </ScrollReveal>
          </div>
          
          <div className={styles.imageContainer}>
            <ScrollReveal animation="fadeInRight" delay={0.2}>
              <div className={styles.imageWrapper}>
                <img 
                  src="https://images.unsplash.com/photo-1573164713988-8665fc963095?q=80&w=2069&auto=format&fit=crop" 
                  alt="Desafios de TI no Varejo" 
                  className={styles.image} 
                />
                <div className={styles.overlay}></div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
