'use client';

import React from 'react';
import { BookOpen, Video, FileText, Search, PlayCircle } from 'lucide-react';

export default function BaseConhecimentoPage() {
  const modulos = [
    { title: 'Treinamento de Onboarding', type: 'Vídeo', duration: '45 min', icon: Video, color: '#ef4444' },
    { title: 'Manual de Procedimentos PDV', type: 'Documento', duration: '12 pág', icon: FileText, color: '#3b82f6' },
    { title: 'Como solicitar Cartão Vexpenses', type: 'Guia Rápido', duration: '5 min', icon: BookOpen, color: '#10b981' },
    { title: 'Troubleshooting de Redes', type: 'Vídeo', duration: '1h 20m', icon: Video, color: '#ef4444' },
    { title: 'Regras de Negócio: Burger King', type: 'Documento', duration: '8 pág', icon: FileText, color: '#3b82f6' },
    { title: 'Acesso ao Milvus IT Management', type: 'Tutorial', duration: '15 min', icon: PlayCircle, color: '#8b5cf6' },
  ];

  return (
    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>Base de Conhecimento</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0' }}>Treinamento do sistema, manuais e guias da equipe</p>
        </div>
      </div>

      <div style={{ 
        background: '#1e293b', padding: '16px', borderRadius: '12px', border: '1px solid #334155',
        display: 'flex', gap: '16px', marginBottom: '2rem'
      }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input 
            type="text" 
            placeholder="Buscar por artigos, tutoriais ou vídeos..." 
            style={{ 
              width: '100%', background: '#0f172a', border: '1px solid #334155', color: '#fff',
              padding: '10px 10px 10px 40px', borderRadius: '8px', outline: 'none'
            }}
          />
        </div>
        <select style={{ background: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '0 16px', borderRadius: '8px', outline: 'none' }}>
          <option>Todas as Categorias</option>
          <option>Treinamentos em Vídeo</option>
          <option>Manuais de Procedimento</option>
          <option>Regras de Franquias</option>
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {modulos.map((modulo, i) => (
          <div key={i} style={{ 
            background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px',
            display: 'flex', flexDirection: 'column', gap: '16px', cursor: 'pointer', transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ background: `${modulo.color}20`, padding: '12px', borderRadius: '12px' }}>
                <modulo.icon size={24} color={modulo.color} />
              </div>
              <span style={{ background: '#0f172a', color: '#94a3b8', padding: '4px 12px', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600 }}>
                {modulo.duration}
              </span>
            </div>
            
            <div>
              <h3 style={{ margin: '0 0 8px 0', color: '#f8fafc', fontSize: '1.1rem', lineHeight: '1.4' }}>{modulo.title}</h3>
              <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Tipo: {modulo.type}</span>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid #334155' }}>
              <button style={{ background: 'transparent', border: 'none', color: '#3b82f6', fontWeight: 500, cursor: 'pointer', fontSize: '0.9rem', padding: 0 }}>
                Acessar Conteúdo &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
