'use client';

import { Bell, User } from 'lucide-react';

export default function Topbar() {
  return (
    <header style={{
      height: '70px',
      background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ flex: 1 }}>
        {/* Espaço para Search bar futuramente se necessário */}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1' }}>
          <Bell size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <div style={{
            width: '35px',
            height: '35px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #00d2ff 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 2px 10px rgba(0, 210, 255, 0.3)'
          }}>
            <User size={18} />
          </div>
          <span style={{ fontWeight: '500', fontSize: '0.9rem', color: '#f8fafc' }}>Minha Conta</span>
        </div>
      </div>
    </header>
  );
}
