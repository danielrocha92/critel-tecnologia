import { 
  doc, 
  collection,
  runTransaction, 
  serverTimestamp, 
  getFirestore 
} from 'firebase/firestore';
import { Ticket, TicketTransition, TicketStatus } from '../../types/ticket';
import { db } from '../../utils/firebase/client';

/**
 * Função transacional para o técnico assumir um chamado.
 * Garante que dois técnicos não assumam o mesmo chamado simultaneamente.
 * 
 * @param ticketId - O ID do chamado
 * @param tecnicoId - O ID do técnico que está assumindo
 */
export async function assumirChamado(ticketId: string, tecnicoId: string): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  const transitionRef = doc(db, `tickets/${ticketId}/transitions`, crypto.randomUUID());

  try {
    await runTransaction(db, async (transaction) => {
      const ticketDoc = await transaction.get(ticketRef);

      if (!ticketDoc.exists()) {
        throw new Error('Chamado não encontrado.');
      }

      const data = ticketDoc.data();
      
      // Validação de Máquina de Estado e Concorrência
      if (data.status !== 'FILA') {
        throw new Error(`Chamado não pode ser assumido pois está com status: ${data.status}`);
      }

      if (data.assigneeId !== null && data.assigneeId !== undefined) {
        throw new Error('Este chamado já foi assumido por outro técnico.');
      }

      const fromStatus = data.status as TicketStatus;
      const toStatus: TicketStatus = 'EM_ANDAMENTO';

      // 1. Atualiza o ticket
      transaction.update(ticketRef, {
        status: toStatus,
        assigneeId: tecnicoId,
        updatedAt: serverTimestamp(),
      });

      // 2. Grava a trilha de auditoria (Event Sourcing)
      const transitionData: Omit<TicketTransition, 'id'> = {
        ticketId,
        fromStatus,
        toStatus,
        changedBy: tecnicoId,
        timestamp: Date.now(),
        reason: 'Técnico assumiu o chamado na fila.'
      };

      transaction.set(transitionRef, transitionData);
    });

    console.log(`Chamado ${ticketId} assumido com sucesso pelo técnico ${tecnicoId}.`);
  } catch (error) {
    console.error('Falha na transação ao assumir chamado:', error);
    throw error;
  }
}

/**
 * Função para criar (abrir) um novo chamado.
 * Utiliza batch ou runTransaction para garantir a integridade entre o ticket e o histórico inicial.
 * 
 * @param data - Dados parciais preenchidos no form pelo requerente
 * @param requesterId - ID do usuário que solicitou
 */
export async function abrirChamado(
  data: Pick<Ticket, 'title' | 'description' | 'department' | 'category' | 'priority' | 'attachments'>, 
  requesterId: string
): Promise<string> {
  const ticketRef = doc(collection(db, 'tickets'));
  const ticketId = ticketRef.id;
  const transitionRef = doc(db, `tickets/${ticketId}/transitions`, crypto.randomUUID());

  try {
    await runTransaction(db, async (transaction) => {
      
      const newTicket: Omit<Ticket, 'createdAt' | 'updatedAt'> & { createdAt: any, updatedAt: any } = {
        id: ticketId,
        ...data,
        status: 'FILA',
        requesterId,
        assigneeId: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      transaction.set(ticketRef, newTicket);

      const transitionData: Omit<TicketTransition, 'id'> = {
        ticketId,
        fromStatus: null,
        toStatus: 'FILA',
        changedBy: requesterId,
        timestamp: Date.now(),
        reason: 'Abertura inicial do chamado'
      };

      transaction.set(transitionRef, transitionData);
    });

    console.log(`Chamado criado com sucesso: ${ticketId}`);
    return ticketId;
  } catch (error) {
    console.error('Falha ao abrir chamado:', error);
    throw error;
  }
}

/**
 * Registra o check-in do técnico no local do chamado.
 * Salva as coordenadas e o timestamp para auditoria de SLA/Distância.
 */
export async function fazerCheckin(ticketId: string, tecnicoId: string, lat: number, lng: number): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  const transitionRef = doc(db, `tickets/${ticketId}/transitions`, crypto.randomUUID());

  try {
    await runTransaction(db, async (transaction) => {
      const ticketDoc = await transaction.get(ticketRef);
      if (!ticketDoc.exists()) throw new Error('Chamado não encontrado.');
      
      const data = ticketDoc.data();
      if (data.assigneeId !== tecnicoId) {
        throw new Error('Apenas o técnico alocado pode fazer check-in.');
      }
      
      // Update ticket with check-in info
      transaction.update(ticketRef, {
        checkInAt: Date.now(),
        checkInLat: lat,
        checkInLng: lng,
        updatedAt: serverTimestamp(),
      });

      // Grava transação de evento
      const transitionData: Omit<TicketTransition, 'id'> = {
        ticketId,
        fromStatus: data.status as TicketStatus,
        toStatus: data.status as TicketStatus,
        changedBy: tecnicoId,
        timestamp: Date.now(),
        reason: `Check-in realizado no local (Lat: ${lat}, Lng: ${lng})`
      };

      transaction.set(transitionRef, transitionData);
    });
  } catch (error) {
    console.error('Falha no check-in:', error);
    throw error;
  }
}

/**
 * Fecha automaticamente o chamado por segurança se o técnico violar o limite de distância (500m).
 */
export async function autoFinalizar(ticketId: string, lat: number, lng: number): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  const transitionRef = doc(db, `tickets/${ticketId}/transitions`, crypto.randomUUID());

  try {
    await runTransaction(db, async (transaction) => {
      const ticketDoc = await transaction.get(ticketRef);
      if (!ticketDoc.exists()) return;
      
      const data = ticketDoc.data();
      
      transaction.update(ticketRef, {
        status: 'FECHADO',
        updatedAt: serverTimestamp(),
      });

      const transitionData: Omit<TicketTransition, 'id'> = {
        ticketId,
        fromStatus: data.status as TicketStatus,
        toStatus: 'FECHADO',
        changedBy: 'SISTEMA_AUTO', // Sistema foi o autor
        timestamp: Date.now(),
        reason: `Fechamento Automático (Afastamento > 500m. Lat: ${lat}, Lng: ${lng})`
      };

      transaction.set(transitionRef, transitionData);
    });
  } catch (error) {
    console.error('Falha ao auto-finalizar chamado:', error);
    throw error;
  }
}
