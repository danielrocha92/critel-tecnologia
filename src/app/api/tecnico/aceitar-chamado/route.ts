import { NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createAuthenticatedClient } from '@/utils/supabase/server';

const closedStatuses = ['RESOLVIDO', 'FECHADO', 'FINALIZADO', 'CONCLUIDO', 'CANCELADO'];

export async function POST(request: Request) {
  try {
    const supabase = await createAuthenticatedClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Sessão expirada. Entre novamente.' }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!serviceRoleKey || !supabaseUrl) {
      return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('perfis')
      .select('cargo, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const cargo = profile?.cargo?.trim().toUpperCase().replace('É', 'E');
    if (profileError || !profile || cargo !== 'TECNICO' || profile.status !== 'ATIVO') {
      return NextResponse.json({ error: 'Apenas técnicos ativos podem aceitar chamados.' }, { status: 403 });
    }

    let body: { ticket_id?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Corpo da requisição inválido.' }, { status: 400 });
    }

    const ticketId = body.ticket_id;
    if (typeof ticketId !== 'string' || !ticketId.trim()) {
      return NextResponse.json({ error: 'Identificador do chamado inválido.' }, { status: 400 });
    }

    const { data: ticket, error: updateError } = await supabaseAdmin
      .from('tickets')
      .update({
        tecnico_id: user.id,
        status: 'ABERTO',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', ticketId)
      .not('analista_id', 'is', null)
      .is('tecnico_id', null)
      .not('status', 'in', `(${closedStatuses.map((status) => `"${status}"`).join(',')})`)
      .like('protocolo_origem', 'OS-%')
      .select('*')
      .maybeSingle();

    if (updateError) throw updateError;
    if (!ticket) {
      return NextResponse.json(
        { error: 'Este chamado já foi vinculado ou não está mais disponível.' },
        { status: 409 },
      );
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    console.error('Erro ao aceitar chamado:', error);
    return NextResponse.json({ error: 'Não foi possível aceitar o chamado.' }, { status: 500 });
  }
}