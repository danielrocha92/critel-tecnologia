import type { ITicket } from '@/types/ticket';

export class TicketAcceptanceError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'TicketAcceptanceError';
  }
}

export async function acceptTicket(ticketId: string): Promise<ITicket> {
  const response = await fetch('/api/tecnico/aceitar-chamado', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticket_id: ticketId }),
  });

  const result = await response.json().catch(() => null);
  if (!response.ok) {
    throw new TicketAcceptanceError(
      result?.error || 'Não foi possível aceitar este chamado.',
      response.status,
    );
  }

  return result.ticket as ITicket;
}