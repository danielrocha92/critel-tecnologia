function decodeHtmlEntities(value: string) {
  return value
    .replace(/&#(x[\da-f]+|\d+);?/gi, (_, entity: string) => {
      const codePoint = entity[0].toLowerCase() === 'x'
        ? Number.parseInt(entity.slice(1), 16)
        : Number.parseInt(entity, 10);
      return codePoint <= 0x10ffff ? String.fromCodePoint(codePoint) : '';
    })
    .replace(/&nbsp;?/gi, ' ')
    .replace(/&lt;?/gi, '<')
    .replace(/&gt;?/gi, '>')
    .replace(/&quot;?/gi, '"')
    .replace(/&apos;?/gi, "'")
    .replace(/&amp;?/gi, '&');
}

export function formatTicketDescription(description: string | null | undefined) {
  if (!description) return { text: '', address: '' };

  const text = decodeHtmlEntities(description)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(?:div|p|li|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/\r/g, '')
    .split('\n')
    .map(line => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean);

  let address = '';
  const descriptionLines = text.filter(line => {
    const match = line.match(/Endereço\s+da\s+Loja\s*:\s*(.*)/i);
    if (!match) return true;
    address = match[1].trim();
    return false;
  });

  return { text: descriptionLines.join('\n'), address };
}

export function getTicketAddress(ticket: {
  endereco?: string | null;
  descricao?: string | null;
}) {
  const address = ticket.endereco?.trim();
  if (address && !/^(?:endereço\s+)?não informado$/i.test(address) && address !== '-') {
    return address;
  }

  return formatTicketDescription(ticket.descricao).address;
}
