'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, Crown, Wrench, Briefcase, DollarSign, LineChart, X } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

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
    <div style={{ padding: '2rem', flex: 1, maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>Gerenciar Usuários</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Administre acessos, cargos e status da equipe</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          + Novo Colaborador
        </button>
      </div>

      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              <th style={{ padding: '14px 20px', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Colaborador</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cargo Atual</th>
              <th style={{ padding: '14px 20px', textAlign: 'left', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u, i) => {
              const cargoIcon = u.cargo === 'SUPER_ADMIN' ? <Crown size={14} color="#f59e0b" /> : u.cargo === 'ADMIN' ? <Shield size={14} color="#3b82f6" /> : u.cargo === 'COMERCIAL' ? <Briefcase size={14} color="#10b981" /> : u.cargo === 'FINANCEIRO' ? <DollarSign size={14} color="#8b5cf6" /> : u.cargo === 'ANALISTA' ? <LineChart size={14} color="#06b6d4" /> : <Wrench size={14} color="#94a3b8" />;
              const cargoCor = u.cargo === 'SUPER_ADMIN' ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' } : u.cargo === 'ADMIN' ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' } : u.cargo === 'COMERCIAL' ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399' } : u.cargo === 'FINANCEIRO' ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa' } : u.cargo === 'ANALISTA' ? { bg: 'rgba(6,182,212,0.15)', text: '#22d3ee' } : { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
              const statusCor = u.status === 'ATIVO' ? '#10b981' : u.status === 'BANIDO' ? '#ef4444' : '#f59e0b';

              return (
                <tr key={u.id} style={{ borderTop: i > 0 ? '1px solid rgba(51,65,85,0.5)' : 'none' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#e2e8f0', fontSize: '0.85rem', flexShrink: 0 }}>
                        {(u.nome || '?').substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: '0.9rem' }}>{u.nome}</div>
                        <div style={{ color: '#64748b', fontSize: '0.78rem' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px', background: cargoCor.bg, color: cargoCor.text, padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
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
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: 'inherit', 
                          fontWeight: 'inherit',
                          fontSize: 'inherit',
                          cursor: u.cargo === 'SUPER_ADMIN' ? 'not-allowed' : 'pointer',
                          outline: 'none',
                          appearance: 'none',
                          paddingRight: '12px'
                        }}
                      >
                        <option value="TECNICO" style={{color: '#94a3b8', background: '#0f172a'}}>TÉCNICO</option>
                        <option value="ADMIN" style={{color: '#60a5fa', background: '#0f172a'}}>ADMIN</option>
                        <option value="SUPER_ADMIN" style={{color: '#fbbf24', background: '#0f172a'}}>SUPER_ADMIN</option>
                        <option value="COMERCIAL" style={{color: '#34d399', background: '#0f172a'}}>COMERCIAL</option>
                        <option value="FINANCEIRO" style={{color: '#a78bfa', background: '#0f172a'}}>FINANCEIRO</option>
                        <option value="ANALISTA" style={{color: '#22d3ee', background: '#0f172a'}}>ANALISTA</option>
                      </select>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusCor }}></div>
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
                        style={{ 
                          background: 'transparent', 
                          border: 'none', 
                          color: statusCor, 
                          fontSize: '0.85rem', 
                          fontWeight: 600, 
                          cursor: u.cargo === 'SUPER_ADMIN' ? 'not-allowed' : 'pointer',
                          outline: 'none',
                          appearance: 'none',
                          paddingRight: '12px'
                        }}
                      >
                        <option value="ATIVO" style={{color: '#10b981', background: '#0f172a'}}>ATIVO</option>
                        <option value="PENDENTE" style={{color: '#f59e0b', background: '#0f172a'}}>PENDENTE</option>
                        <option value="BANIDO" style={{color: '#ef4444', background: '#0f172a'}}>BANIDO</option>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', width: '100%', maxWidth: '400px', padding: '24px', position: 'relative' }}>
            <button 
              onClick={() => setShowModal(false)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: '0 0 20px 0', color: '#f8fafc' }}>Novo Colaborador</h2>
            <form onSubmit={handleCriarUsuario} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '0.9rem' }}>Nome</label>
                <input 
                  required
                  type="text" 
                  value={novoUsuario.nome}
                  onChange={e => setNovoUsuario({...novoUsuario, nome: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '0.9rem' }}>Email</label>
                <input 
                  required
                  type="email" 
                  value={novoUsuario.email}
                  onChange={e => setNovoUsuario({...novoUsuario, email: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '0.9rem' }}>Senha Temporária</label>
                <input 
                  required
                  type="password" 
                  value={novoUsuario.senha}
                  onChange={e => setNovoUsuario({...novoUsuario, senha: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', color: '#cbd5e1', fontSize: '0.9rem' }}>Cargo</label>
                <select 
                  value={novoUsuario.cargo}
                  onChange={e => setNovoUsuario({...novoUsuario, cargo: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#f8fafc', outline: 'none' }}
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
                style={{ marginTop: '10px', background: '#3b82f6', color: '#fff', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: 600, cursor: criando ? 'not-allowed' : 'pointer', opacity: criando ? 0.7 : 1 }}
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
