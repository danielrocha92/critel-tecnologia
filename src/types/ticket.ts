export interface ITicket {
  id: string;
  protocolo_origem: string;
  titulo: string;
  departamento: string;
  categoria: string;
  prioridade: string;
  status: string;
  cliente: string;
  email_cliente: string;
  descricao: string;
  criado_em: string;
  atualizado_em: string | null;
  analista_id: string | null;
  tomticket_id: string | null;
}

export interface IPerfil {
  id: string;
  nome: string;
  cargo: string;
  user_id: string;
  status?: string;
}

export interface ITomTicketReply {
  id: string | number;
  sender_type?: 'agent' | 'client' | 'system' | string;
  sender?: string;
  message: string;
  date: string;
  attachments?: { url: string; name: string }[];
}

export interface IWhatsAppMessage {
  id: string;
  conversa_id: string;
  conteudo: string;
  criado_em: string;
  direcao: 'IN' | 'OUT' | string;
  is_from_me?: boolean;
  status?: string;
}

export interface IWhatsAppConversation {
  id: string;
  telefone: string;
  nome_perfil: string;
  ultima_mensagem_data?: string;
}

export interface ILojaContato {
  id?: string;
  nome_loja: string;
  telefone_whatsapp: string;
}
