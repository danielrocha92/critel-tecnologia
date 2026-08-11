import styles from './Innovation.module.css';

export default function Innovation() {
  return (
    <section className={styles.innovation} id="dashboard">
      <div className={`container ${styles.container}`}>
        <div className={styles.content}>
          <h2 className={styles.title}>Gestão na palma da sua mão</h2>
          <p className={styles.description}>
            Monitore sua infraestrutura, acessos e CFTV em tempo real com nossa plataforma IoT exclusiva.
            Controle total e dados precisos para garantir a segurança e eficiência do seu negócio.
          </p>
          <ul className={styles.features}>
            <li>Monitoramento ao vivo</li>
            <li>Alertas automatizados</li>
            <li>Relatórios de telemetria</li>
          </ul>
        </div>
        <div className={styles.mockup}>
          {/* Decorative dashboard representation */}
          <div className={styles.screen}>
            <div className={styles.screenHeader}>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
              <span className={styles.dot}></span>
            </div>
            <div className={styles.dashboardGrid}>
              <div className={styles.dashCard}>
                <h4>Status da Rede</h4>
                <div className={styles.statusOn}>Online</div>
              </div>
              <div className={styles.dashCard}>
                <h4>Câmeras Ativas</h4>
                <div className={styles.statValue}>24/24</div>
              </div>
              <div className={styles.dashCardLarge}>
                <h4>Tráfego em Tempo Real</h4>
                <div className={styles.chart}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
