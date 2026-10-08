import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          },
        },
      },
    );

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      ticket_id,
      hora_inicio,
      hora_termino,
      descricao_servicos,
      materiais_utilizados,
      latitude,
      longitude,
      assinatura_base64,
      despesas_json,
      assinatura_datahora,
      resolucao,
    } = body;

    if (
      !ticket_id ||
      typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180 ||
      typeof descricao_servicos !== 'string' || !descricao_servicos.trim() ||
      !resolucao || typeof resolucao !== 'object'
    ) {
      return NextResponse.json({ error: 'Confira a descrição, localização e dados da ordem de serviço.' }, { status: 400 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY não está configurada.');
      return NextResponse.json({ error: 'Serviço de finalização indisponível no servidor.' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: ticket, error: ticketReadError } = await supabaseAdmin
      .from('tickets')
      .select('status, tecnico_id')
      .eq('id', ticket_id)
      .like('protocolo_origem', 'OS-%')
      .single();

    if (ticketReadError || !ticket) {
      return NextResponse.json({ error: 'Ordem de serviço não encontrada.' }, { status: 404 });
    }

    const { data: profile } = await supabaseAdmin
      .from('perfis')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (ticket.tecnico_id !== user.id && ticket.tecnico_id !== profile?.id) {
      return NextResponse.json({ error: 'Esta ordem de serviço não está atribuída a você.' }, { status: 403 });
    }

    if (['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO'].includes(ticket.status || '')) {
      return NextResponse.json({ error: 'Este chamado já foi finalizado.' }, { status: 409 });
    }

    const finalizedAt = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        status: 'FINALIZADO',
        atualizado_em: finalizedAt,
        checkout_lat: latitude,
        checkout_lng: longitude,
        checkout_at: finalizedAt,
        despesas_json: despesas_json || [],
        assinatura_datahora: assinatura_datahora || finalizedAt,
        resolucao,
      })
      .eq('id', ticket_id)
      .like('protocolo_origem', 'OS-%');

    if (updateError) throw updateError;

    const { error: transitionError } = await supabaseAdmin
      .from('ticket_transitions')
      .insert({
        ticket_id,
        from_status: ticket.status,
        to_status: 'FINALIZADO',
        changed_by: user.id,
        reason: `Finalização técnica: ${descricao_servicos.trim().slice(0, 120)}`,
      });

    if (transitionError) console.error('Não foi possível registrar a transição da OS:', transitionError);

    const { data: servico, error: servicoError } = await supabaseAdmin
      .from('servicos_concluidos')
      .insert({
        ticket_id,
        tecnico_id: user.id,
        hora_inicio,
        hora_termino,
        descricao_servicos: descricao_servicos.trim(),
        materiais_utilizados,
        latitude,
        longitude,
        assinatura_base64,
      })
      .select('id')
      .single();

    if (servicoError) {
      console.error('Não foi possível registrar o relatório do serviço:', servicoError);
      return NextResponse.json({ success: true, warning: 'OS finalizada, mas o relatório complementar não foi registrado.' });
    }

    const totalDespesas = Array.isArray(despesas_json)
      ? despesas_json.reduce((sum: number, item: { valor?: number; valor_numerico?: number }) =>
          sum + Number(item.valor_numerico ?? item.valor ?? 0), 0)
      : 0;

    const { error: financeError } = await supabaseAdmin
      .from('financeiro')
      .insert({
        ticket_id,
        tecnico_id: user.id,
        servico_id: servico.id,
        valor_servico: 0,
        valor_despesas: totalDespesas,
        status_faturamento: 'PENDENTE',
      });

    if (financeError) console.error('Não foi possível registrar o lançamento financeiro:', financeError);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao finalizar chamado:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno ao finalizar a ordem de serviço.' },
      { status: 500 },
    );
  }
}
