'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Search, Plus, Building2, Phone, Mail, MoreVertical, ChevronDown, Filter } from 'lucide-react';

const clientes = [
  { id: 1, nome: 'Bacio di Latte', sigla: 'BL', segmento: 'Alimentação', lojas: 142,  contato: 'contato@baciodilatte.com.br',   telefone: '(11) 3000-0000', status: 'Ativo' },
  { id: 2, nome: 'Ofner',          sigla: 'OF', segmento: 'Alimentação', lojas: 28,   contato: 'suporte@ofner.com.br',          telefone: '(11) 3111-1111', status: 'Ativo' },
  { id: 3, nome: 'KFC Brasil',     sigla: 'KF', segmento: 'Fast Food',   lojas: 95,   contato: 'ti@kfcbrasil.com.br',           telefone: '(11) 3222-2222', status: 'Ativo' },
  { id: 4, nome: 'Burger King',    sigla: 'BK', segmento: 'Fast Food',   lojas: 850,  contato: 'suporte@burgerking.com.br',     telefone: '(11) 3333-3333', status: 'Ativo' },
  { id: 5, nome: 'Pizza Hut',      sigla: 'PH', segmento: 'Fast Food',   lojas: 200,  contato: 'infra@pizzahut.com.br',         telefone: '(11) 3444-4444', status: 'Em Implantação' },
];

const statusConfig: Record<string, { bg: string; color: string; dot: string }> = {
  'Ativo':          { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', dot: '#10b981' },
  'Em Implantação': { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', dot: '#f59e0b' },
  'Inativo':        { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', dot: '#ef4444' },
};

const segmentoColors: Record<string, string> = {
  'Alimentação': '#a78bfa',
  'Fast Food':   '#38bdf8',
  'Varejo':      '#fb923c',
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
    <th style={{
      width: colWidths[col],
      minWidth: COL_MIN,
      maxWidth: colWidths[col],
      position: 'relative',
      padding: '10px 16px',
      textAlign: align === 'right' ? 'right' : 'left',
      fontSize: '0.73rem',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
      color: '#64748b',
      background: '#1a1d27',
      borderBottom: '1px solid #1e2436',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      userSelect: 'none',
    }}>
      {children}
      {/* Alça de resize — aparece como linha vertical na borda direita */}
      {col !== 'acoes' && (
        <span
          onMouseDown={e => onMouseDown(col, e)}
          style={{
            position: 'absolute',
            top: 0, right: 0,
            width: '5px',
            height: '100%',
            cursor: 'col-resize',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Arraste para redimensionar"
        >
          <span style={{
            width: '1px',
            height: '60%',
            background: '#334155',
            borderRadius: '1px',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#8b2cff')}
          onMouseLeave={e => (e.currentTarget.style.background = '#334155')}
          />
        </span>
      )}
    </th>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .clientes-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .clientes-table td {
          padding: 13px 16px;
          font-size: 0.875rem;
          color: #cbd5e1;
          border-bottom: 1px solid rgba(30,36,54,0.8);
          vertical-align: middle;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .clientes-row { transition: background 0.15s; }
        .clientes-row:hover td { background: rgba(139,44,255,0.04); }
        .clientes-row:hover .row-actions { opacity: 1; }
        .row-actions { opacity: 0; transition: opacity 0.15s; }
        .critel-input {
          background: #1a1d27; border: 1px solid #1e2436; color: #e2e8f0;
          padding: 9px 12px 9px 38px; border-radius: 6px; outline: none;
          font-size: 0.875rem; width: 100%; transition: border-color 0.2s; font-family: inherit;
        }
        .critel-input:focus { border-color: #8b2cff; }
        .critel-select {
          background: #1a1d27; border: 1px solid #1e2436; color: #94a3b8;
          padding: 9px 32px 9px 12px; border-radius: 6px; outline: none; font-size: 0.875rem;
          cursor: pointer; font-family: inherit; appearance: none;
        }
        .critel-select:focus { border-color: #8b2cff; }
        .btn-primary {
          background: #8b2cff; color: #fff; border: none;
          padding: 9px 18px; border-radius: 6px; cursor: pointer; font-weight: 600;
          font-size: 0.875rem; display: flex; align-items: center; gap: 7px;
          transition: background 0.2s; font-family: inherit; white-space: nowrap;
        }
        .btn-primary:hover { background: #7c22e8; }
        .btn-icon {
          background: transparent; border: none; color: #64748b;
          cursor: pointer; padding: 4px; border-radius: 4px; transition: color 0.15s;
          display: flex; align-items: center;
        }
        .btn-icon:hover { color: #e2e8f0; background: rgba(255,255,255,0.06); }
        .avatar-circle {
          width: 34px; height: 34px; border-radius: 8px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.8rem;
          background: linear-gradient(135deg,#8b2cff22,#8b2cff44);
          color: #c084fc; border: 1px solid #8b2cff33;
        }
        /* Tooltip do resize */
        .resize-hint {
          position: fixed; bottom: 12px; right: 12px; z-index: 999;
          background: #1a1d27; border: 1px solid #334155; border-radius: 6px;
          padding: 6px 12px; font-size: 0.75rem; color: #64748b;
          pointer-events: none;
        }
      `}} />

      <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
              Clientes
            </h1>
            <p style={{ color: '#475569', margin: '3px 0 0', fontSize: '0.85rem' }}>
              {filtrados.length} empresa{filtrados.length !== 1 ? 's' : ''} cadastrada{filtrados.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className="btn-primary">
            <Plus size={16} /> Novo Cliente
          </button>
        </div>

        {/* Filtros */}
        <div style={{
          background: '#181b24', border: '1px solid #1e2436', borderRadius: '8px',
          padding: '12px 16px', display: 'flex', gap: '10px', marginBottom: '16px', alignItems: 'center'
        }}>
          <Filter size={15} color="#64748b" style={{ flexShrink: 0 }} />

          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)' }} />
            <input className="critel-input" type="text" placeholder="Buscar por nome ou e-mail..."
              value={busca} onChange={e => setBusca(e.target.value)} />
          </div>

          <div style={{ position: 'relative' }}>
            <select className="critel-select" value={filtroSeg} onChange={e => setFiltroSeg(e.target.value)}>
              <option value="Todos">Todos os Segmentos</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Fast Food">Fast Food</option>
              <option value="Varejo">Varejo</option>
            </select>
            <ChevronDown size={14} color="#64748b" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          <div style={{ position: 'relative' }}>
            <select className="critel-select" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
              <option value="Todos">Todos os Status</option>
              <option value="Ativo">Ativo</option>
              <option value="Em Implantação">Em Implantação</option>
              <option value="Inativo">Inativo</option>
            </select>
            <ChevronDown size={14} color="#64748b" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>

          {/* Botão para resetar larguras */}
          <button
            onClick={() => setColWidths(INITIAL_WIDTHS)}
            style={{ background: 'transparent', border: '1px solid #1e2436', color: '#475569', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', whiteSpace: 'nowrap', fontFamily: 'inherit' }}
            title="Restaurar larguras padrão"
          >
            ↺ Resetar
          </button>
        </div>

        {/* Tabela com overflow horizontal */}
        <div style={{ background: '#181b24', border: '1px solid #1e2436', borderRadius: '8px', overflow: 'auto', flex: 1 }}>
          <table className="clientes-table">
            <colgroup>
              {COL_KEYS.map(col => (
                <col key={col} style={{ width: colWidths[col] }} />
              ))}
            </colgroup>
            <thead>
              <tr>
                <Th col="cliente">Cliente</Th>
                <Th col="segmento">Segmento</Th>
                <Th col="lojas"><Building2 size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />Lojas</Th>
                <Th col="contato"><Mail size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />Contato</Th>
                <Th col="telefone"><Phone size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />Telefone</Th>
                <Th col="status">Status</Th>
                <Th col="acoes" align="right">Ações</Th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#475569' }}>
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              ) : filtrados.map(c => {
                const sc       = statusConfig[c.status] ?? statusConfig['Inativo'];
                const segColor = segmentoColors[c.segmento] ?? '#94a3b8';

                return (
                  <tr key={c.id} className="clientes-row">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar-circle">{c.sigla}</div>
                        <span style={{ color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.nome}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: `${segColor}18`, color: segColor, padding: '3px 10px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                        {c.segmento}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{c.lojas.toLocaleString('pt-BR')}</span>
                      <span style={{ color: '#475569', fontSize: '0.78rem', marginLeft: 4 }}>lojas</span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{c.contato}</td>
                    <td style={{ color: '#64748b', fontSize: '0.82rem' }}>{c.telefone}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: sc.bg, color: sc.color, padding: '3px 10px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 600 }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                        {c.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="row-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                        <button className="btn-icon" title="Ver chamados"><Building2 size={15} /></button>
                        <button className="btn-icon" title="Mais opções"><MoreVertical size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé */}
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#334155', fontSize: '0.75rem' }}>
            💡 Arraste a borda do cabeçalho das colunas para redimensionar
          </span>
          <span style={{ color: '#334155', fontSize: '0.78rem' }}>
            Exibindo {filtrados.length} de {clientes.length} clientes
          </span>
        </div>
      </div>
    </>
  );
}
