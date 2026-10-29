import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

    const body = await request.json();
    const evidenceId = typeof body.evidence_id === 'string' ? body.evidence_id : '';
    if (!evidenceId) return NextResponse.json({ error: 'Identificador da foto inválido.' }, { status: 400 });

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: evidence, error: evidenceError } = await admin
      .from('ticket_evidences')
      .select('id, ticket_id, media_url')
      .eq('id', evidenceId)
      .maybeSingle();
    if (evidenceError) throw evidenceError;
    if (!evidence) return NextResponse.json({ error: 'Esta foto já foi removida.' }, { status: 404 });

    const { data: ticket, error: ticketError } = await admin
      .from('tickets')
      .select('id, tecnico_id, protocolo_origem')
      .eq('id', evidence.ticket_id)
      .like('protocolo_origem', 'OS-%')
      .maybeSingle();
    if (ticketError) throw ticketError;
    if (!ticket) return NextResponse.json({ error: 'Ordem de serviço não encontrada.' }, { status: 404 });

    const { data: profile, error: profileError } = await admin
      .from('perfis')
      .select('id, cargo')
      .eq('user_id', user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    const cargo = profile?.cargo?.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toUpperCase();
    const isAnalyst = ['ANALISTA', 'ADMIN', 'SUPER_ADMIN'].includes(cargo || '');
    const isAssignedTechnician = ticket.tecnico_id === user.id || ticket.tecnico_id === profile?.id;
    if (!isAnalyst && !isAssignedTechnician) {
      return NextResponse.json({ error: 'Você não tem permissão para excluir esta foto.' }, { status: 403 });
    }

    const imageUrl = new URL(evidence.media_url);
    const storagePrefix = '/storage/v1/object/public/anexos/';
    const objectPath = imageUrl.pathname.startsWith(storagePrefix)
      ? decodeURIComponent(imageUrl.pathname.slice(storagePrefix.length))
      : '';
    if (imageUrl.origin !== new URL(supabaseUrl).origin || !objectPath.startsWith(`evidences/${evidence.ticket_id}/`)) {
      return NextResponse.json({ error: 'O arquivo da foto não pertence a esta ordem de serviço.' }, { status: 400 });
    }

    const { error: deleteError } = await admin.from('ticket_evidences').delete().eq('id', evidenceId);
    if (deleteError) throw deleteError;

    const { error: storageError } = await admin.storage.from('anexos').remove([objectPath]);
    if (storageError) console.error('A evidência foi removida, mas o arquivo do Storage não:', storageError.message);

    return NextResponse.json({ success: true, id: evidenceId });
  } catch (error) {
    console.error('Erro ao excluir evidência:', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao excluir a foto.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
