'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { User, LogOut, Settings, Shield, Bell, Camera, MapPin } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

export default function PerfilPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const [configs, setConfigs] = useState({
    notificacoes: true,
    camera: true,
    localizacao: true
  });

  const toggleConfig = (key: keyof typeof configs) => {
    setConfigs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data } = await supabase
        .from('perfis')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${lang}/login`);
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando perfil...</div>;
  }

  return (
    <div style={{ padding: '1rem', paddingBottom: '6rem' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#f8fafc' }}>Meu Perfil</h2>
      
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.4)', 
        borderRadius: '16px', 
        padding: '2rem 1rem', 
        textAlign: 'center',
        marginBottom: '2rem',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          margin: '0 auto 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
        }}>
          <User size={40} color="white" />
        </div>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#f8fafc', fontSize: '1.2rem' }}>{profile?.nome || 'Técnico'}</h3>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Shield size={14} /> {profile?.cargo} - {profile?.status}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: '1rem', marginLeft: '0.5rem' }}>Configurações do Dispositivo</h4>
        <div style={{ 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.05)', 
          borderRadius: '16px',
          overflow: 'hidden'
        }}>
          {/* Notificações */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '8px', borderRadius: '8px' }}>
                <Bell size={20} color="#3b82f6" />
              </div>
              <div>
                <p style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 500 }}>Notificações Push</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Novos chamados e alertas</p>
              </div>
            </div>
            <div onClick={() => toggleConfig('notificacoes')} style={{ width: '44px', height: '24px', background: configs.notificacoes ? '#10b981' : '#334155', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
              <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: configs.notificacoes ? '22px' : '2px', transition: '0.3s' }} />
            </div>
          </div>
          
          {/* Câmera */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(168, 85, 247, 0.1)', padding: '8px', borderRadius: '8px' }}>
                <Camera size={20} color="#a855f7" />
              </div>
              <div>
                <p style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 500 }}>Acesso à Câmera</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Para fotos e anexos</p>
              </div>
            </div>
            <div onClick={() => toggleConfig('camera')} style={{ width: '44px', height: '24px', background: configs.camera ? '#10b981' : '#334155', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
              <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: configs.camera ? '22px' : '2px', transition: '0.3s' }} />
            </div>
          </div>

          {/* Localização */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px' }}>
                <MapPin size={20} color="#ef4444" />
              </div>
              <div>
                <p style={{ margin: 0, color: '#f8fafc', fontSize: '1rem', fontWeight: 500 }}>Localização (GPS)</p>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>Auditoria no check-in</p>
              </div>
            </div>
            <div onClick={() => toggleConfig('localizacao')} style={{ width: '44px', height: '24px', background: configs.localizacao ? '#10b981' : '#334155', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.3s' }}>
              <div style={{ width: '20px', height: '20px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: configs.localizacao ? '22px' : '2px', transition: '0.3s' }} />
            </div>
          </div>
        </div>
      </div>

        <button 
          onClick={handleLogout}
          style={{
          width: '100%',
          padding: '16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}>
          <LogOut size={20} />
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
