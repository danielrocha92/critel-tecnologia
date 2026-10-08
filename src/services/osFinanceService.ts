import { createClient } from '../utils/supabase/client';

export type FinancialStatus = 'PENDENTE' | 'CONCILIADO' | 'DIVERGENTE' | 'FATURADO' | 'GLOSADO';
export type OSStatus = 'PENDENTE' | 'APROVADA' | 'CONCLUIDA' | 'GLOSADA' | 'FATURADA';

export interface FinancialOS {
  id: string;
  ticketId: string;
  osNumber: string;
  completionDate: string;
  technicianName: string;
  clientName: string;
  laborValue: number;
  partsValue: number;
  totalValue: number;
  financialStatus: FinancialStatus;
  osStatus: OSStatus;
  finalPrice: number;
  taxValue: number;
  pricing: OSPricing | null;
  serviceHours: number;
  reportedExpenses: Array<{ natureza: string; valor: number }>;
}

export type LaborProfessional = 'Técnico' | 'Ajudante';
export type LaborForm = 'Hora' | 'Diária';
export type WorkCondition = 'Horário normal' | 'Fora do horário' | 'Final de semana' | 'Feriado';

export interface LaborPricingLine {
  id: string;
  professional: LaborProfessional;
  form: LaborForm;
  condition: WorkCondition;
  quantity: number;
  duration: number;
}

export interface OSPricing {
  laborLines: LaborPricingLine[];
  otherCosts: {
    travel: number;
    toll: number;
    meals: number;
    lodging: number;
    materials: number;
  };
  taxPercent: number;
  profitMarginPercent: number;
  calculation: {
    laborHours: number;
    laborCost: number;
    otherCosts: number;
    totalCost: number;
    priceBeforeTax: number;
    taxValue: number;
    finalPrice: number;
    finalHourlyPrice: number;
  };
}

export const pricingDefaults = {
  technicianDaily: 350,
  helperDaily: 200,
  hoursPerDay: 8,
  taxPercent: 10,
  profitMarginPercent: 40,
} as const;

const conditionMultipliers: Record<WorkCondition, number> = {
  'Horário normal': 1,
  'Fora do horário': 1.5,
  'Final de semana': 1.5,
  Feriado: 2,
};

export function calculateOSPricing(
  laborLines: LaborPricingLine[],
  otherCosts: OSPricing['otherCosts'],
  taxPercent: number,
  profitMarginPercent: number,
): OSPricing['calculation'] {
  const laborCost = laborLines.reduce((total, line) => {
    const dailyRate = line.professional === 'Técnico'
      ? pricingDefaults.technicianDaily
      : pricingDefaults.helperDaily;
    const baseRate = line.form === 'Diária' ? dailyRate : dailyRate / pricingDefaults.hoursPerDay;
    return total + baseRate * conditionMultipliers[line.condition] * line.quantity * line.duration;
  }, 0);
  const laborHours = laborLines.reduce((total, line) => total + (
    line.form === 'Diária'
      ? line.quantity * line.duration * pricingDefaults.hoursPerDay
      : line.quantity * line.duration
  ), 0);
  const otherCostsTotal = Object.values(otherCosts).reduce((total, value) => total + Number(value || 0), 0);
  const totalCost = laborCost + otherCostsTotal;
  const marginRate = Math.min(Math.max(profitMarginPercent, 0), 99.99) / 100;
  const taxRate = Math.min(Math.max(taxPercent, 0), 99.99) / 100;
  const priceBeforeTax = totalCost / (1 - marginRate);
  const finalPrice = priceBeforeTax / (1 - taxRate);

  return {
    laborHours,
    laborCost,
    otherCosts: otherCostsTotal,
    totalCost,
    priceBeforeTax,
    taxValue: finalPrice - priceBeforeTax,
    finalPrice,
    finalHourlyPrice: laborHours ? finalPrice / laborHours : 0,
  };
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
  status_conciliacao: string | null;
  valor_total_faturavel: number | string | null;
  valor_impostos: number | string | null;
  composicao_precificacao: OSPricing | null;
  criado_em: string | null;
  ticket: TicketEntry | TicketEntry[] | null;
  tecnico: TechnicianEntry | TechnicianEntry[] | null;
}

interface TicketEntry {
  id: string;
  protocolo_origem: string | null;
  cliente: string | null;
  status: string | null;
  resolucao: {
    horaInicio?: number;
    horaTermino?: number;
    despesas?: Array<{ natureza?: string; valor?: number }>;
  } | null;
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
    
    let query = supabase.from('financeiro').select('valor_servico, valor_despesas, valor_total_faturavel, status_faturamento, status_conciliacao');
    
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

    (data as Pick<FinanceEntry, 'valor_servico' | 'valor_despesas' | 'valor_total_faturavel' | 'status_faturamento' | 'status_conciliacao'>[] | null)?.forEach(entry => {
      const total = Number(entry.valor_total_faturavel || Number(entry.valor_servico || 0) + Number(entry.valor_despesas || 0));
      const billingStatus = (entry.status_faturamento || '').toUpperCase();
      const reconciliationStatus = (entry.status_conciliacao || billingStatus || 'PENDENTE').toUpperCase();
      
      if (billingStatus === 'FATURADO' || billingStatus === 'PAGO') {
        totalBillable += total;
      } else if (reconciliationStatus === 'PENDENTE' || reconciliationStatus === 'ABERTO') {
        pendingValidation += total;
      } else if (reconciliationStatus === 'DIVERGENTE' || reconciliationStatus === 'GLOSADO') {
        inConflict += total;
      } else if (reconciliationStatus === 'CONCILIADO') {
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
      valor_total_faturavel,
      valor_impostos,
      composicao_precificacao,
      status_faturamento,
      status_conciliacao,
      criado_em,
      ticket:tickets (
        id,
        protocolo_origem,
        cliente,
        status,
        atualizado_em,
        resolucao
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
      query = ['FATURADO', 'PAGO'].includes(filters.financialStatus)
        ? query.eq('status_faturamento', filters.financialStatus)
        : query.eq('status_conciliacao', filters.financialStatus);
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
      const pricing = entry.composicao_precificacao || null;
      const resolution = ticket?.resolucao;
      const startAt = Number(resolution?.horaInicio || 0);
      const endAt = Number(resolution?.horaTermino || 0);
      const serviceHours = startAt && endAt && endAt > startAt ? (endAt - startAt) / 3600000 : 0;
      
      // Default to PENDENTE if empty
      let finStatus = (entry.status_conciliacao || entry.status_faturamento || 'PENDENTE').toUpperCase();
      if (['ABERTO'].includes(finStatus)) finStatus = 'PENDENTE';
      if (['FECHADO', 'PAGO'].includes(finStatus)) finStatus = 'FATURADO';
      if (entry.status_faturamento?.toUpperCase() === 'FATURADO' || entry.status_faturamento?.toUpperCase() === 'PAGO') {
        finStatus = 'FATURADO';
      }

      return {
        id: entry.id, // ID do registro financeiro (pode ser usado para fechar o lote)
        ticketId: ticket?.id || '',
        osNumber: ticket?.protocolo_origem || 'S/N',
        completionDate: entry.criado_em || new Date().toISOString(),
        technicianName: tecnico?.nome || 'Não atribuído',
        clientName: ticket?.cliente || 'Cliente não informado',
        laborValue,
        partsValue,
        totalValue: laborValue + partsValue,
        finalPrice: Number(entry.valor_total_faturavel || laborValue + partsValue),
        taxValue: Number(entry.valor_impostos || pricing?.calculation.taxValue || 0),
        pricing,
        serviceHours,
        reportedExpenses: (resolution?.despesas || []).map((expense) => ({
          natureza: expense.natureza || 'Material / outros',
          valor: Number(expense.valor || 0),
        })),
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
    if (!osIds.length) return false;
    const { data, error } = await supabase
      .from('financeiro')
      .update({ status_faturamento: 'FATURADO', status_conciliacao: 'FECHADO' })
      .in('id', osIds)
      .eq('status_conciliacao', 'CONCILIADO')
      .select('id');

    if (error) {
      console.error('Erro ao fechar OS em lote:', error);
      return false;
    }
    
    return data?.length === osIds.length;
  },

  async savePricing(financialId: string, pricing: OSPricing): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from('financeiro')
      .update({
        valor_servico: pricing.calculation.laborCost,
        valor_despesas: pricing.calculation.otherCosts,
        valor_total_faturavel: pricing.calculation.finalPrice,
        valor_custo_total: pricing.calculation.totalCost,
        valor_impostos: pricing.calculation.taxValue,
        impostos_percentual: pricing.taxPercent,
        margem_lucro_percentual: pricing.profitMarginPercent,
        composicao_precificacao: pricing,
        status_conciliacao: 'CONCILIADO',
      })
      .eq('id', financialId)
      .select('id')
      .single();

    if (error) {
      const details = [error.details, error.hint].filter(Boolean).join(' ');
      const message = error.code === 'PGRST204'
        ? 'O banco ainda não reconhece as colunas da conciliação. Aplique a migração financeira e recarregue o schema do Supabase.'
        : error.code === '42501'
          ? 'O usuário não tem permissão para atualizar este lançamento financeiro. Verifique a política RLS da tabela financeiro.'
          : error.message;
      throw new Error(`${message}${details ? ` ${details}` : ''} [${error.code || 'sem código'}]`);
    }
  }
};
