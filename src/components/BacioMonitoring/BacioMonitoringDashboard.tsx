'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertCircle, CircleCheck, CircleHelp, CircleX, Clock3, RefreshCw, Search, Store } from 'lucide-react';
import stores from '@/data/bacio-stores.json';
import styles from './BacioMonitoringDashboard.module.css';

type StoreInfo = { code: string; name: string };
type PdvStatus = {
  loja_codigo: string;
  pdv_codigo: string;
  pdv_nome: string;
  status_conexao: 'ONLINE' | 'OFFLINE';
  ultima_verificacao: string | null;
};
type FilterStatus = 'TODOS' | 'ONLINE' | 'OFFLINE' | 'SEM_DADOS';
const ONLINE_TIMEOUT_MS = 3 * 60_000;

const storeList = stores as StoreInfo[];

function normalizeCode(code: string | number) {
  return String(code).replace(/\D/g, '').padStart(4, '0');
}

function formatDate(value: string | null) {
  if (!value) return 'Sem registro de verificação';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data de verificação inválida';
  return `Verificado ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(date)}`;
}

function isPdvOnline(pdv: PdvStatus) {
  if (pdv.status_conexao !== 'ONLINE' || !pdv.ultima_verificacao) return false;
  const checkedAt = new Date(pdv.ultima_verificacao).getTime();
  return Number.isFinite(checkedAt) && Date.now() - checkedAt <= ONLINE_TIMEOUT_MS;
}

export default function BacioMonitoringDashboard() {
  const [pdvs, setPdvs] = useState<PdvStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterStatus>('TODOS');

  const loadStatuses = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/monitoramento/bacio', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar os status.');
      setPdvs(Array.isArray(result.pdvs) ? result.pdvs : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Falha ao consultar o monitoramento.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadStatuses();
    const interval = window.setInterval(() => void loadStatuses(true), 60_000);
    return () => window.clearInterval(interval);
  }, [loadStatuses]);

  const pdvsByStore = useMemo(() => {
    const grouped = new Map<string, PdvStatus[]>();
    for (const pdv of pdvs) {
      const code = normalizeCode(pdv.loja_codigo);
      grouped.set(code, [...(grouped.get(code) ?? []), pdv]);
    }
    return grouped;
  }, [pdvs]);

  const counts = useMemo(() => ({
    online: pdvs.filter(isPdvOnline).length,
    offline: pdvs.filter((pdv) => !isPdvOnline(pdv)).length,
    unreportedStores: storeList.filter((store) => !pdvsByStore.has(normalizeCode(store.code))).length,
  }), [pdvs, pdvsByStore]);

  const filteredStores = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return storeList.filter((store) => {
      const storePdvs = pdvsByStore.get(normalizeCode(store.code)) ?? [];
      const online = storePdvs.some(isPdvOnline);
      const offline = storePdvs.some((pdv) => !isPdvOnline(pdv));
      const statusMatches = filter === 'TODOS'
        || (filter === 'ONLINE' && online)
        || (filter === 'OFFLINE' && offline)
        || (filter === 'SEM_DADOS' && storePdvs.length === 0);
      const searchMatches = !normalizedQuery
        || store.name.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
        || store.code.includes(normalizedQuery)
        || storePdvs.some((pdv) => `${pdv.pdv_codigo} ${pdv.pdv_nome}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery));
      return statusMatches && searchMatches;
    });
  }, [filter, pdvsByStore, query]);

  return (
    <section className={styles.dashboard} aria-labelledby="bacio-monitor-title">
      <header className={styles.pageHeader}>
        <div>
          <span className={styles.eyebrow}><Activity size={15} /> OPERAÇÃO DE LOJAS</span>
          <h1 id="bacio-monitor-title">Monitoramento Bacio di Latte</h1>
          <p>Status de conexão por PDV, com atualização automática a cada minuto.</p>
        </div>
        <button className={styles.refreshButton} type="button" onClick={() => void loadStatuses(true)} disabled={refreshing}>
          <RefreshCw size={16} className={refreshing ? styles.spinning : undefined} />
          {refreshing ? 'Atualizando' : 'Atualizar'}
        </button>
      </header>

      <div className={styles.summaryGrid} aria-label="Resumo do monitoramento">
        <button className={`${styles.summaryCard} ${styles.onlineCard} ${filter === 'ONLINE' ? styles.summaryCardActive : ''}`} type="button" onClick={() => setFilter('ONLINE')} aria-pressed={filter === 'ONLINE'}>
          <span className={styles.summaryIcon}><CircleCheck size={19} /></span>
          <div><span>PDVs online</span><strong>{loading ? '—' : counts.online}</strong></div>
        </button>
        <button className={`${styles.summaryCard} ${styles.offlineCard} ${filter === 'OFFLINE' ? styles.summaryCardActive : ''}`} type="button" onClick={() => setFilter('OFFLINE')} aria-pressed={filter === 'OFFLINE'}>
          <span className={styles.summaryIcon}><CircleX size={19} /></span>
          <div><span>PDVs offline</span><strong>{loading ? '—' : counts.offline}</strong></div>
        </button>
        <button className={`${styles.summaryCard} ${styles.unknownCard} ${filter === 'SEM_DADOS' ? styles.summaryCardActive : ''}`} type="button" onClick={() => setFilter('SEM_DADOS')} aria-pressed={filter === 'SEM_DADOS'}>
          <span className={styles.summaryIcon}><CircleHelp size={19} /></span>
          <div><span>Lojas sem telemetria</span><strong>{loading ? '—' : counts.unreportedStores}</strong></div>
        </button>
        <button className={`${styles.summaryCard} ${filter === 'TODOS' ? styles.summaryCardActive : ''}`} type="button" onClick={() => setFilter('TODOS')} aria-pressed={filter === 'TODOS'}>
          <span className={styles.summaryIcon}><Store size={19} /></span>
          <div><span>Lojas cadastradas</span><strong>{storeList.length}</strong></div>
        </button>
      </div>

      <section className={styles.storeSection} aria-labelledby="store-list-title">
        <div className={styles.listHeader}>
          <div>
            <h2 id="store-list-title">Lojas e pontos de venda</h2>
            <p>O indicador cinza significa que ainda não há status recebido do Milvus.</p>
          </div>
          <label className={styles.searchBox}>
            <Search size={17} />
            <span className={styles.visuallyHidden}>Buscar loja ou PDV</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar loja, código ou PDV" />
          </label>
        </div>

        <div className={styles.filterBar} aria-label="Filtrar lojas por status">
          {([
            ['TODOS', 'Todas'], ['ONLINE', 'Com PDV online'], ['OFFLINE', 'Com PDV offline'], ['SEM_DADOS', 'Sem telemetria'],
          ] as [FilterStatus, string][]).map(([value, label]) => (
            <button key={value} type="button" className={filter === value ? styles.activeFilter : ''} onClick={() => setFilter(value)} aria-pressed={filter === value}>
              {label}
            </button>
          ))}
        </div>

        {error && <div className={styles.errorMessage} role="alert"><AlertCircle size={18} />{error}</div>}
        {!error && !loading && pdvs.length === 0 && (
          <div className={styles.integrationNotice} role="status">
            <CircleHelp size={19} />
            <span>O painel está pronto, mas ainda não recebeu telemetria do Milvus. Nenhum PDV será marcado como online ou offline sem uma leitura real.</span>
          </div>
        )}

        {loading ? (
          <div className={styles.emptyState}>Carregando lojas e status dos PDVs…</div>
        ) : filteredStores.length === 0 ? (
          <div className={styles.emptyState}>Nenhuma loja encontrada para esse filtro.</div>
        ) : (
          <ul className={styles.storeList}>
            {filteredStores.map((store) => {
              const storePdvs = pdvsByStore.get(normalizeCode(store.code)) ?? [];
              return (
                <li className={styles.storeRow} key={store.code}>
                  <div className={styles.storeIdentity}>
                    <span className={styles.storeIcon}><Store size={18} /></span>
                    <div><strong>{store.name}</strong><span>Loja {store.code}</span></div>
                  </div>
                  <div className={styles.pdvList}>
                    {storePdvs.length === 0 ? (
                      <span className={styles.noTelemetry}><CircleHelp size={16} /> Aguardando telemetria</span>
                    ) : storePdvs.map((pdv) => {
                      const isOnline = isPdvOnline(pdv);
                      return (
                        <div className={styles.pdvItem} key={`${pdv.loja_codigo}-${pdv.pdv_codigo}`}>
                          <span className={`${styles.statusDot} ${isOnline ? styles.statusOnline : styles.statusOffline}`} aria-hidden="true" />
                          <span className={styles.pdvName}>{pdv.pdv_nome || `PDV ${pdv.pdv_codigo}`}</span>
                          <strong className={isOnline ? styles.onlineText : styles.offlineText}>{isOnline ? 'Online' : 'Offline'}</strong>
                          <span className={styles.lastCheck}><Clock3 size={13} />{formatDate(pdv.ultima_verificacao)}</span>
                        </div>
                      );
                    })}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </section>
  );
}
