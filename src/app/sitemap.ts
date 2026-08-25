import type { MetadataRoute } from 'next';
import { i18n } from '@/i18n.config';

const baseUrl = 'https://criteltecnologia.com.br';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1.0 },
    { path: 'sobre', changeFrequency: 'monthly' as const, priority: 0.9 },
    { path: 'sobre/certificacoes-e-premios', changeFrequency: 'monthly' as const, priority: 0.85 },
    { path: 'solucoes', changeFrequency: 'weekly' as const, priority: 0.9 },
    { path: 'solucoes/suporte-ti-empresarial', changeFrequency: 'weekly' as const, priority: 0.85 },
    { path: 'solucoes/cabeamento-estruturado', changeFrequency: 'weekly' as const, priority: 0.85 },
    { path: 'solucoes/ativos-de-rede', changeFrequency: 'weekly' as const, priority: 0.85 },
    { path: 'solucoes/seguranca-da-informacao', changeFrequency: 'weekly' as const, priority: 0.85 },
    { path: 'solucoes/tecnologia-predial', changeFrequency: 'weekly' as const, priority: 0.85 },
    { path: 'solucoes/field-services', changeFrequency: 'weekly' as const, priority: 0.85 },
    { path: 'clientes', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: 'contato', changeFrequency: 'monthly' as const, priority: 0.8 },
    { path: 'privacidade', changeFrequency: 'yearly' as const, priority: 0.4 },
    { path: 'termos', changeFrequency: 'yearly' as const, priority: 0.4 },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const route of routes) {
    for (const locale of i18n.locales) {
      const routePath = route.path ? `/${route.path}` : '';
      const url = `${baseUrl}/${locale}${routePath}`;

      const languageAlternates: Record<string, string> = {};
      for (const altLocale of i18n.locales) {
        languageAlternates[altLocale] = `${baseUrl}/${altLocale}${routePath}`;
      }
      languageAlternates['x-default'] = `${baseUrl}/pt${routePath}`;

      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: languageAlternates,
        },
      });
    }
  }

  return sitemapEntries;
}
