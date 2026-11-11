'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { ShieldAlert, AlertTriangle, CheckCircle, Ban, Clock } from 'lucide-react';
import SectionPageHeader from '@/components/Dashboard/SectionPageHeader';
import styles from './admin.module.css';

type Perfil = {
  id: string;
  user_id: string;
  email: string;
  nome: string;
  cargo: string;
  status: 'ATIVO' | 'BANIDO' | 'PENDENTE';
};

export default function AdminPage() {
  const [usuarios, setUsuarios] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [perfilLogado, setPerfilLogado] = useState<Perfil | null>(null);
  const [loadingPerfil, setLoadingPerfil] = useState(true);
  
  // Modal State
  const [targetBan, setTargetBan] = useState<Perfil | null>(null);
  const [isBanning, setIsBanning] = useState(false);
  
  const [isApproving, setIsApproving] = useState<string | null>(null);

  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const carregarPerfilLogado = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoadingPerfil(false); return; }
      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setPerfilLogado(data || null);
    } catch (err: unknown) {
      console.error('Erro ao carregar perfil do administrador:', err);
    } finally {
      setLoadingPerfil(false);
    }
  }, [supabase]);

  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('perfis')
        .select('*')
        .order('status', { ascending: false }) // PENDENTE vem primeiro (alfabeticamente: P > B > A)
        .order('nome');

      if (error) throw error;
      setUsuarios(data || []);
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Tabela de usuários não encontrada no banco. Exibindo dados de teste.');
      // Fallback para dados mockados caso a tabela não exista ainda no Supabase
      setUsuarios([
        { id: '4', user_id: 'u4', nome: 'Novo Técnico', email: 'novo@critel.com.br', cargo: 'TECNICO', status: 'PENDENTE' },
        { id: '1', user_id: 'u1', nome: 'João Técnico', email: 'joao@critel.com.br', cargo: 'TECNICO', status: 'ATIVO' },
        { id: '2', user_id: 'u2', nome: 'Maria Admin', email: 'maria@critel.com.br', cargo: 'ADMIN', status: 'ATIVO' },
        { id: '3', user_id: 'u3', nome: 'Carlos Desligado', email: 'carlos@critel.com.br', cargo: 'TECNICO', status: 'BANIDO' }
      ]);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    // As atualizações de estado acontecem após a conclusão das consultas assíncronas.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void carregarPerfilLogado();
    void carregarUsuarios();
  }, [carregarPerfilLogado, carregarUsuarios]);

  const handleApproveUser = async (user: Perfil) => {
    setIsApproving(user.id);
    try {
      const response = await fetch('/api/admin/aprovar-tecnico', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfilId: user.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível aprovar o técnico.');

      setUsuarios(current => 
        current.map(u => u.id === user.id ? { ...u, status: 'ATIVO' } : u)
      );
    } catch (err: unknown) {
      alert(`Erro ao aprovar usuário: ${err instanceof Error ? err.message : 'Erro desconhecido.'}`);
    } finally {
      setIsApproving(null);
    }
  };

  const handlePanicButton = async () => {
    if (!targetBan) return;
    setIsBanning(true);

    try {
      // Tenta chamar a rota da API, se falhar ou não existir, atualiza direto via Supabase Client (útil para o fallback)
      const res = await fetch('/api/admin/panic-button', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetBan.user_id })
      });

      if (!res.ok) {
        console.warn('API route failed, falling back to direct Supabase update');
        const { error } = await supabase.from('perfis').update({ status: 'BANIDO' }).eq('id', targetBan.id);
        if (error) throw error;
      }

      // Atualiza visualmente na tabela local
      setUsuarios(current => 
        current.map(u => u.id === targetBan.id ? { ...u, status: 'BANIDO' } : u)
      );
      
    } catch (err: unknown) {
      alert(`Falha no Desligamento: ${err instanceof Error ? err.message : 'Erro desconhecido.'}`);
    } finally {
      setIsBanning(false);
      setTargetBan(null);
    }
  };

  const role = perfilLogado?.cargo
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase();
  const canApproveUsers = ['ANALISTA', 'ADMIN', 'SUPER_ADMIN'].includes(role || '');
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const pendingUsers = usuarios.filter(u => {
    const cargo = u.cargo
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toUpperCase();
    return u.status === 'PENDENTE' && (role !== 'ANALISTA' || cargo === 'TECNICO');
  });
  const activeUsers = usuarios.filter(u => u.status !== 'PENDENTE');

  const renderTable = (userList: Perfil[], isPendingTable: boolean, canRevoke: boolean) => (
    <table className={styles.userTable}>
      <thead>
        <tr>
          <th>Colaborador</th>
          <th>Cargo</th>
          <th>{isPendingTable ? 'Ação Necessária' : 'Ações de Segurança'}</th>
        </tr>
      </thead>
      <tbody>
        {userList.map((user) => (
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
              {user.status === 'PENDENTE' ? (
                <div className={styles.actionGroup}>
                  <button
                    className={styles.btnApprove}
                    onClick={() => handleApproveUser(user)}
                    disabled={isApproving === user.id}
                  >
                    <CheckCircle size={16} />
                    {isApproving === user.id ? 'Aprovando...' : 'Aprovar Acesso'}
                  </button>
                  {canRevoke && (
                    <button
                      className={styles.btnPanic}
                      onClick={() => setTargetBan(user)}
                      title="Rejeitar Solicitação"
                    >
                      <Ban size={16} />
                    </button>
                  )}
                </div>
              ) : user.status === 'BANIDO' ? (
                <span className={`${styles.badge} ${styles.badgeBanned}`}>
                  <Ban size={12} className={styles.inlineIcon} />
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
  );

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>

        {/* Bloco protegido: apenas SUPER_ADMIN */}
        {loadingPerfil ? (
          <div className={styles.glassCard}>
            <p>Verificando permissões...</p>
          </div>
        ) : !canApproveUsers ? (
          <div className={`${styles.glassCard} ${styles.centerText} ${styles.pad3}`}>
            <ShieldAlert size={48} className={styles.iconRed} />
            <h2 className={styles.headingWhite}>Acesso Restrito</h2>
            <p className={styles.textMuted}>A aprovação de técnicos é restrita a analistas e administradores autorizados.</p>
          </div>
        ) : (
          <>
            <SectionPageHeader
              eyebrow="ADMINISTRAÇÃO"
              title={isSuperAdmin ? 'Governança de Identidade' : 'Aprovação de Técnicos'}
              description={isSuperAdmin
                ? 'Gestão de perfis e controle de acessos à plataforma.'
                : 'Revise e aprove solicitações de acesso ao Portal do Técnico.'}
            />

            {errorMsg && (
              <div className={styles.errorBox}>
                {errorMsg}
              </div>
            )}

            {loading ? (
              <div className={styles.glassCard}>
                <p>Carregando diretório de usuários...</p>
              </div>
            ) : (
              <>
                {pendingUsers.length > 0 && (
                  <div className={`${styles.glassCard} ${styles.borderAmber}`}>
                    <h2 className={styles.headingAmber}>
                      <Clock size={20} /> Aguardando Aprovação ({pendingUsers.length})
                    </h2>
                    {renderTable(pendingUsers, true, isSuperAdmin)}
                  </div>
                )}

                {isSuperAdmin && (
                  <div className={styles.glassCard}>
                    <h2 className={styles.headingWhiteLg}>Diretório de Usuários Ativos</h2>
                    {renderTable(activeUsers, false, true)}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Modal de Confirmação (Botão de Pânico / Rejeitar) */}
      {targetBan && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <AlertTriangle size={48} className={styles.modalIcon} />
            <h2 className={styles.modalTitle}>
              {targetBan.status === 'PENDENTE' ? 'Rejeitar Solicitação' : 'Atenção: Revogação Imediata'}
            </h2>
            <p className={styles.modalDesc}>
              {targetBan.status === 'PENDENTE' 
                ? `Você está rejeitando o acesso de ${targetBan.nome}. A conta será banida e não poderá acessar o sistema.`
                : `Você está prestes a acionar o botão de pânico para ${targetBan.nome}. Isso fará o logout de todas as sessões ativas e banirá a conta indefinidamente.`}
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
                {isBanning ? 'Processando...' : targetBan.status === 'PENDENTE' ? 'Rejeitar Acesso' : 'Sim, Revogar Acesso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
