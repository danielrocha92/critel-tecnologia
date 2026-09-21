'use client';

import React, { useState, useEffect } from 'react';
import { Users, Shield, Crown, Wrench } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

type PerfilRow = { id: string; nome: string; email: string; cargo: string; status: string };

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<PerfilRow[]>([]);
  const [atualizando, setAtualizando] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.from('perfis').select('id,nome,email,cargo,status').order('nome').then(({ data }: any) => {
      if (data) setUsuarios(data);
    });
  }, []);

  return (
    <div style={{ padding: '2rem', flex: 1, maxWidth: '1000px' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>Gerenciar Usuários</h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Administre acessos, cargos e status da equipe</p>
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
              const cargoIcon = u.cargo === 'SUPER_ADMIN' ? <Crown size={14} color="#f59e0b" /> : u.cargo === 'ADMIN' ? <Shield size={14} color="#3b82f6" /> : <Wrench size={14} color="#94a3b8" />;
              const cargoCor = u.cargo === 'SUPER_ADMIN' ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24' } : u.cargo === 'ADMIN' ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa' } : { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8' };
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
    </div>
  );
}
