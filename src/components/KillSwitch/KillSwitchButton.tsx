'use client';

import { useState } from 'react';

export default function KillSwitchButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRevoke = async () => {
    if (!confirm('ATENÇÃO: Tem certeza que deseja revogar os acessos deste usuário instantaneamente?')) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/admin/killswitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });
      
      if (res.ok) {
        setSuccess(true);
        alert('Acesso revogado com sucesso. Todas as sessões foram encerradas.');
      } else {
        alert('Falha ao revogar o acesso.');
      }
    } catch (error) {
      alert('Erro inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleRevoke}
      disabled={loading || success}
      style={{
        backgroundColor: success ? '#28a745' : '#dc3545',
        color: 'white',
        padding: '10px 20px',
        border: 'none',
        borderRadius: '8px',
        cursor: loading || success ? 'not-allowed' : 'pointer',
        fontWeight: 'bold',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}
    >
      {loading ? 'Revogando...' : success ? 'Acessos Revogados' : '🚨 Kill Switch (Revogar Acessos)'}
    </button>
  );
}
