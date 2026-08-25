import React from 'react';

interface JsonLdProps {
  data: Record<string, any>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Corporation',
    name: 'Critel Tecnologia',
    alternateName: 'Critel',
    url: 'https://criteltecnologia.com.br',
    logo: 'https://criteltecnologia.com.br/400PngdpiLogoCropped.png',
    image: 'https://criteltecnologia.com.br/400PngdpiLogoCropped.png',
    description:
      'Soluções integradas de TI, segurança da informação, ativos de rede, cabeamento estruturado, tecnologia predial e field services desde 1994.',
    foundingDate: '1994',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'R. Homero Vaz do Amaral, 35',
      addressLocality: 'São Paulo',
      addressRegion: 'SP',
      addressCountry: 'BR',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+55-11-3136-2592',
        contactType: 'sales',
        email: 'comercial@criteltecnologia.com.br',
        availableLanguage: ['Portuguese', 'English', 'Spanish'],
      },
    ],
    sameAs: [
      'https://www.linkedin.com/in/critel-tecnologia-3802a2363/',
      'https://www.instagram.com/criteltecnologia/',
      'https://www.facebook.com/criteltecnologia',
    ],
    areaServed: {
      '@type': 'Country',
      name: 'Brazil',
    },
  };
}

export function getWebSiteSchema(lang: string = 'pt') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Critel Tecnologia',
    url: `https://criteltecnologia.com.br/${lang}`,
    inLanguage: lang === 'pt' ? 'pt-BR' : lang === 'en' ? 'en-US' : 'es-ES',
    publisher: {
      '@type': 'Corporation',
      name: 'Critel Tecnologia',
      url: 'https://criteltecnologia.com.br',
    },
  };
}

export function getBreadcrumbSchema(
  items: Array<{ name: string; url: string }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url.startsWith('http')
        ? item.url
        : `https://criteltecnologia.com.br${item.url}`,
    })),
  };
}

export function getServiceSchema({
  name,
  description,
  url,
  image,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: name,
    name: name,
    description: description,
    provider: {
      '@type': 'Corporation',
      name: 'Critel Tecnologia',
      url: 'https://criteltecnologia.com.br',
    },
    url: url.startsWith('http') ? url : `https://criteltecnologia.com.br${url}`,
    ...(image
      ? {
          image: image.startsWith('http')
            ? image
            : `https://criteltecnologia.com.br${image}`,
        }
      : {}),
    areaServed: {
      '@type': 'Country',
      name: 'Brazil',
    },
  };
}
