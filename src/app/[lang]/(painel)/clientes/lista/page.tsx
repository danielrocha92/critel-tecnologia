'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Search, Plus, Building2, Phone, Mail, MoreVertical, ChevronDown, Filter } from 'lucide-react';
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

// Larguras iniciais de cada coluna (em px). Mínimo de 60px.
const COL_MIN = 60;
const COL_KEYS = ['cliente', 'segmento', 'lojas', 'contato', 'telefone', 'status', 'acoes'] as const;
type ColKey = typeof COL_KEYS[number];
const INITIAL_WIDTHS: Record<ColKey, number> = {
  cliente:  220,
  segmento: 130,
  lojas:    100,
  contato:  230,
  telefone: 140,
  status:   140,
  acoes:    80,
};

export default function ClientesPage() {
  const [busca,       setBusca]       = useState('');
  const [filtroSeg,   setFiltroSeg]   = useState('Todos');
  const [filtroStatus,setFiltroStatus]= useState('Todos');
  const [colWidths,   setColWidths]   = useState<Record<ColKey, number>>(INITIAL_WIDTHS);

  // Ref para guardar estado do drag sem re-render
  const dragging = useRef<{ col: ColKey; startX: number; startW: number } | null>(null);

  const onMouseDown = useCallback((col: ColKey, e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = { col, startX: e.clientX, startW: colWidths[col] };

    const onMove = (me: MouseEvent) => {
      if (!dragging.current) return;
      const delta = me.clientX - dragging.current.startX;
      const newW  = Math.max(COL_MIN, dragging.current.startW + delta);
      setColWidths(prev => ({ ...prev, [dragging.current!.col]: newW }));
    };

    const onUp = () => {
      dragging.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, [colWidths]);

  const filtrados = clientes.filter(c => {
    const matchBusca  = !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.contato.toLowerCase().includes(busca.toLowerCase());
    const matchSeg    = filtroSeg    === 'Todos' || c.segmento === filtroSeg;
    const matchStatus = filtroStatus === 'Todos' || c.status   === filtroStatus;
    return matchBusca && matchSeg && matchStatus;
  });

  // Cabeçalho com alça de resize
  const Th = ({
    col, children, align
  }: {
    col: ColKey;
    children: React.ReactNode;
    align?: 'right';
  }) => (
    <th 
      className={`${styles.thContainer} ${align === 'right' ? styles.rightAlign : styles.alignLeft}`}
      style={{
        width: colWidths[col],
        minWidth: COL_MIN,
        maxWidth: colWidths[col],
      }}>
      {children}
      {/* Alça de resize — aparece como linha vertical na borda direita */}
      {col !== 'acoes' && (
        <span
          onMouseDown={e => onMouseDown(col, e)}
          className={styles.resizeHandle}
          title="Arraste para redimensionar"
        >
          <span className={styles.resizeLine} />
        </span>
      )}
    </th>
  );

  return (
    <>
      <div className={styles.pageWrapper}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.headerTitle}>
              Clientes
            </h1>
            <p className={styles.headerDesc}>
              {filtrados.length} empresa{filtrados.length !== 1 ? 's' : ''} cadastrada{filtrados.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className={styles.btnPrimary}>
            <Plus size={16} /> Novo Cliente
          </button>
        </div>

        {/* Filtros */}
        <div className={styles.filtersContainer}>
          <Filter size={15} color="#64748b" className={styles.filterIcon} />

          <div className={styles.inputWrapper}>
            <Search size={15} color="#64748b" className={styles.searchIcon} />
            <input className={styles.critelInput} type="text" placeholder="Buscar por nome ou e-mail..."
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>

          <div className={styles.selectWrapper}>
            <select className={styles.critelSelect} value={filtroSeg} onChange={e => setFiltroSeg(e.target.value)}>
              <option value="Todos">Todos os Segmentos</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Fast Food">Fast Food</option>
              <option value="Varejo">Varejo</option>
            </select>
            </select>
            <ChevronDown size={14} color="#64748b" className={styles.selectArrow} />
          </div>

          <div className={styles.selectWrapper}>
            <select className={styles.critelSelect} value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="Todos">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Em Implantação">Em Implantação</option>
              <option value="Inativo">Inativo</option>
            </select>
            <ChevronDown size={14} color="#64748b" className={styles.selectArrow} />
          </div>

          {/* Botão para resetar larguras */}
          <button
            onClick={() => setColWidths(INITIAL_WIDTHS)}
            className={styles.btnReset}
            title="Restaurar larguras padrão"
          >
            ↺ Resetar
          </button>
        </div>

        {/* Tabela com overflow horizontal */}
        <div className={styles.tableContainer}>
          <table className={styles.clientesTable}>
            <colgroup>
              {COL_KEYS.map(col => (
                <col key={col} style={{ width: colWidths[col] }} />
              ))}
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
                    <td>
                      <div className={styles.clienteCell}>
                        <div className={styles.avatarCircle}>{c.sigla}</div>
                        <span className={styles.clienteName}>{c.nome}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.segmentoTag} ${segClass}`}>
                        {c.segmento}
                      </span>
                    </td>
                    <td>
                      <span className={styles.lojasCount}>{c.lojas.toLocaleString('pt-BR')}</span>
                      <span className={styles.lojasLabel}>lojas</span>
                    </td>
                    <td className={styles.textCell}>{c.contato}</td>
                    <td className={styles.textCell}>{c.telefone}</td>
                    <td>
                      <span className={`${styles.statusWrapper} ${sc.bgClass}`}>
                        <span className={`${styles.statusDot} ${sc.dotClass}`} />
                        {c.status}
                      </span>
                    </td>
                    <td className={styles.rightAlign}>
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
