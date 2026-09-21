import TicketList from '@/components/Tickets/TicketList';

export default function AllTicketsPage() {
  return <TicketList filterTitle="Todos os Chamados" filterType="all" />;
}
