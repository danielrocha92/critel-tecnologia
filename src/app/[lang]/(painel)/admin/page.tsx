'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ShieldAlert, AlertTriangle, CheckCircle, Ban } from 'lucide-react';
import styles from './admin.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

type Perfil = {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  cargo: string;
  status: 'ATIVO' | 'BANIDO';
};

export default function AdminPage() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Modal State
  const [targetBan, setTargetBan] = useState<Perfil | null>(null);
  const [isBanning, setIsBanning] = useState(false);

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const carregarUsuarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Tabela de usuários não encontrada no banco. Exibindo dados de teste.');
      // Fallback para dados mockados caso a tabela não exista ainda no Supabase
      setUsuarios([
        { id: '1', user_id: 'u1', nome: 'João Técnico', email: 'joao@critel.com.br', cargo: 'TÉCNICO', status: 'ATIVO' },
        { id: '2', user_id: 'u2', nome: 'Maria Admin', email: 'maria@critel.com.br', cargo: 'ADMIN', status: 'ATIVO' },
        { id: '3', user_id: 'u3', nome: 'Carlos Desligado', email: 'carlos@critel.com.br', cargo: 'TÉCNICO', status: 'BANIDO' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePanicButton = async () => {
    if (!targetBan) return;
    setIsBanning(true);

    try {
      const res = await fetch('/api/admin/panic-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetBan.user_id })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro interno no servidor');

      // Atualiza visualmente na tabela local
      setUsuarios(current => 
        current.map(u => u.id === targetBan.id ? { ...u, status: 'BANIDO' } : u)
      );
      
      // Update DB to reflect visual state (Mock for UX)
      await supabase.from('perfis').update({ status: 'BANIDO' }).eq('id', targetBan.id);
      
    } catch (err: any) {
      alert(`Falha no Desligamento: ${err.message}`);
    } finally {
      setIsBanning(false);
      setTargetBan(null);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <div className={styles.header}>
          <h1 className={styles.title}>Governança de Identidade</h1>
          <p className={styles.subtitle}>Gestão de perfis e revogação imediata (Desligamento em Cadeia).</p>
        </div>

        {errorMsg && (
          <div style={{ color: '#fca5a5', padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '8px' }}>
            {errorMsg}
          </div>
        )}

        <div className={styles.glassCard}>
          {loading ? (
            <p>Carregando diretório de usuários...</p>
          ) : (
            <table className={styles.userTable}>
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Cargo</th>
                  <th>Ações de Segurança</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((user) => (
                  <tr key={user.id} className={styles.userRow}>
                    <td>
                      <div className={styles.userInfo}>
                        <div className={styles.avatar}>
                          {user.nome ? user.nome.substring(0, 2).toUpperCase() : 'US'}
                        </div>
                        <div>
                          <span className={styles.userName}>{user.nome || 'Usuário'}</span>
                          <span className={styles.userEmail}>{user.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.badge} ${user.cargo === 'ADMIN' ? styles.badgeAdmin : styles.badgeAnalista}`}>
                        {user.cargo}
                      </span>
                    </td>
                    <td>
                      {user.status === 'BANIDO' ? (
                        <span className={`${styles.badge} ${styles.badgeBanned}`}>
                          <Ban size={12} style={{ display: 'inline', marginRight: 4 }} />
                          Acesso Revogado
                        </span>
                      ) : (
                        <button 
                          className={styles.btnPanic} 
                          onClick={() => setTargetBan(user)}
                        >
                          <ShieldAlert size={16} />
                          Botão de Pânico
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal de Confirmação (Botão de Pânico) */}
      {targetBan && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <AlertTriangle size={48} className={styles.modalIcon} />
            <h2 className={styles.modalTitle}>Atenção: Revogação Imediata</h2>
            <p className={styles.modalDesc}>
              Você está prestes a acionar o botão de pânico para <strong>{targetBan.nome}</strong>.<br/><br/>
              Isso fará o logout de todas as sessões ativas (Intranet, Zendesk, Stoq) e banirá a conta indefinidamente. Esta ação é severa e não pode ser desfeita facilmente.
            </p>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.btnCancel} 
                onClick={() => !isBanning && setTargetBan(null)}
                disabled={isBanning}
              >
                Cancelar
              </button>
              <button 
                className={styles.btnConfirm} 
                onClick={handlePanicButton}
                disabled={isBanning}
              >
                {isBanning ? 'Revogando...' : 'Sim, Revogar Acesso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
