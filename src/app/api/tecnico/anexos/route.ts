import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createAuthenticatedClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
  try {
    const session = await createAuthenticatedClient();
    const { data: { user }, error: authError } = await session.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
    }

    const ticketId = new URL(request.url).searchParams.get('ticket_id');
    if (!ticketId) return NextResponse.json({ error: 'Chamado inválido.' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
    }

    const admin = createSupabaseClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await admin
      .from('perfis')
      .select('id, cargo, status')
      .eq('user_id', user.id)
      .maybeSingle();
    const cargo = profile?.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
    if (profileError) throw profileError;
    if (!profile || cargo !== 'TECNICO' || profile.status !== 'ATIVO') {
      return NextResponse.json({ error: 'Apenas técnicos ativos podem consultar anexos.' }, { status: 403 });
    }

    const { data: ticket, error: ticketError } = await admin
      .from('tickets')
      .select('id, tecnico_id')
      .eq('id', ticketId)
      .like('protocolo_origem', 'OS-%')
      .maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket || ![user.id, profile.id].includes(ticket.tecnico_id)) {
      return NextResponse.json({ error: 'Esta ordem de serviço não está atribuída a você.' }, { status: 403 });
    }

    const { data: attachments, error: attachmentsError } = await admin
      .from('ticket_anexos')
      .select('id, url, nome_arquivo, tamanho_bytes')
      .eq('ticket_id', ticketId);
    if (attachmentsError) throw attachmentsError;

    return NextResponse.json({ attachments: attachments || [] });
  } catch (error) {
    console.error('Erro ao consultar anexos do técnico:', error);
    const details = error instanceof Error ? error.message : 'Erro inesperado ao consultar o banco de dados.';
    if (process.env.NODE_ENV !== 'production') {
      return NextResponse.json({ error: 'Erro ao consultar os anexos.', details }, { status: 500 });
    }
    return NextResponse.json({ error: 'Não foi possível carregar os anexos do chamado.' }, { status: 500 });
  }
}
