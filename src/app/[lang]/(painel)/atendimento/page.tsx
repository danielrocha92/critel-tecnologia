import { redirect } from 'next/navigation';

export default async function CentralAtendimentoPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ ticket_id?: string; novo?: string }>;
}) {
  const { lang } = await params;
  const { ticket_id: ticketId, novo } = await searchParams;

  if (ticketId) redirect(`/${lang}/os/${encodeURIComponent(ticketId)}`);
  if (novo === '1') redirect(`/${lang}/analista?novo=1`);
  redirect(`/${lang}/analista`);
}
