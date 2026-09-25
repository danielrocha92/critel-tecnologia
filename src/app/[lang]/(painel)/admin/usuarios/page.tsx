'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, Crown, Wrench, Briefcase, DollarSign, LineChart, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import styles from './usuarios.module.css';

type PerfilRow = { id: string; nome: string; email: string; cargo: string; status: string };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<PerfilRow[]>([]);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [novoUsuario, setNovoUsuario] = useState({ nome: '', email: '', senha: '', cargo: 'TECNICO' });
  const [criando, setCriando] = useState(false);

  const supabase = createClient();

  const carregarUsuarios = () => {
    supabase.from('perfis').select('id,nome,email,cargo,status').order('nome').then(({ data }: any) => {
      if (data) setUsuarios(data);
    });
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const handleCriarUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setCriando(true);
    try {
      const res = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoUsuario)
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Erro ao criar usuário');
      alert('Usuário criado com sucesso!');
      setShowModal(false);
      setNovoUsuario({ nome: '', email: '', senha: '', cargo: 'TECNICO' });
      carregarUsuarios();
    } catch (err: any) {
      console.error('Erro ao criar usuário:', err);
      alert('Erro ao criar usuário: ' + err.message);
    } finally {
      setCriando(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Gerenciar Usuários</h1>
          <p className={styles.subtitle}>Administre acessos, cargos e status da equipe</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className={styles.btnNew}
        >
          + Novo Colaborador
        </button>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeaderRow}>
              <th className={styles.th}>Colaborador</th>
              <th className={styles.th}>Cargo Atual</th>
              <th className={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => {
              const cargoIcon = u.cargo === 'SUPER_ADMIN' ? <Crown size={14} className={styles.colorAmber} /> : u.cargo === 'ADMIN' ? <Shield size={14} className={styles.colorBlue} /> : u.cargo === 'COMERCIAL' ? <Briefcase size={14} className={styles.colorEmerald} /> : u.cargo === 'FINANCEIRO' ? <DollarSign size={14} className={styles.colorPurple} /> : u.cargo === 'ANALISTA' ? <LineChart size={14} className={styles.colorCyan} /> : <Wrench size={14} className={styles.colorSlate} />;
              
              const cargoBgClass = u.cargo === 'SUPER_ADMIN' ? styles.bgSuperAdmin : u.cargo === 'ADMIN' ? styles.bgAdmin : u.cargo === 'COMERCIAL' ? styles.bgComercial : u.cargo === 'FINANCEIRO' ? styles.bgFinanceiro : u.cargo === 'ANALISTA' ? styles.bgAnalista : styles.bgTecnico;
              
              const statusDotClass = u.status === 'ATIVO' ? styles.dotAtivo : u.status === 'BANIDO' ? styles.dotBanido : styles.dotPendente;
              const statusColorClass = u.status === 'ATIVO' ? styles.colorGreen : u.status === 'BANIDO' ? styles.colorRed : styles.colorOrange;

              return (
                <tr key={u.id} className={`${styles.tr} ${i === 0 ? styles.trFirst : ''}`}>
                  <td className={styles.td}>
                    <div className={styles.userCol}>
                      <div className={styles.avatar}>
                        {(u.nome || '?').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className={styles.userName}>{u.nome}</div>
                        <div className={styles.userEmail}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div 
                      className={`${styles.cargoBadge} ${cargoBgClass}`} 
                    >
                      {cargoIcon}
                      <select
                        value={u.cargo}
                        disabled={atualizando === u.id || u.cargo === 'SUPER_ADMIN'}
                        onChange={async (e) => {
                          const novoCargo = e.target.value;
                          setAtualizando(u.id);
                          try {
                            const res = await fetch('/api/admin/update-perfil', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: u.id, cargo: novoCargo })
                            });
                            if (!res.ok) throw new Error(await res.text());
                            setUsuarios(prev => prev.map(p => p.id === u.id ? { ...p, cargo: novoCargo } : p));
                          } catch (err: any) {
                            console.error('Erro ao atualizar cargo:', err);
                            alert('Erro ao atualizar cargo: ' + err.message);
                          }
                          setAtualizando(null);
                        }}
                        className={`${styles.cargoSelect} ${u.cargo === 'SUPER_ADMIN' ? styles.cargoSelectDisabled : ''}`}
                      >
                        <option value="TECNICO" className={`${styles.selectOption} ${styles.colorSlate}`}>TÉCNICO</option>
                        <option value="ADMIN" className={`${styles.selectOption} ${styles.colorBlue}`}>ADMIN</option>
                        <option value="SUPER_ADMIN" className={`${styles.selectOption} ${styles.colorAmber}`}>SUPER_ADMIN</option>
                        <option value="COMERCIAL" className={`${styles.selectOption} ${styles.colorEmerald}`}>COMERCIAL</option>
                        <option value="FINANCEIRO" className={`${styles.selectOption} ${styles.colorPurple}`}>FINANCEIRO</option>
                        <option value="ANALISTA" className={`${styles.selectOption} ${styles.colorCyan}`}>ANALISTA</option>
                      </select>
                    </div>
                  </td>
                  <td className={styles.td}>
                    <div className={styles.statusBadge}>
                      <div className={`${styles.statusDot} ${statusDotClass}`}></div>
                      <select
                        value={u.status}
                        disabled={atualizando === u.id || u.cargo === 'SUPER_ADMIN'}
                        onChange={async (e) => {
                          const novoStatus = e.target.value;
                          setAtualizando(u.id);
                          try {
                            const res = await fetch('/api/admin/update-perfil', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ id: u.id, status: novoStatus })
                            });
                            if (!res.ok) throw new Error(await res.text());
                            setUsuarios(prev => prev.map(p => p.id === u.id ? { ...p, status: novoStatus } : p));
                          } catch (err: any) {
                            console.error('Erro ao atualizar status:', err);
                            alert('Erro ao atualizar status: ' + err.message);
                          }
                          setAtualizando(null);
                        }}
                        className={`${styles.statusSelect} ${statusColorClass} ${u.cargo === 'SUPER_ADMIN' ? styles.statusSelectDisabled : ''}`}
                      >
                        <option value="ATIVO" className={`${styles.selectOption} ${styles.colorGreen}`}>ATIVO</option>
                        <option value="PENDENTE" className={`${styles.selectOption} ${styles.colorOrange}`}>PENDENTE</option>
                        <option value="BANIDO" className={`${styles.selectOption} ${styles.colorRed}`}>BANIDO</option>
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button 
              onClick={() => setShowModal(false)}
              className={styles.btnClose}
            >
              <X size={20} />
            </button>
            <h2 className={styles.modalTitle}>Novo Colaborador</h2>
            <form onSubmit={handleCriarUsuario} className={styles.formGroup}>
              <div>
                <label className={styles.formLabel}>Nome</label>
                <input 
                  required
                  type="text" 
                  value={novoUsuario.nome}
                  onChange={e => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                  className={styles.formInput}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Email</label>
                <input 
                  required
                  type="email" 
                  value={novoUsuario.email}
                  onChange={e => setNovoUsuario({...novoUsuario, email: e.target.value})}
                  className={styles.formInput}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Senha Temporária</label>
                <input 
                  required
                  type="password" 
                  value={novoUsuario.senha}
                  onChange={e => setNovoUsuario({...novoUsuario, senha: e.target.value})}
                  className={styles.formInput}
                />
              </div>
              <div>
                <label className={styles.formLabel}>Cargo</label>
                <select 
                  value={novoUsuario.cargo}
                  onChange={e => setNovoUsuario({...novoUsuario, cargo: e.target.value})}
                  className={styles.formInput}
                >
                  <option value="TECNICO">TÉCNICO</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  <option value="COMERCIAL">COMERCIAL</option>
                  <option value="FINANCEIRO">FINANCEIRO</option>
                  <option value="ANALISTA">ANALISTA</option>
                </select>
              </div>
              <button 
                type="submit" 
                disabled={criando}
                className={`${styles.btnSubmit} ${criando ? styles.btnSubmitDisabled : ''}`}
              >
                {criando ? 'Criando...' : 'Adicionar Colaborador'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
