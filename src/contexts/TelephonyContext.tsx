'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { UserAgent, Registerer, Inviter, SessionState, Invitation } from 'sip.js';

interface TelephonyContextData {
  isRegistered: boolean;
  statusText: string;
  incomingCall: Invitation | null;
  activeCall: Inviter | null;
  makeCall: (targetNumber: string) => void;
  acceptCall: () => void;
  rejectCall: () => void;
  hangupCall: () => void;
}

const TelephonyContext = createContext<TelephonyContextData>({} as TelephonyContextData);

export function TelephonyProvider({ children }: { children: React.ReactNode }) {
  const [userAgent, setUserAgent] = useState<UserAgent | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [statusText, setStatusText] = useState('Offline');
  
  const [incomingCall, setIncomingCall] = useState<Invitation | null>(null);
  const [activeCall, setActiveCall] = useState<Inviter | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Inicializa elemento de áudio oculto para as chamadas
    audioRef.current = new Audio();
    audioRef.current.autoplay = true;

    const initTelephony = async () => {
      try {
        setStatusText('Buscando Credenciais...');
        const res = await fetch('/api/telefonia/credenciais');
        if (!res.ok) throw new Error('Falha ao buscar credenciais');
        
        const config = await res.json();
        
        const uri = UserAgent.makeURI(`sip:${config.ramal}@${config.domain}`);
        if (!uri) throw new Error('Falha ao criar URI SIP');

        setStatusText('Conectando ao Asterisk...');

        // Usando a API atualizada da sip.js
        const ua = new UserAgent({
          uri,
          transportOptions: {
            server: `wss://${config.domain}:8089/ws`,
          },
          authorizationPassword: config.password,
          authorizationUsername: config.ramal,
          delegate: {
            onInvite: (invitation: Invitation) => {
              console.log('Recebendo chamada de:', invitation.remoteIdentity.uri.user);
              setIncomingCall(invitation);

              invitation.stateChange.addListener((newState) => {
                if (newState === SessionState.Terminated) {
                  setIncomingCall(null);
                  setActiveCall(null);
                }
              });
            },
          },
        });

        setUserAgent(ua);

        await ua.start();

        const registerer = new Registerer(ua);
        await registerer.register();
        
        setIsRegistered(true);
        setStatusText(`Ramal ${config.ramal} (Online)`);

      } catch (err) {
        console.error('Telephony Error:', err);
        setStatusText('Erro de Conexão');
      }
    };

    initTelephony();

    return () => {
      if (userAgent) {
        userAgent.stop();
      }
    };
  }, []);

  const makeCall = async (targetNumber: string) => {
    if (!userAgent) return;
    
    const targetURI = UserAgent.makeURI(`sip:${targetNumber}@pabx.critel.com.br`);
    if (!targetURI) return;

    const inviter = new Inviter(userAgent, targetURI);
    
    inviter.stateChange.addListener((newState) => {
      if (newState === SessionState.Established) {
        setupRemoteMedia(inviter);
      } else if (newState === SessionState.Terminated) {
        setActiveCall(null);
      }
    });

    setActiveCall(inviter);
    await inviter.invite();
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    
    incomingCall.stateChange.addListener((newState) => {
      if (newState === SessionState.Established) {
        setupRemoteMedia(incomingCall);
      } else if (newState === SessionState.Terminated) {
        setIncomingCall(null);
        setActiveCall(null);
      }
    });

    await incomingCall.accept();
    setIncomingCall(null);
    setActiveCall(incomingCall as any); // Simplificado para fins do tutorial
  };

  const rejectCall = async () => {
    if (incomingCall) {
      await incomingCall.reject();
      setIncomingCall(null);
    }
  };

  const hangupCall = async () => {
    if (activeCall) {
      await activeCall.bye();
      setActiveCall(null);
    }
  };

  const setupRemoteMedia = (session: any) => {
    const sessionDescriptionHandler = session.sessionDescriptionHandler;
    if (!sessionDescriptionHandler || !sessionDescriptionHandler.peerConnection) return;
    
    const remoteStream = new MediaStream();
    sessionDescriptionHandler.peerConnection.getReceivers().forEach((receiver: any) => {
      if (receiver.track) {
        remoteStream.addTrack(receiver.track);
      }
    });
    
    if (audioRef.current) {
      audioRef.current.srcObject = remoteStream;
      audioRef.current.play().catch(e => console.error("Error playing audio", e));
    }
  };

  return (
    <TelephonyContext.Provider value={{
      isRegistered, statusText, incomingCall, activeCall, 
      makeCall, acceptCall, rejectCall, hangupCall
    }}>
      {children}
    </TelephonyContext.Provider>
  );
}

export const useTelephony = () => useContext(TelephonyContext);
