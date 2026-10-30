import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const CLOSED_STATUSES = ['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO', 'CANCELADO'];

export async function POST(request: Request) {
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

    const body = await request.json().catch(() => null) as { action?: unknown; ticket_id?: unknown; changes?: unknown } | null;
    if (!body || typeof body.ticket_id !== 'string' || !['cancelar', 'excluir', 'editar'].includes(String(body.action))) {
      return NextResponse.json({ error: 'Ação ou chamado inválido.' }, { status: 400 });
    }

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: profile, error: profileError } = await admin.from('perfis')
      .select('id,cargo,status').eq('user_id', user.id).maybeSingle();
    if (profileError) throw profileError;
    const role = profile?.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
    if (!profile || profile.status !== 'ATIVO') return NextResponse.json({ error: 'Perfil ativo não encontrado.' }, { status: 403 });

    const { data: ticket, error: ticketError } = await admin.from('tickets')
      .select('id,status,tecnico_id,protocolo_origem,pausa_atual_id,sla_pausado_segundos')
      .eq('id', body.ticket_id).like('protocolo_origem', 'OS-%').maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ordem de serviço não encontrada.' }, { status: 404 });

    if (body.action === 'excluir') {
      if (!['ADMIN', 'SUPER_ADMIN'].includes(role || '')) {
        return NextResponse.json({ error: 'Somente administradores podem excluir ordens de serviço.' }, { status: 403 });
      }
      const { error: deleteError } = await admin.from('tickets').delete().eq('id', ticket.id);
      if (deleteError) throw deleteError;
      return NextResponse.json({ success: true });
    }

    const isAnalystOrAdmin = ['ANALISTA', 'ADMIN', 'SUPER_ADMIN'].includes(role || '');
    const isAssignedTechnician = role === 'TECNICO' && (ticket.tecnico_id === user.id || ticket.tecnico_id === profile.id);
    if (body.action === 'editar') {
      if (!isAnalystOrAdmin && !isAssignedTechnician) {
        return NextResponse.json({ error: 'Você não tem permissão para editar esta ordem de serviço.' }, { status: 403 });
      }
      if (CLOSED_STATUSES.includes(ticket.status)) {
        return NextResponse.json({ error: 'Chamados encerrados não podem ser editados.' }, { status: 409 });
      }
      if (!body.changes || typeof body.changes !== 'object' || Array.isArray(body.changes)) {
        return NextResponse.json({ error: 'Dados de edição inválidos.' }, { status: 400 });
      }
      const changes = body.changes as Record<string, unknown>;
      const fields = ['titulo', 'descricao', 'departamento', 'categoria', 'prioridade'] as const;
      if (fields.some((field) => typeof changes[field] !== 'string')) {
        return NextResponse.json({ error: 'Preencha todos os campos da edição.' }, { status: 400 });
      }
      const updates = {
        titulo: String(changes.titulo).trim().slice(0, 250),
        descricao: String(changes.descricao).slice(0, 10000),
        departamento: String(changes.departamento).trim().slice(0, 150),
        categoria: String(changes.categoria).trim().slice(0, 150),
        prioridade: String(changes.prioridade).trim().slice(0, 50),
        atualizado_em: new Date().toISOString(),
      };
      if (!updates.titulo) return NextResponse.json({ error: 'O assunto é obrigatório.' }, { status: 400 });
      const { data: updatedTicket, error: editError } = await admin.from('tickets').update(updates)
        .eq('id', ticket.id).eq('status', ticket.status).select('*').maybeSingle();
      if (editError) throw editError;
      if (!updatedTicket) return NextResponse.json({ error: 'O chamado foi alterado em outra sessão. Atualize a tela.' }, { status: 409 });
      const { error: transitionError } = await admin.from('ticket_transitions').insert({
        ticket_id: ticket.id, from_status: ticket.status, to_status: ticket.status, changed_by: user.id,
        reason: `Dados da OS editados: ${fields.join(', ')}.`,
      });
      if (transitionError) console.error('Não foi possível registrar a edição da OS:', transitionError.message);
      return NextResponse.json({ success: true, ticket: updatedTicket });
    }

    if (!isAnalystOrAdmin && !isAssignedTechnician) {
      return NextResponse.json({ error: 'Você não tem permissão para cancelar esta ordem de serviço.' }, { status: 403 });
    }
    if (CLOSED_STATUSES.includes(ticket.status)) {
      return NextResponse.json({ error: 'Este chamado já foi encerrado.' }, { status: 409 });
    }

    const canceledAt = new Date();
    let pausedSeconds = 0;
    if (ticket.status === 'PAUSADO' && ticket.pausa_atual_id) {
      const { data: pause, error: pauseError } = await admin.from('ticket_pauses').select('started_at')
        .eq('id', ticket.pausa_atual_id).maybeSingle();
      if (pauseError) throw pauseError;
      if (pause) {
        pausedSeconds = Math.max(0, Math.floor((canceledAt.getTime() - new Date(pause.started_at).getTime()) / 1000));
        const { error: closePauseError } = await admin.from('ticket_pauses')
          .update({ resumed_at: canceledAt.toISOString() }).eq('id', ticket.pausa_atual_id).is('resumed_at', null);
        if (closePauseError) throw closePauseError;
      }
    }

    const { data: updatedTicket, error: updateError } = await admin.from('tickets').update({
      status: 'CANCELADO', pausa_atual_id: null,
      sla_pausado_segundos: Number(ticket.sla_pausado_segundos || 0) + pausedSeconds,
      atualizado_em: canceledAt.toISOString(),
    }).eq('id', ticket.id).eq('status', ticket.status).select('id').maybeSingle();
    if (updateError) throw updateError;
    if (!updatedTicket) return NextResponse.json({ error: 'O chamado foi alterado em outra sessão. Atualize a tela.' }, { status: 409 });

    const { error: transitionError } = await admin.from('ticket_transitions').insert({
      ticket_id: ticket.id, from_status: ticket.status, to_status: 'CANCELADO', changed_by: user.id,
      reason: 'Ordem de serviço cancelada pelo usuário responsável.',
    });
    if (transitionError) console.error('Não foi possível registrar o cancelamento da OS:', transitionError.message);

    return NextResponse.json({ success: true, status: 'CANCELADO' });
  } catch (error) {
    console.error('Erro ao gerenciar ordem de serviço:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Não foi possível concluir a ação.' }, { status: 500 });
  }
}
