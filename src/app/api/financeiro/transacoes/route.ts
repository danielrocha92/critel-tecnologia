import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const READ_ROLES = new Set(['FINANCEIRO', 'ANALISTA', 'ADMIN', 'SUPER_ADMIN']);
const MANAGER_ROLES = new Set(['FINANCEIRO', 'ADMIN', 'SUPER_ADMIN']);
const PAYMENT_METHODS = new Set(['PIX', 'BOLETO', 'TRANSFERENCIA']);

type TransactionBody = {
  action?: unknown;
  tipo?: unknown;
  descricao?: unknown;
  categoria?: unknown;
  valor?: unknown;
  data_competencia?: unknown;
  data_vencimento?: unknown;
  transacao_id?: unknown;
  data_liquidacao?: unknown;
  metodo_pagamento?: unknown;
  motivo_excecao?: unknown;
};

function isDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function currentBusinessDate() {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  return `${parts.find((part) => part.type === 'year')?.value}-${parts.find((part) => part.type === 'month')?.value}-${parts.find((part) => part.type === 'day')?.value}`;
}

async function getAuthorizedUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anonKey || !serviceRoleKey) {
    return { response: NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 }) };
  }

  const cookieStore = await cookies();
  const session = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options })),
    },
  });
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) {
    return { response: NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 }) };
  }

  const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: profile, error: profileError } = await admin.from('perfis')
    .select('cargo,status').eq('user_id', user.id).maybeSingle();
  if (profileError) throw profileError;
  const role = profile?.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase() || '';
  if (!profile || profile.status !== 'ATIVO' || !READ_ROLES.has(role)) {
    return { response: NextResponse.json({ error: 'Acesso não permitido.' }, { status: 403 }) };
  }

  return { admin, user, role };
}

export async function GET() {
  try {
    const authorization = await getAuthorizedUser();
    if ('response' in authorization) return authorization.response;

    const rows = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await authorization.admin.from('transacoes_financeiras')
        .select('id,tipo,descricao,categoria,valor,data_competencia,data_vencimento,data_liquidacao,status,metodo_pagamento,origem,ticket_id,tecnico_id,pagamento_imediato,motivo_excecao,criado_em')
        .order('data_vencimento', { ascending: true })
        .range(offset, offset + pageSize - 1);
      if (error) throw error;
      rows.push(...(data || []));
      if (!data || data.length < pageSize) break;
      if (rows.length >= 20000) throw new Error('O livro financeiro excede o limite de registros carregados nesta tela.');
    }

    const technicianIds = [...new Set(rows.map((row) => row.tecnico_id).filter((id): id is string => Boolean(id)))];
    if (!technicianIds.length) return NextResponse.json({ transacoes: rows });

    const { data: profiles, error: profilesError } = await authorization.admin.from('perfis')
      .select('user_id,nome').in('user_id', technicianIds);
    if (profilesError) throw profilesError;
    const names = new Map((profiles || []).map((profile) => [profile.user_id, profile.nome]));
    return NextResponse.json({
      transacoes: rows.map((row) => ({ ...row, tecnico_nome: row.tecnico_id ? names.get(row.tecnico_id) || 'Técnico' : null })),
    });
  } catch (error) {
    console.error('Erro ao carregar transações financeiras:', error);
    return NextResponse.json({ error: 'Não foi possível carregar as transações financeiras.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authorization = await getAuthorizedUser();
    if ('response' in authorization) return authorization.response;
    if (!MANAGER_ROLES.has(authorization.role)) {
      return NextResponse.json({ error: 'Somente o gestor financeiro pode alterar transações.' }, { status: 403 });
    }

    let body: TransactionBody;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    if (body.action === 'criar') {
      const amount = typeof body.valor === 'number' ? body.valor : Number(body.valor);
      if (
        (body.tipo !== 'RECEITA' && body.tipo !== 'DESPESA')
        || typeof body.descricao !== 'string' || !body.descricao.trim()
        || typeof body.categoria !== 'string' || !body.categoria.trim()
        || !Number.isFinite(amount) || amount <= 0
        || !isDate(body.data_competencia) || !isDate(body.data_vencimento)
      ) {
        return NextResponse.json({ error: 'Informe tipo, descrição, categoria, valor positivo e datas válidas.' }, { status: 400 });
      }

      const { data, error } = await authorization.admin.from('transacoes_financeiras').insert({
        tipo: body.tipo,
        descricao: body.descricao.trim().slice(0, 250),
        categoria: body.categoria.trim().slice(0, 100),
        valor: amount,
        data_competencia: body.data_competencia,
        data_vencimento: body.data_vencimento,
        origem: 'MANUAL',
        criado_por: authorization.user.id,
      }).select('*').single();
      if (error) throw error;
      return NextResponse.json({ transacao: data }, { status: 201 });
    }

    if (body.action === 'liquidar') {
      if (typeof body.transacao_id !== 'string' || !body.transacao_id.trim()
        || typeof body.metodo_pagamento !== 'string' || !PAYMENT_METHODS.has(body.metodo_pagamento)
        || !isDate(body.data_liquidacao)) {
        return NextResponse.json({ error: 'Informe a transação, a data de liquidação e um método de pagamento válido.' }, { status: 400 });
      }

      const { data, error } = await authorization.admin.from('transacoes_financeiras').update({
        status: 'LIQUIDADO',
        data_liquidacao: body.data_liquidacao,
        metodo_pagamento: body.metodo_pagamento,
        atualizado_em: new Date().toISOString(),
      }).eq('id', body.transacao_id).eq('status', 'PENDENTE').select('id').maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'A transação não está pendente ou já foi liquidada.' }, { status: 409 });
      return NextResponse.json({ success: true });
    }

    if (body.action === 'pagamento_imediato') {
      if (typeof body.transacao_id !== 'string' || !body.transacao_id.trim()
        || typeof body.motivo_excecao !== 'string' || !body.motivo_excecao.trim()) {
        return NextResponse.json({ error: 'Informe a transação e o motivo da exceção.' }, { status: 400 });
      }

      const today = currentBusinessDate();
      const { data, error } = await authorization.admin.from('transacoes_financeiras').update({
        data_vencimento: today,
        pagamento_imediato: true,
        motivo_excecao: body.motivo_excecao.trim().slice(0, 500),
        atualizado_em: new Date().toISOString(),
      }).eq('id', body.transacao_id)
        .eq('tipo', 'DESPESA')
        .eq('origem', 'OS_TECNICO')
        .eq('status', 'PENDENTE')
        .eq('pagamento_imediato', false)
        .select('id').maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: 'A transação não permite antecipação ou já foi atualizada.' }, { status: 409 });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Ação inválida.' }, { status: 400 });
  } catch (error) {
    console.error('Erro ao processar transação financeira:', error);
    return NextResponse.json({ error: 'Não foi possível processar a transação financeira.' }, { status: 500 });
  }
}
