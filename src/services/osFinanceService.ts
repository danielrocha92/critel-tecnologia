import { createClient } from '../utils/supabase/client';

export type FinancialStatus = 'PENDENTE' | 'CONCILIADO' | 'DIVERGENTE' | 'FATURADO' | 'GLOSADO';
export type OSStatus = 'PENDENTE' | 'APROVADA' | 'CONCLUIDA' | 'GLOSADA' | 'FATURADA';

export interface FinancialOS {
  id: string;
  osNumber: string;
  completionDate: string;
  technicianName: string;
  clientName: string;
  laborValue: number;
  partsValue: number;
  totalValue: number;
  financialStatus: FinancialStatus;
  osStatus: OSStatus;
}

export interface OSSummary {
  totalBillable: number;
  pendingValidation: number;
  inConflict: number;
  readyToClose: number;
}

export interface OSFilterParams {
  startDate?: string;
  endDate?: string;
  technicianId?: string;
  osStatus?: OSStatus;
  financialStatus?: FinancialStatus;
  searchQuery?: string;
}

interface FinanceEntry {
  id: string;
  valor_servico: number | string | null;
  valor_despesas: number | string | null;
  status_faturamento: string | null;
  criado_em: string | null;
  ticket: TicketEntry | TicketEntry[] | null;
  tecnico: TechnicianEntry | TechnicianEntry[] | null;
}

interface TicketEntry {
  protocolo_origem: string | null;
  cliente: string | null;
  status: string | null;
}

interface TechnicianEntry {
  nome: string | null;
}

export const osFinanceService = {
  /**
   * Obtém o resumo financeiro das Ordens de Serviço
   */
  async getSummary(filters?: OSFilterParams): Promise<OSSummary> {
    const supabase = createClient();
    
    let query = supabase.from('financeiro').select('valor_servico, valor_despesas, status_faturamento');
    
    // Filtros de data (baseados em criado_em do registro financeiro)
    if (filters?.startDate) {
      query = query.gte('criado_em', `${filters.startDate}T00:00:00Z`);
    }
    if (filters?.endDate) {
      query = query.lte('criado_em', `${filters.endDate}T23:59:59Z`);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Erro ao buscar resumo financeiro:', error);
      return { totalBillable: 0, pendingValidation: 0, inConflict: 0, readyToClose: 0 };
    }

    let totalBillable = 0;
    let pendingValidation = 0;
    let inConflict = 0;
    let readyToClose = 0;

    (data as Pick<FinanceEntry, 'valor_servico' | 'valor_despesas' | 'status_faturamento'>[] | null)?.forEach(entry => {
      const total = Number(entry.valor_servico || 0) + Number(entry.valor_despesas || 0);
      const status = (entry.status_faturamento || '').toUpperCase();
      
      if (status === 'FATURADO' || status === 'PAGO') {
        totalBillable += total;
      } else if (status === 'PENDENTE' || status === 'ABERTO') {
        pendingValidation += total;
      } else if (status === 'DIVERGENTE' || status === 'GLOSADO') {
        inConflict += total;
      } else if (status === 'CONCILIADO') {
        readyToClose += total;
      }
    });

    return { totalBillable, pendingValidation, inConflict, readyToClose };
  },

  /**
   * Lista as Ordens de Serviço filtradas para conciliação
   */
  async listOS(filters?: OSFilterParams): Promise<FinancialOS[]> {
    const supabase = createClient();

    let query = supabase.from('financeiro').select(`
      id,
      valor_servico,
      valor_despesas,
      status_faturamento,
      criado_em,
      ticket:tickets (
        id,
        protocolo_origem,
        cliente,
        status,
        atualizado_em
      ),
      tecnico:perfis (
        nome
      )
    `);

    if (filters?.startDate) {
      query = query.gte('criado_em', `${filters.startDate}T00:00:00Z`);
    }
    if (filters?.endDate) {
      query = query.lte('criado_em', `${filters.endDate}T23:59:59Z`);
    }
    if (filters?.financialStatus) {
      query = query.eq('status_faturamento', filters.financialStatus);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao listar OS financeiras:', error);
      return [];
    }

    let results: FinancialOS[] = ((data || []) as FinanceEntry[]).map(entry => {
      const ticket = Array.isArray(entry.ticket) ? entry.ticket[0] : entry.ticket;
      const tecnico = Array.isArray(entry.tecnico) ? entry.tecnico[0] : entry.tecnico;
      
      const laborValue = Number(entry.valor_servico || 0);
      const partsValue = Number(entry.valor_despesas || 0);
      
      // Default to PENDENTE if empty
      let finStatus = (entry.status_faturamento || 'PENDENTE').toUpperCase();
      if (['ABERTO'].includes(finStatus)) finStatus = 'PENDENTE';
      if (['PAGO'].includes(finStatus)) finStatus = 'FATURADO';

      return {
        id: entry.id, // ID do registro financeiro (pode ser usado para fechar o lote)
        osNumber: ticket?.protocolo_origem || 'S/N',
        completionDate: entry.criado_em || new Date().toISOString(),
        technicianName: tecnico?.nome || 'Não atribuído',
        clientName: ticket?.cliente || 'Cliente não informado',
        laborValue,
        partsValue,
        totalValue: laborValue + partsValue,
        financialStatus: finStatus as FinancialStatus,
        osStatus: (ticket?.status || 'PENDENTE').toUpperCase() as OSStatus,
      };
    });

    if (filters?.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      results = results.filter(item => 
        item.osNumber.toLowerCase().includes(q) || 
        item.clientName.toLowerCase().includes(q)
      );
    }

    return results;
  },

  /**
   * Consolida as OSs selecionadas para faturamento
   */
  async closeOSBatch(osIds: string[]): Promise<boolean> {
    const supabase = createClient();
    
    // Atualiza o status de faturamento dos registros financeiros selecionados para 'CONCILIADO' ou 'FATURADO'
    const { error } = await supabase
      .from('financeiro')
      .update({ status_faturamento: 'CONCILIADO' })
      .in('id', osIds);

    if (error) {
      console.error('Erro ao fechar OS em lote:', error);
      return false;
    }
    
    return true;
  }
};
