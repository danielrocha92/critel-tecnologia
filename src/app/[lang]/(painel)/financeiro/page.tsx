import styles from './financeiro.module.css';

export default function FinanceiroPage() {
  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Painel Financeiro</h1>
      <p className={styles.pageDescription}>Bem-vindo ao ambiente exclusivo do Financeiro. Mais recursos serão adicionados em breve.</p>
    </div>
  );
}
