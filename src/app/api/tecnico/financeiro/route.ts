import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

function isDate(value: string | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export async function GET(request: Request) {
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });

  const { data: profile, error: profileError } = await session.from('perfis')
    .select('cargo,status').eq('user_id', user.id).maybeSingle();
  const role = profile?.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
  if (profileError) {
    console.error('Não foi possível verificar o perfil financeiro do técnico:', profileError);
    return NextResponse.json({ error: 'Não foi possível verificar seu perfil.' }, { status: 500 });
  }
  if (!profile || profile.status !== 'ATIVO' || role !== 'TECNICO') {
    return NextResponse.json({ error: 'Apenas técnicos ativos podem consultar este resumo.' }, { status: 403 });
  }

  const query = new URL(request.url).searchParams;
  const start = query.get('inicio');
  const end = query.get('fim');
  if (!isDate(start) || !isDate(end) || start > end) {
    return NextResponse.json({ error: 'Informe um período de consulta válido.' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
  }

  const admin = createSupabaseAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.from('transacoes_financeiras')
    .select('id,descricao,valor,valor_servico,valor_despesas,data_competencia,data_vencimento,data_liquidacao,status,metodo_pagamento')
    .eq('tipo', 'DESPESA')
    .eq('origem', 'OS_TECNICO')
    .eq('tecnico_id', user.id)
    .gte('data_competencia', start)
    .lte('data_competencia', end)
    .order('data_competencia', { ascending: false });

  if (error) {
    console.error('Não foi possível carregar as transações do técnico:', error);
    return NextResponse.json({ error: 'Não foi possível carregar seus lançamentos financeiros.' }, { status: 500 });
  }
  return NextResponse.json({ transacoes: data || [] });
}
