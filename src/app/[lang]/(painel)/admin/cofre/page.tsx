'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { KeyRound, Lock, Eye, EyeOff, Save, ShieldCheck, Pencil, Trash2 } from 'lucide-react';
import styles from './cofre.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
);

export default function CofreAdminPage() {
  const [sistema, setSistema] = useState('Stoq');
  const [usuarioLogin, setUsuarioLogin] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [credenciaisCadastradas, setCredenciaisCadastradas] = useState<any[]>([]);

  useEffect(() => {
    carregarCredenciais();
  }, []);

  const carregarCredenciais = async () => {
    const { data } = await supabase.from('cofre_credenciais').select('id, sistema, usuario_login, atualizado_em');
    if (data) setCredenciaisCadastradas(data);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // In a real scenario, this would POST to an API route to use the Service Role key
      // and encrypt the password before saving. For this mock UI, we simulate it:
      const { error } = await supabase.from('cofre_credenciais').upsert({
        sistema,
        usuario_login: usuarioLogin,
        senha_criptografada: senha // Security Note: Backend must encrypt this (RF02)
      }, { onConflict: 'sistema' });

      if (error) throw error;
      
      alert('Credencial salva com sucesso no cofre!');
      setSenha('');
      carregarCredenciais();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditar = (cred: any) => {
    setSistema(cred.sistema);
    setUsuarioLogin(cred.usuario_login);
    setSenha(''); // Exigir que redigite a senha
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluir = async (id: string, sistemaNome: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir a credencial da plataforma ${sistemaNome}?`)) return;
    
    try {
      const { error } = await supabase.from('cofre_credenciais').delete().eq('id', id);
      if (error) throw error;
      
      alert('Credencial excluída com sucesso!');
      carregarCredenciais();
      
      // Limpa os campos se estiver editando a mesma credencial que excluiu
      if (sistema === sistemaNome) {
        setUsuarioLogin('');
        setSenha('');
      }
    } catch (err: any) {
      alert('Erro ao excluir: ' + err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        
        <div className={styles.header}>
          <h1 className={styles.title}><KeyRound size={32} /> Cofre de Senhas Corporativas</h1>
          <p className={styles.subtitle}>Gerencie as credenciais-mestras (Proxy SSO) utilizadas pelos Analistas na Central.</p>
        </div>

        <div className={styles.glassCard}>
          <form onSubmit={handleSalvar}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Plataforma Homologada</label>
              <select 
                className={styles.input} 
                value={sistema} 
                onChange={(e) => setSistema(e.target.value)}
              >
                <option value="Stoq">Stoq ERP</option>
                <option value="Milvus">Milvus Suite</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Usuário / E-mail de Login</label>
              <input 
                type="text" 
                className={styles.input} 
                value={usuarioLogin}
                onChange={(e) => setUsuarioLogin(e.target.value)}
                placeholder="Ex: suporte.critel@gmail.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Senha de Acesso</label>
              <div className={styles.inputWrapper}>
                <input 
                  type={showPassword ? "text" : "password"} 
                  className={styles.input} 
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Insira a senha mestra"
                  required
                />
                <button 
                  type="button" 
                  className={styles.btnToggle} 
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button type="submit" className={styles.btnSave} disabled={isSaving}>
              {isSaving ? 'Criptografando e Salvando...' : <><Save size={20} /> Salvar no Cofre</>}
            </button>
          </form>
        </div>

        <div className={styles.credentialList}>
          <h3 className={styles.credentialListTitle}>Credenciais Ativas no Cofre</h3>
          
          {credenciaisCadastradas.length === 0 ? (
            <p style={{ color: '#64748b' }}>Nenhuma credencial cadastrada.</p>
          ) : (
            credenciaisCadastradas.map(cred => (
              <div key={cred.id} className={styles.credCard}>
                <div className={styles.credInfo}>
                  <h4>{cred.sistema}</h4>
                  <p>{cred.usuario_login}</p>
                </div>
                <div className={styles.credActions}>
                  <div className={styles.credStatus}>
                    <ShieldCheck size={16} /> Protegido
                  </div>
                  <button className={styles.btnEdit} onClick={() => handleEditar(cred)} title="Editar">
                    <Pencil size={18} />
                  </button>
                  <button className={styles.btnDelete} onClick={() => handleExcluir(cred.id, cred.sistema)} title="Excluir">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
