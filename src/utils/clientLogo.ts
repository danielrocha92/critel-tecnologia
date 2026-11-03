const clientLogoByName: Record<string, string> = {
  'bacio di latte': '/bacio-di-latte-dark.svg',
  ofner: '/ofner.svg',
  kfc: '/kfc.svg',
  'kfc brasil': '/kfc.svg',
  'pizza hut': '/pizza-hut-dark.svg',
  bradesco: '/bradesco.svg',
  'sonda it': '/sonda.svg',
};

export function getClientLogo(clientName?: string | null) {
  const normalizedName = clientName?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase();
  return normalizedName ? clientLogoByName[normalizedName] : undefined;
}
