'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTelephony } from '@/contexts/TelephonyContext';
import { Phone, PhoneOff, PhoneCall, X, GripHorizontal } from 'lucide-react';
import styles from './TelephonyWidget.module.css';

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

  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (widgetRef.current) {
      widgetRef.current.style.right = position.x < 0 ? `${Math.abs(position.x)}px` : 'auto';
      widgetRef.current.style.bottom = position.y < 0 ? `${Math.abs(position.y)}px` : 'auto';
      widgetRef.current.style.left = position.x >= 0 ? `${position.x}px` : 'auto';
      widgetRef.current.style.top = position.y >= 0 ? `${position.y}px` : 'auto';
    }
  }, [position]);

  return (
    <div 
      ref={widgetRef}
      className={styles.widgetContainer}
    >
      {/* Indicador Flutuante (Fechado) */}
      {!isOpen && (
        <div className={styles.indicatorWrapper}>
          <div 
            onMouseDown={handleMouseDown}
            className={`${styles.dragHandle} ${isDragging ? styles.dragHandleGrabbing : styles.dragHandleGrab}`}
            title="Arraste para mover"
          >
            <GripHorizontal size={16} />
          </div>
          <button 
            onClick={() => setIsOpen(true)}
            className={`${styles.btnIndicator} ${activeCall ? styles.bgActiveCall : (isRegistered ? styles.bgRegistered : styles.bgUnregistered)}`}
          >
          {activeCall ? <PhoneCall size={20} className={styles.animatePulse} /> : <Phone size={20} />}
          <span>{statusText}</span>
        </button>
        </div>
      )}

      {/* Painel do Softphone Aberto */}
      {isOpen && (
        <div className={styles.panelContainer}>
          {/* Header do Softphone */}
          <div 
            onMouseDown={handleMouseDown}
            className={`${styles.panelHeader} ${isDragging ? styles.dragHandleGrabbing : styles.dragHandleGrab}`}
            title="Arraste para mover"
          >
            <div className={styles.headerTitleWrapper}>
              <div className={`${styles.statusDot} ${isRegistered ? styles.statusRegistered : styles.statusUnregistered}`} />
              <span className={styles.headerTitle}>Asterisk SIP</span>
            </div>
            <button onClick={() => setIsOpen(false)} className={styles.btnClose}>
              <X size={18} />
            </button>
          </div>

          <div className={styles.panelBody}>
            {/* Estado: Chamada Receptiva */}
            {incomingCall && (
              <div className={styles.pulseAnimation}>
                <PhoneCall size={48} color="#f59e0b" className={styles.phoneCallIcon} />
                <h3 className={styles.incomingTitle}>Chamada Recebida</h3>
                <p className={styles.incomingSub}>
                  {incomingCall.remoteIdentity.uri.user}
                </p>
                <div className={styles.actionButtonsWrapper}>
                  <button onClick={rejectCall} className={styles.btnReject}>
                    Recusar
                  </button>
                  <button onClick={acceptCall} className={styles.btnAccept}>
                    Atender
                  </button>
                </div>
              </div>
            )}

            {/* Estado: Em Chamada (Ativa) */}
            {activeCall && !incomingCall && (
              <div>
                <div className={styles.activeCallIconWrapper}>
                  <Phone size={32} color="#10b981" />
                </div>
                <h3 className={styles.incomingTitle}>Em Ligação</h3>
                <p className={styles.timer}>00:00</p>
                
                <button onClick={hangupCall} className={styles.btnHangup}>
                  <PhoneOff size={18} /> Desligar
                </button>
              </div>
            )}

            {/* Estado: Ocioso (Dialer) */}
            {!incomingCall && !activeCall && (
              <div>
                <p className={styles.statusText}>{statusText}</p>
                
                <input 
                  type="text" 
                  value={dialNumber}
                  onChange={(e) => setDialNumber(e.target.value)}
                  placeholder="Número ou Ramal..."
                  className={styles.dialInput}
                />

                <div className={styles.keypadGrid}>
                  {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map((key) => (
                    <button 
                      key={key} 
                      onClick={() => setDialNumber(prev => prev + key)}
                      className={styles.keypadButton}
                    >
                      {key}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => { if(dialNumber) makeCall(dialNumber); }}
                  disabled={!isRegistered || !dialNumber}
                  className={`${styles.btnCall} ${(isRegistered && dialNumber) ? styles.btnCallEnabled : styles.btnCallDisabled}`}
                >
                  <Phone size={18} /> Chamar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
