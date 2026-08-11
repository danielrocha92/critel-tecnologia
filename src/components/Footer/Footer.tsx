import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer} id="contato">
      <div className={`container ${styles.container}`}>
        <div className={styles.brandInfo}>
          <h2 className={styles.brandName}>Critel Tecnologia</h2>
          <p className={styles.address}>
            Rua Mar Del Plata, 34 - Jardim dos Lagos<br />
            São Paulo - SP, 04771-090
          </p>
          <div className={styles.contact}>
            <p>comercial@criteltecnologia.com.br</p>
            <p>(11) 3136-2592</p>
          </div>
        </div>
        
        <div className={styles.linksBlock}>
          <h4 className={styles.title}>Menu</h4>
          <ul className={styles.linksList}>
            <li><a href="#empresa">Empresa</a></li>
            <li><a href="#servicos">Serviços</a></li>
            <li><a href="#clientes">Clientes</a></li>
            <li><a href="#contato">Contato</a></li>
          </ul>
        </div>
        
        <div className={styles.lgpdBlock}>
          <div className={styles.lgpdSeal}>
            <span>✓</span> Especialistas em Infraestrutura
          </div>
          <p className={styles.lgpdText}>
            Atuação humana e comprometida com as necessidades do negócio de seus clientes desde 1994.
          </p>
        </div>
      </div>
      <div className={styles.bottomBar}>
        <div className="container">
          <p>&copy; {new Date().getFullYear()} Critel Tecnologia. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
