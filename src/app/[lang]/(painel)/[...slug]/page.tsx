import { Search, Filter, MoreHorizontal } from 'lucide-react';
import styles from './generic.module.css';

export default async function GenericPage({ params }: { params: Promise<{ lang: string; slug: string[] }> }) {
  const { lang, slug } = await params;
  
  // Create a readable title from the slug array (e.g., ['meus-chamados', 'abertos'] -> 'Meus Chamados / Abertos')
  const readableTitle = slug
    .map(s => s.replace(/-/g, ' '))
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' / ');

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {readableTitle}
        </h1>
        <div className={styles.actions}>
          <button className={styles.btnFilter}>
            <Filter size={16} /> Filtros
          </button>
          <button className={styles.btnNew}>
            Novo Registro
          </button>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.searchBar}>
          <div className={styles.searchInputWrapper}>
            <Search size={16} className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Pesquisar registros..." 
              className={styles.searchInput}
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Descrição</th>
                <th className={styles.th}>Data</th>
                <th className={styles.th}>Status</th>
                <th className={styles.thActions}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                <tr key={item} className={styles.tr}>
                  <td className={styles.tdId}>#{2300 + item}</td>
                  <td className={styles.tdDesc}>Registro de exemplo gerado dinamicamente ({readableTitle})</td>
                  <td className={styles.tdDate}>16/09/2026</td>
                  <td className={styles.tdStatus}>
                    <span className={styles.statusBadge}>Ativo</span>
                  </td>
                  <td className={styles.tdActions}>
                    <button className={styles.btnMore}>
                      <MoreHorizontal size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className={styles.pagination}>
          <div>Mostrando 1 a 7 de 7 registros</div>
          <div className={styles.paginationActions}>
            <button className={styles.btnPage}>Anterior</button>
            <button className={styles.btnPageActive}>1</button>
            <button className={styles.btnPage}>Próxima</button>
          </div>
        </div>
      </div>
    </div>
  );
}
