import styles from './Hero.module.css';

export default function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.overlay}></div>
      <div className={`container ${styles.content}`}>
        <h1 className={styles.title}>
          Infraestrutura e Projetos de TI<br />
          <span className="text-gradient">para o seu negócio.</span>
        </h1>
        <p className={styles.subtitle}>
          A Critel Tecnologia oferece aos clientes produtos e serviços com atuação humana e comprometida. Desde 1994, baseamos nossa oferta em metodologia, experiência, criatividade e, acima de tudo, no comprometimento com os resultados dos nossos clientes.
        </p>
        <div className={styles.actions}>
          <a href="#contato" className={styles.primaryBtn}>
            Fale com um Especialista
          </a>
          <a href="#servicos" className={styles.secondaryBtn}>
            Conheça nossos Serviços
          </a>
        </div>
      </div>
    </section>
  );
}
