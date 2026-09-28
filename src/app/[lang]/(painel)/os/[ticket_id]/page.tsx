import CentralAtendimento from '../../atendimento/CentralAtendimento';

export default async function OrdemDeServicoPage({
  params,
}: {
  params: Promise<{ ticket_id: string }>;
}) {
  const { ticket_id: ticketId } = await params;
  return <CentralAtendimento key={ticketId} ticketId={ticketId} />;
}
