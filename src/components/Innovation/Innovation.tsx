import styles from './Innovation.module.css';
import ScrollReveal from '../ScrollReveal/ScrollReveal';

export default function Innovation() {
  return (
    <section className={styles.innovation} id="dashboard">
      <div className={`container ${styles.container}`}>
        <ScrollReveal animation="fadeInLeft" className={styles.content}>
          <h2 className={styles.title}>Crescer exige padrão e estabilidade</h2>
          <p className={styles.description}>
            Varejo com múltiplas unidades exige mais que suporte pontual. Você precisa de padronização entre lojas, suporte rápido, tecnologia atualizada e uma infraestrutura que acompanhe sua expansão. É isso que a Critel entrega todos os dias.
          </p>
          <ul className={styles.features}>
            <li>Diagnóstico remoto ou presencial da estrutura atual</li>
            <li>Plano técnico sob medida por unidade</li>
            <li>Execução padronizada sem parar operações</li>
            <li>Suporte contínuo com help desk e field service</li>
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
                <h4>Lojas Padronizadas</h4>
                <div className={styles.statusOn}>100%</div>
              </div>
              <div className={styles.dashCard}>
                <h4>SLA de Atendimento</h4>
                <div className={styles.statValue}>99.9%</div>
              </div>
              <div className={styles.dashCardLarge}>
                <h4>Chamados Resolvidos</h4>
                <div className={styles.chart}></div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
