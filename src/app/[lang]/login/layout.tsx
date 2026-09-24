import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Acesso Restrito | Plataforma de Operações - Critel Tecnologia',
  description: 'Faça login para acessar a área restrita, painel de operações e dashboard técnico da Critel Tecnologia.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {children}
    </main>
  );
}
