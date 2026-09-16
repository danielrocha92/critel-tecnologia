'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTelephony } from '@/contexts/TelephonyContext';
import { Phone, PhoneOff, PhoneCall, X, GripHorizontal } from 'lucide-react';

export default function TelephonyWidget() {
  const { isRegistered, statusText, incomingCall, activeCall, makeCall, acceptCall, rejectCall, hangupCall } = useTelephony();
  const [isOpen, setIsOpen] = useState(false);
  const [dialNumber, setDialNumber] = useState('');

  // Lógica de Draggable
  const [position, setPosition] = useState({ x: -24, y: -24 }); // Inicia no canto inferior direito
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number, startY: number, initialX: number, initialY: number }>({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y
    };
  };

  // Se houver chamada recebida, força o widget a abrir
  if (incomingCall && !isOpen) {
    setIsOpen(true);
  }

  return (
    <div style={{
      position: 'fixed',
      right: position.x < 0 ? Math.abs(position.x) : 'auto',
      bottom: position.y < 0 ? Math.abs(position.y) : 'auto',
      left: position.x >= 0 ? position.x : 'auto',
      top: position.y >= 0 ? position.y : 'auto',
      zIndex: 9999,
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Indicador Flutuante (Fechado) */}
      {!isOpen && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div 
            onMouseDown={handleMouseDown}
            style={{ 
              cursor: isDragging ? 'grabbing' : 'grab', 
              color: '#94a3b8', 
              padding: '4px',
              background: '#1e2230',
              borderRadius: '8px 8px 0 0',
              border: '1px solid #333848',
              borderBottom: 'none',
              marginBottom: '-2px',
              zIndex: 1
            }}
            title="Arraste para mover"
          >
            <GripHorizontal size={16} />
          </div>
          <button 
            onClick={() => setIsOpen(true)}
          style={{
            background: activeCall ? '#10b981' : (isRegistered ? '#3b82f6' : '#64748b'),
            color: '#fff',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            fontWeight: 600
          }}
        >
          {activeCall ? <PhoneCall size={20} className="animate-pulse" /> : <Phone size={20} />}
          <span>{statusText}</span>
        </button>
        </div>
      )}

      {/* Painel do Softphone Aberto */}
      {isOpen && (
        <div style={{
          background: '#1e2230',
          border: '1px solid #333848',
          borderRadius: '16px',
          width: '280px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header do Softphone */}
          <div 
            onMouseDown={handleMouseDown}
            style={{ 
              background: '#252936', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333848',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
            title="Arraste para mover"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isRegistered ? '#10b981' : '#ef4444' }} />
              <span style={{ color: '#fff', fontSize: '0.85rem', fontWeight: 600 }}>Asterisk SIP</span>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '20px', textAlign: 'center' }}>
            {/* Estado: Chamada Receptiva */}
            {incomingCall && (
              <div style={{ animation: 'pulse 1s infinite' }}>
                <PhoneCall size={48} color="#f59e0b" style={{ margin: '0 auto 12px' }} />
                <h3 style={{ margin: '0 0 4px', color: '#fff' }}>Chamada Recebida</h3>
                <p style={{ margin: '0 0 20px', color: '#94a3b8', fontSize: '0.85rem' }}>
                  {incomingCall.remoteIdentity.uri.user}
                </p>
                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <button onClick={rejectCall} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Recusar
                  </button>
                  <button onClick={acceptCall} style={{ background: '#10b981', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Atender
                  </button>
                </div>
              </div>
            )}

            {/* Estado: Em Chamada (Ativa) */}
            {activeCall && !incomingCall && (
              <div>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <Phone size={32} color="#10b981" />
                </div>
                <h3 style={{ margin: '0 0 4px', color: '#fff' }}>Em Ligação</h3>
                <p style={{ margin: '0 0 20px', color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>00:00</p>
                
                <button onClick={hangupCall} style={{ background: '#ef4444', color: '#fff', border: 'none', width: '100%', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <PhoneOff size={18} /> Desligar
                </button>
              </div>
            )}

            {/* Estado: Ocioso (Dialer) */}
            {!incomingCall && !activeCall && (
              <div>
                <p style={{ margin: '0 0 16px', color: '#94a3b8', fontSize: '0.85rem' }}>{statusText}</p>
                
                <input 
                  type="text" 
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Número ou Ramal..."
                  style={{
                    width: '100%',
                    background: '#1a1e29',
                    border: '1px solid #333848',
                    color: '#fff',
                    padding: '12px',
                    borderRadius: '8px',
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    letterSpacing: '1px',
                    marginBottom: '16px'
                  }}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
                  {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((key) => (
                    <button 
                      key={key} 
                      onClick={() => setDialNumber(prev => prev + key)}
                      style={{
                        background: '#252936',
                        border: '1px solid #333848',
                        color: '#cbd5e1',
                        padding: '12px',
                        borderRadius: '8px',
                        fontSize: '1.2rem',
                        cursor: 'pointer'
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => { if(dialNumber) makeCall(dialNumber); }}
                  disabled={!isRegistered || !dialNumber}
                  style={{ 
                    background: isRegistered && dialNumber ? '#10b981' : '#3f475e', 
                    color: '#fff', 
                    border: 'none', 
                    width: '100%', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    cursor: isRegistered && dialNumber ? 'pointer' : 'not-allowed', 
                    fontWeight: 'bold', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    gap: '8px' 
                  }}
                >
                  <Phone size={18} /> Chamar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}} />
    </div>
  );
}
