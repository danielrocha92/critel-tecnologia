import styles from './Institutional.module.css';

export default function Institutional() {
  return (
    <section className={styles.institutional} id="empresa">
      <div className={styles.imageHalf}></div>
      <div className={styles.textHalf}>
        <h2 className={styles.title}>A Empresa</h2>
        <p className={styles.subtitle}>Engenharia e Tecnologia desde 1994.</p>
        <p className={styles.description}>
          A Critel Tecnologia oferece aos seus clientes produtos e serviços de Infraestrutura, Field Services e Projetos de TI, através de uma atuação humana e comprometida com as necessidades do negócio.
        </p>
        <p className={styles.description}>
          Desde 1994 no mercado, baseamos nossa oferta em metodologia sólida, experiência, criatividade e, acima de tudo, no comprometimento de nossa equipe com os resultados dos nossos clientes.
        </p>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>+30</span>
            <span className={styles.statLabel}>Anos de Mercado</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>Top</span>
            <span className={styles.statLabel}>Comprometimento</span>
          </div>
        </div>
      </div>
    </section>
  );
}
