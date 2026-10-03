export type TicketStatus =
  | 'FILA'
  | 'EM_ANDAMENTO'
  | 'PENDENTE'
  | 'RESOLVIDO'
  | 'FECHADO'
  | 'FINALIZADO'
  | 'CONCLUIDO'
  | 'CANCELADO';

export interface Ticket {
  id: string; // ID gerado pelo Firestore
  title: string;
  description: string;
  status: TicketStatus;
  requesterId: string; // Referência ao usuário que abriu
  assigneeId: string | null; // Nulo quando status === 'FILA'
  department: string;
  category: string;
  priority: string;
  createdAt: number; // Timestamp Unix para melhor compatibilidade de serialização
  updatedAt: number;
  attachments?: string[]; // URLs dos anexos (Storage)
  checkInAt?: number;
  checkInLat?: number;
  checkInLng?: number;
}

export interface ITicket extends Ticket {
  cliente?: string;
  titulo?: string;
  protocolo_origem?: string;
  criado_em?: string | number | Date;
  atualizado_em?: string | number | Date;
  email_cliente?: string;
  analista_id?: string | null;
  tecnico_id?: string | null;
  departamento?: string;
  categoria?: string;
  prioridade?: string;
  descricao?: string;
}

export interface TicketTransition {
  id: string;
  ticketId: string;
  fromStatus: TicketStatus | null; // null se for a criação
  toStatus: TicketStatus;
  changedBy: string; // ID do técnico/usuário que engatilhou a ação
  timestamp: number;
  reason?: string; // Obrigatório para 'PENDENTE' ou 'RESOLVIDO' (laudo)
}

// Mantidos por retrocompatibilidade com partes do sistema que ainda não foram refatoradas.
// Idealmente, também deverão passar por revisão de padrão de nomenclaturas (camelCase + English)
export interface IPerfil {
  id: string;
  nome: string;
  cargo: string;
  user_id: string;
  status?: string;
}

export interface IServicoConcluido {
  id: string;
  ticket_id: string;
  tecnico_id: string;
  hora_inicio: string;
  hora_termino: string;
  descricao_servicos: string;
  materiais_utilizados?: string;
  latitude?: number;
  longitude?: number;
  assinatura_base64?: string;
  criado_em: string;
}

export interface IFinanceiro {
  id: string;
  ticket_id: string;
  tecnico_id?: string;
  servico_id?: string;
  valor_servico: number;
  valor_despesas: number;
  status_faturamento: 'PENDENTE' | 'FATURADO' | 'PAGO';
  criado_em: string;
  atualizado_em: string;
}
