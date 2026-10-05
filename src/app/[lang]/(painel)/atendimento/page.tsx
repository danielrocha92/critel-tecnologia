import CentralAtendimento from './CentralAtendimento';

export default async function CentralAtendimentoPage({
  searchParams,
}: {
  searchParams: Promise<{ ticket_id?: string; novo?: string }>;
}) {
  const { ticket_id: ticketId, novo } = await searchParams;
  const openCreateTicket = novo === '1';

  return (
    <CentralAtendimento
      key={ticketId || (openCreateTicket ? 'novo-chamado' : 'lista-chamados')}
      ticketId={ticketId}
      openCreateTicket={openCreateTicket}
    />
  );
}
