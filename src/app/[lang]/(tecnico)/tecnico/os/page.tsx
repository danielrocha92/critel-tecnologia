import OsList from '@/components/Tecnico/OsList';
import OsDetail from '@/components/Tecnico/OsDetail';

export default async function OsIndexPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ ticket_id?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const lang = resolvedParams.lang || 'pt';
  const ticketId = resolvedSearchParams.ticket_id;

  if (ticketId) {
    return <OsDetail ticketId={ticketId} lang={lang} />;
  }

  return <OsList lang={lang} />;
}
