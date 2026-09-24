import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Critel Tecnologia - Infraestrutura de TI e Segurança',
    short_name: 'Critel Tecnologia',
    description: 'Soluções corporativas em Infraestrutura de TI, Segurança da Informação, Cabeamento Estruturado, Ativos de Rede e Field Services desde 1994.',
    start_url: '/pt',
    display: 'standalone',
    background_color: '#0A0F1D',
    theme_color: '#0052FF',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
