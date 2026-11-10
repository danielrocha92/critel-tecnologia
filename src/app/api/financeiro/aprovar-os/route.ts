import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const APPROVER_ROLES = new Set(['FINANCEIRO', 'ANALISTA', 'ADMIN', 'SUPER_ADMIN']);

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
    }

    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => cookiesToSet.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options })),
      },
    });
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await admin
      .from('perfis')
      .select('cargo, status')
      .eq('user_id', user.id)
      .maybeSingle();
    const role = profile?.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
    if (profileError || !profile || profile.status !== 'ATIVO' || !APPROVER_ROLES.has(role || '')) {
      return NextResponse.json({ error: 'Apenas o financeiro ou um analista autorizado pode validar esta OS.' }, { status: 403 });
    }

    let body: { action?: unknown; ticket_id?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }
    if (typeof body.ticket_id !== 'string' || !body.ticket_id.trim()) {
      return NextResponse.json({ error: 'Identificador da OS inválido.' }, { status: 400 });
    }
    const action = body.action ?? 'finalizar';
    if (action !== 'finalizar' && action !== 'reabrir') {
      return NextResponse.json({ error: 'Ação inválida para esta OS.' }, { status: 400 });
    }

    const changedAt = new Date().toISOString();
    const nextStatus = action === 'finalizar' ? 'FECHADO' : 'EM_ANDAMENTO';
    const { data: ticket, error: approveError } = await admin
      .from('tickets')
      .update(action === 'finalizar'
        ? {
          status: nextStatus,
          financeiro_aprovado_em: changedAt,
          financeiro_aprovado_por: user.id,
          atualizado_em: changedAt,
        }
        : {
          status: nextStatus,
          financeiro_aprovado_em: null,
          financeiro_aprovado_por: null,
          atualizado_em: changedAt,
        })
      .eq('id', body.ticket_id)
      .eq('status', 'FINALIZADO')
      .like('protocolo_origem', 'OS-%')
      .is('financeiro_aprovado_em', null)
      .select('id, status, financeiro_aprovado_em, financeiro_aprovado_por, valor_pagamento')
      .maybeSingle();

    if (approveError) throw approveError;
    if (!ticket) {
      return NextResponse.json({ error: 'Esta OS não está aguardando validação financeira.' }, { status: 409 });
    }

    const { error: transitionError } = await admin.from('ticket_transitions').insert({
      ticket_id: ticket.id,
      from_status: 'FINALIZADO',
      to_status: nextStatus,
      changed_by: user.id,
      reason: action === 'finalizar'
        ? 'OS validada e encerrada pelo departamento responsável.'
        : 'OS reaberta e devolvida ao técnico para ajustes.',
    });
    if (transitionError) console.error('Não foi possível registrar a transição da OS:', transitionError);

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error('Erro ao validar OS no financeiro:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao validar a OS.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
