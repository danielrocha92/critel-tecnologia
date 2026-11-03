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
  if (!normalizedName) return undefined;
  if (clientLogoByName[normalizedName]) return clientLogoByName[normalizedName];

  const matchingName = Object.keys(clientLogoByName)
    .sort((first, second) => second.length - first.length)
    .find((name) => normalizedName.includes(name));
  return matchingName ? clientLogoByName[matchingName] : undefined;
}
