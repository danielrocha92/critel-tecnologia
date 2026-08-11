import styles from './Innovation.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function Innovation() {
  return (
    <section className={styles.innovation} id="dashboard">
      <div className={`container ${styles.container}`}>
        <ScrollReveal animation="fadeInLeft" className={styles.content}>
          <h2 className={styles.title}>Nossa Metodologia</h2>
          <p className={styles.description}>
            Garantimos a excelência dos nossos serviços através de 5 pilares fundamentais, acompanhando o seu projeto de ponta a ponta.
          </p>
          <ul className={styles.features}>
            <li><strong>1. Consultoria:</strong> Entendimento profundo do negócio</li>
            <li><strong>2. Análise Técnica:</strong> Diagnóstico e desenho da solução</li>
            <li><strong>3. Escopo:</strong> Planejamento detalhado do projeto</li>
            <li><strong>4. Implantação:</strong> Execução ágil e padronizada</li>
            <li><strong>5. Manutenção:</strong> Suporte preventivo e corretivo</li>
          </ul>
        </ScrollReveal>
        <ScrollReveal animation="fadeInRight" className={styles.mockup}>
          {/* Decorative dashboard representation */}
          <div className={styles.screen}>
            <div className={styles.screenHeader}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
            <div className={styles.dashboardGrid}>
              <div className={styles.dashCard}>
                <h4>Etapas Concluídas</h4>
                <div className={styles.statusOn}>5/5</div>
              </div>
              <div className={styles.dashCard}>
                <h4>Satisfação</h4>
                <div className={styles.statValue}>100%</div>
              </div>
              <div className={styles.dashCardLarge}>
                <h4>Progresso do Projeto</h4>
                <div className={styles.chart}></div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
