import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { formatTicketDescription, getTicketAddress } from '@/utils/tickets/description';

const TICKET_COLUMNS = 'id,protocolo_origem,cliente,email_cliente,endereco,titulo,descricao,status,categoria,prioridade,causa_raiz,causa_raiz_detalhe,criado_em,atualizado_em,check_in_at,check_in_lat,check_in_lng,checkout_at,checkout_lat,checkout_lng,assinatura_datahora,despesas_json' as const;

const PAGE_SIZE = 500;
const MAX_TICKETS = 5000;

type ServiceTicket = {
  id: string;
  protocolo_origem: string | null;
  cliente: string | null;
  email_cliente: string | null;
  endereco: string | null;
  titulo: string | null;
  descricao: string | null;
  status: string;
  categoria: string | null;
  prioridade: string | null;
  causa_raiz: string | null;
  causa_raiz_detalhe: string | null;
  criado_em: string | null;
  atualizado_em: string | null;
  check_in_at: string | null;
  check_in_lat: number | null;
  check_in_lng: number | null;
  checkout_at: string | null;
  checkout_lat: number | null;
  checkout_lng: number | null;
  assinatura_datahora: string | null;
  despesas_json: unknown;
};

type ServiceReport = {
  ticket_id: string;
  hora_inicio: string | null;
  hora_termino: string | null;
  descricao_servicos: string | null;
  materiais_utilizados: string | null;
  latitude: number | null;
  longitude: number | null;
  criado_em: string | null;
};

function isDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function nextDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function parseAmount(value: unknown) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value !== 'string') return 0;
  const normalized = value.trim().replace(/^R\$\s*/i, '').replace(/\s/g, '');
  const parsed = Number(normalized.includes(',')
    ? normalized.replace(/\./g, '').replace(',', '.')
    : normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function expenseDetails(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const expense = item as Record<string, unknown>;
    const amount = parseAmount(expense.valor_numerico ?? expense.valor);
    if (amount <= 0) return [];
    return [{
      natureza: typeof expense.natureza === 'string' ? expense.natureza : 'Despesa',
      valor: amount,
    }];
  });
}

export async function GET(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const session = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options })),
      },
    });
    const { data: { user }, error: authError } = await session.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: profile, error: profileError } = await admin.from('perfis')
      .select('id,nome,cargo,status').eq('user_id', user.id).maybeSingle();
    if (profileError) throw profileError;
    const role = profile?.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
    if (!profile || profile.status !== 'ATIVO' || role !== 'TECNICO') {
      return NextResponse.json({ error: 'Apenas técnicos ativos podem gerar este relatório.' }, { status: 403 });
    }

    const params = new URL(request.url).searchParams;
    const start = params.get('inicio');
    const end = params.get('fim');
    if (!isDate(start) || !isDate(end) || start > end) {
      return NextResponse.json({ error: 'Informe um período válido para o relatório.' }, { status: 400 });
    }

    const startAt = `${start}T00:00:00-03:00`;
    const endAt = `${nextDate(end)}T00:00:00-03:00`;
    const technicianIds = [...new Set([user.id, profile.id])];

    const loadTickets = async (useCheckoutDate: boolean) => {
      const rows: ServiceTicket[] = [];
      for (let offset = 0; ; offset += PAGE_SIZE) {
        let query = admin.from('tickets').select(TICKET_COLUMNS)
          .like('protocolo_origem', 'OS-%')
          .in('tecnico_id', technicianIds)
          .in('status', ['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO']);

        query = useCheckoutDate
          ? query.gte('checkout_at', startAt).lt('checkout_at', endAt)
          : query.is('checkout_at', null).gte('atualizado_em', startAt).lt('atualizado_em', endAt);

        const { data, error } = await query.order('atualizado_em', { ascending: false })
          .range(offset, offset + PAGE_SIZE - 1);
        if (error) throw error;
        rows.push(...((data || []) as ServiceTicket[]));
        if (!data || data.length < PAGE_SIZE) break;
        if (rows.length > MAX_TICKETS) throw new Error('O período selecionado excede o limite de 5.000 atendimentos por relatório.');
      }
      return rows;
    };

    const [withCheckout, withoutCheckout] = await Promise.all([loadTickets(true), loadTickets(false)]);
    const tickets = [...new Map([...withCheckout, ...withoutCheckout].map((ticket) => [ticket.id, ticket])).values()];
    if (tickets.length > MAX_TICKETS) {
      return NextResponse.json({ error: 'O período selecionado excede o limite de 5.000 atendimentos por relatório. Selecione um período menor.' }, { status: 413 });
    }

    const reportsByTicket = new Map<string, ServiceReport>();
    for (let offset = 0; offset < tickets.length; offset += 200) {
      const ticketIds = tickets.slice(offset, offset + 200).map((ticket) => ticket.id);
      const { data, error } = await admin.from('servicos_concluidos')
        .select('ticket_id,hora_inicio,hora_termino,descricao_servicos,materiais_utilizados,latitude,longitude,criado_em')
        .in('ticket_id', ticketIds)
        .order('criado_em', { ascending: false });
      if (error) throw error;
      for (const report of (data || []) as ServiceReport[]) {
        if (!reportsByTicket.has(report.ticket_id)) reportsByTicket.set(report.ticket_id, report);
      }
    }

    const atendimentos = tickets.map((ticket) => {
      const report = reportsByTicket.get(ticket.id);
      return {
        id: ticket.id,
        protocolo: ticket.protocolo_origem,
        cliente: ticket.cliente,
        email_cliente: ticket.email_cliente,
        endereco: getTicketAddress(ticket),
        titulo: ticket.titulo,
        descricao: formatTicketDescription(ticket.descricao).text,
        status: ticket.status,
        categoria: ticket.categoria,
        prioridade: ticket.prioridade,
        causa_raiz: ticket.causa_raiz,
        causa_raiz_detalhe: ticket.causa_raiz_detalhe,
        criado_em: ticket.criado_em,
        atualizado_em: ticket.atualizado_em,
        check_in_at: ticket.check_in_at,
        check_in_lat: ticket.check_in_lat,
        check_in_lng: ticket.check_in_lng,
        checkout_at: ticket.checkout_at,
        checkout_lat: ticket.checkout_lat,
        checkout_lng: ticket.checkout_lng,
        assinatura_datahora: ticket.assinatura_datahora,
        hora_inicio: report?.hora_inicio || ticket.check_in_at,
        hora_termino: report?.hora_termino || ticket.checkout_at,
        descricao_servicos: report?.descricao_servicos,
        materiais_utilizados: report?.materiais_utilizados,
        despesas: expenseDetails(ticket.despesas_json),
      };
    }).sort((left, right) => (right.checkout_at || right.atualizado_em || '').localeCompare(left.checkout_at || left.atualizado_em || ''));

    return NextResponse.json({
      tecnico: profile.nome || user.email || 'Técnico',
      inicio: start,
      fim: end,
      atendimentos,
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de atendimentos:', error);
    const message = error instanceof Error ? error.message : 'Não foi possível gerar o relatório de atendimentos.';
    if (message.includes('limite de 5.000')) {
      return NextResponse.json({ error: 'O período excede o limite de 5.000 atendimentos. Selecione um período menor.' }, { status: 413 });
    }
    return NextResponse.json({ error: 'Não foi possível carregar os dados do relatório.' }, { status: 500 });
  }
}
