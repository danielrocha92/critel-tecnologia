import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !anonKey || !serviceRoleKey) return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });

    const cookieStore = await cookies();
    const session = createServerClient(url, anonKey, {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (values) => values.forEach(({ name, value, options }) => cookieStore.set({ name, value, ...options })),
      },
    });
    const { data: { user }, error: authError } = await session.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }
    const ticketId = body.ticket_id;
    if (typeof ticketId !== 'string' || !ticketId) return NextResponse.json({ error: 'Chamado inválido.' }, { status: 400 });

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: profile, error: profileError } = await admin.from('perfis').select('id,cargo,status').eq('user_id', user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.cargo?.trim().toUpperCase() !== 'TECNICO' || profile.status !== 'ATIVO') {
      return NextResponse.json({ error: 'Apenas técnicos ativos podem retomar chamados.' }, { status: 403 });
    }

    const { data: ticket, error: ticketError } = await admin.from('tickets')
      .select('id,status,tecnico_id,pausa_atual_id,sla_pausado_segundos')
      .eq('id', ticketId).like('protocolo_origem', 'OS-%').maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket || ticket.status !== 'PAUSADO' || !ticket.pausa_atual_id) return NextResponse.json({ error: 'Este chamado não está pausado.' }, { status: 409 });
    if (ticket.tecnico_id !== user.id && ticket.tecnico_id !== profile.id) return NextResponse.json({ error: 'Esta ordem de serviço não está atribuída a você.' }, { status: 403 });

    const { data: pause, error: pauseError } = await admin.from('ticket_pauses').select('id,reason_code,started_at,resumed_at')
      .eq('id', ticket.pausa_atual_id).eq('ticket_id', ticketId).maybeSingle();
    if (pauseError) throw pauseError;
    if (!pause || pause.resumed_at) return NextResponse.json({ error: 'Registro de pausa inválido.' }, { status: 409 });

    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);
    if (pause.reason_code === 'COMPRA_MATERIAL' && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
      && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
      const { error: locationError } = await admin.from('ticket_pause_locations').insert({ pause_id: pause.id, latitude, longitude });
      if (locationError) console.error('Não foi possível registrar o ponto final do trajeto:', locationError.message);
    }

    const resumedAt = new Date();
    const pausedSeconds = Math.max(0, Math.floor((resumedAt.getTime() - new Date(pause.started_at).getTime()) / 1000));
    const totalPausedSeconds = Number(ticket.sla_pausado_segundos || 0) + pausedSeconds;
    const { data: updatedTicket, error: updateError } = await admin.from('tickets').update({
      status: 'EM_ANDAMENTO', pausa_atual_id: null, sla_pausado_segundos: totalPausedSeconds,
      atualizado_em: resumedAt.toISOString(),
    }).eq('id', ticketId).eq('status', 'PAUSADO').eq('pausa_atual_id', pause.id)
      .select('*').maybeSingle();
    if (updateError) throw updateError;
    if (!updatedTicket) return NextResponse.json({ error: 'O chamado foi atualizado em outra sessão. Atualize a tela.' }, { status: 409 });

    const { error: closePauseError } = await admin.from('ticket_pauses').update({ resumed_at: resumedAt.toISOString() }).eq('id', pause.id).is('resumed_at', null);
    if (closePauseError) console.error('Não foi possível fechar o registro de pausa:', closePauseError.message);
    const { error: transitionError } = await admin.from('ticket_transitions').insert({
      ticket_id: ticketId, from_status: 'PAUSADO', to_status: 'EM_ANDAMENTO', changed_by: user.id,
      reason: `Chamado retomado após ${pausedSeconds} segundos de pausa.`,
    });
    if (transitionError) console.error('Não foi possível registrar a retomada:', transitionError.message);

    return NextResponse.json({ success: true, ticket: updatedTicket, paused_seconds: pausedSeconds });
  } catch (error) {
    console.error('Erro ao retomar chamado:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível retomar o chamado.' }, { status: 500 });
  }
}
