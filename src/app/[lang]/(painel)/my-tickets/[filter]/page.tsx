import TicketList, { TicketFilter } from '@/components/Tickets/TicketList';

export const dynamic = 'force-dynamic';

export default async function MyTicketsPage({ params }: { params: Promise<{ filter: string }> }) {
  const { filter } = await params;
  
  let filterType: TicketFilter = 'my-all';
  let title = 'Meus Chamados';

  if (filter === 'opened') {
    filterType = 'my-opened';
    title = 'Meus Chamados Abertos';
  } else if (filter === 'closed') {
    filterType = 'my-closed';
    title = 'Meus Chamados Finalizados';
  }

  return <TicketList key={filter} filterTitle={title} filterType={filterType} />;
}
