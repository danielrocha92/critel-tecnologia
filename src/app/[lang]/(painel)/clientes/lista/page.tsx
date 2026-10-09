'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Search, Plus, Building2, Phone, Mail, MoreVertical, ChevronDown, Filter } from 'lucide-react';
import SectionPageHeader from '@/components/Dashboard/SectionPageHeader';
import styles from './clientes.module.css';

const clientes = [
  { id: 1, nome: 'Bacio di Latte', sigla: 'BL', segmento: 'Alimentação', lojas: 142,  contato: 'contato@baciodilatte.com.br',   telefone: '(11) 3000-0000', status: 'Ativo' },
  { id: 2, nome: 'Ofner',          sigla: 'OF', segmento: 'Alimentação', lojas: 28,   contato: 'suporte@ofner.com.br',          telefone: '(11) 3111-1111', status: 'Ativo' },
  { id: 3, nome: 'KFC Brasil',     sigla: 'KF', segmento: 'Fast Food',   lojas: 95,   contato: 'ti@kfcbrasil.com.br',           telefone: '(11) 3222-2222', status: 'Ativo' },
  { id: 4, nome: 'Burger King',    sigla: 'BK', segmento: 'Fast Food',   lojas: 850,  contato: 'suporte@burgerking.com.br',     telefone: '(11) 3333-3333', status: 'Ativo' },
  { id: 5, nome: 'Pizza Hut',      sigla: 'PH', segmento: 'Fast Food',   lojas: 200,  contato: 'infra@pizzahut.com.br',         telefone: '(11) 3444-4444', status: 'Em Implantação' },
];

const statusConfig: Record<string, { bgClass: string; dotClass: string }> = {
  'Ativo':          { bgClass: styles.statusAtivo,      dotClass: styles.statusAtivoDot },
  'Em Implantação': { bgClass: styles.statusImplantacao, dotClass: styles.statusImplantacaoDot },
  'Inativo':        { bgClass: styles.statusInativo,     dotClass: styles.statusInativoDot },
};

const segmentoClasses: Record<string, string> = {
  'Alimentação': styles.segAlimentacao,
  'Fast Food':   styles.segFastFood,
  'Varejo':      styles.segVarejo,
};

const COL_MIN = 60;
const COL_KEYS = ['cliente', 'segmento', 'lojas', 'contato', 'telefone', 'status', 'acoes'] as const;
type ColKey = typeof COL_KEYS[number];
const INITIAL_WIDTHS: Record<ColKey, number> = {
  cliente: 220, segmento: 130, lojas: 100, contato: 230, telefone: 140, status: 140, acoes: 80,
};

export default function ClientesPage() {
  const [busca,       setBusca]       = useState('');
  const [filtroSeg,   setFiltroSeg]   = useState('Todos');
  const [filtroStatus,setFiltroStatus]= useState('Todos');
  const [colWidths, setColWidths] = useState<Record<ColKey, number>>(INITIAL_WIDTHS);
  const dragging = useRef<{ col: ColKey; startX: number; startWidth: number } | null>(null);

  const onResizeStart = useCallback((col: ColKey, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragging.current = { col, startX: event.clientX, startWidth: colWidths[col] };
    document.body.classList.add('column-resizing');

    const onMove = (moveEvent: MouseEvent) => {
      if (!dragging.current) return;
      const { col: activeCol, startX, startWidth } = dragging.current;
      setColWidths((current) => ({
        ...current,
        [activeCol]: Math.max(COL_MIN, startWidth + moveEvent.clientX - startX),
      }));
    };

    const onUp = () => {
      dragging.current = null;
      document.body.classList.remove('column-resizing');
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp, { once: true });
  }, [colWidths]);
  const filtrados = clientes.filter(c => {
    const matchBusca  = !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.contato.toLowerCase().includes(busca.toLowerCase());
    const matchSeg    = filtroSeg    === 'Todos' || c.segmento === filtroSeg;
    const matchStatus = filtroStatus === 'Todos' || c.status   === filtroStatus;
    return matchBusca && matchSeg && matchStatus;
  });

  const Th = ({
    col, children, align
  }: {
    col: ColKey;
    children: React.ReactNode;
    align?: 'right';
  }) => (
    <th 
      className={`${styles.thContainer} ${align === 'right' ? styles.rightAlign : styles.alignLeft}`}
    >
      {children}
      {col !== 'acoes' && (
        <button
          type="button"
          className={styles.resizeHandle}
          aria-label={`Redimensionar coluna ${col}`}
          title="Arraste para redimensionar; use as setas para ajustar"
          onMouseDown={(event) => onResizeStart(col, event)}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
            event.preventDefault();
            const delta = event.key === 'ArrowRight' ? 16 : -16;
            setColWidths((current) => ({ ...current, [col]: Math.max(COL_MIN, current[col] + delta) }));
          }}
        >
          <span className={styles.resizeLine} aria-hidden="true" />
        </button>
      )}
    </th>
  );

  return (
    <>
      <div className={styles.pageWrapper}>

        {/* Header */}
        <SectionPageHeader
          eyebrow="GESTÃO DE CLIENTES"
          title="Base de clientes"
          description={`${filtrados.length} empresa${filtrados.length !== 1 ? 's' : ''} cadastrada${filtrados.length !== 1 ? 's' : ''}`}
          action={(
            <button type="button" className={styles.btnPrimary}>
              <Plus size={16} /> Novo Cliente
            </button>
          )}
        />

        {/* Filtros */}
        <div className={styles.filtersContainer}>
          <Filter size={15} className={styles.filterIcon} />

          <div className={styles.inputWrapper}>
            <Search size={15} className={styles.searchIcon} />
            <input className={styles.critelInput} type="search" aria-label="Buscar clientes por nome ou e-mail" placeholder="Buscar por nome ou e-mail..."
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>

          <div className={styles.selectWrapper}>
            <select className={styles.critelSelect} aria-label="Filtrar por segmento" value={filtroSeg} onChange={e => setFiltroSeg(e.target.value)}>
              <option value="Todos">Todos os Segmentos</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Fast Food">Fast Food</option>
              <option value="Varejo">Varejo</option>
            </select>
            <ChevronDown size={14} className={styles.selectArrow} />
          </div>

          <div className={styles.selectWrapper}>
            <select className={styles.critelSelect} aria-label="Filtrar por status" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="Todos">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Em Implantação">Em Implantação</option>
              <option value="Inativo">Inativo</option>
            </select>
            <ChevronDown size={14} className={styles.selectArrow} />
          </div>
          <button
            type="button"
            onClick={() => setColWidths(INITIAL_WIDTHS)}
            className={styles.btnReset}
            title="Restaurar larguras padrão da tabela"
          >
            Resetar colunas
          </button>
        </div>

        {/* Tabela com overflow horizontal */}
        <div className={styles.tableContainer}>
          <table className={styles.clientesTable}>
            <colgroup>
              {COL_KEYS.map((col) => <col key={col} width={colWidths[col]} />)}
            </colgroup>
            <thead>
              <tr>
                <Th col="cliente">Cliente</Th>
                <Th col="segmento">Segmento</Th>
                <Th col="lojas"><Building2 size={12} className={styles.inlineIcon} />Lojas</Th>
                <Th col="contato"><Mail size={12} className={styles.inlineIcon} />Contato</Th>
                <Th col="telefone"><Phone size={12} className={styles.inlineIcon} />Telefone</Th>
                <Th col="status">Status</Th>
                <Th col="acoes" align="right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} className={styles.emptyRow}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : filtrados.map(c => {
                const sc = statusConfig[c.status] ?? statusConfig['Inativo'];
                const segClass = segmentoClasses[c.segmento] ?? styles.segDefault;

                return (
                  <tr key={c.id} className={styles.clientesRow}>
                    <td data-label="Cliente">
                      <div className={styles.clienteCell}>
                        <div className={styles.avatarCircle}>{c.sigla}</div>
                        <span className={styles.clienteName}>{c.nome}</span>
                      </div>
                    </td>
                    <td data-label="Segmento">
                      <span className={`${styles.segmentoTag} ${segClass}`}>
                        {c.segmento}
                      </span>
                    </td>
                    <td data-label="Lojas">
                      <span className={styles.lojasCount}>{c.lojas.toLocaleString('pt-BR')}</span>
                      <span className={styles.lojasLabel}>lojas</span>
                    </td>
                    <td data-label="Contato" className={styles.textCell}>{c.contato}</td>
                    <td data-label="Telefone" className={styles.textCell}>{c.telefone}</td>
                    <td data-label="Status">
                      <span className={`${styles.statusWrapper} ${sc.bgClass}`}>
                        <span className={`${styles.statusDot} ${sc.dotClass}`} />
                        {c.status}
                      </span>
                    </td>
                    <td data-label="Ações" className={styles.rightAlign}>
                      <div className={styles.rowActions}>
                        <button className={styles.btnIcon} title="Ver chamados"><Building2 size={15} /></button>
                        <button className={styles.btnIcon} title="Mais opções"><MoreVertical size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div className={styles.footer}>
          <span className={styles.footerHint}>
            💡 Arraste a borda do cabeçalho das colunas para redimensionar
          </span>
          <span className={styles.footerCount}>
            Exibindo {filtrados.length} de {clientes.length} clientes
          </span>
        </div>
      </div>
    </>
  );
}
