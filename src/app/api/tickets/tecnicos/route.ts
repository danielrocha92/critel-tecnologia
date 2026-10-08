import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/utils/supabase/server';

const ALLOWED_ROLES = new Set(['ANALISTA', 'ADMIN', 'SUPER_ADMIN']);

export async function GET() {
  const sessionClient = await createSessionClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { data: profile, error: profileError } = await sessionClient
    .from('perfis').select('cargo,status').eq('user_id', user.id).maybeSingle();
  const role = profile?.cargo?.trim().toUpperCase().replace('É', 'E') || '';
  if (profileError || profile?.status !== 'ATIVO' || !ALLOWED_ROLES.has(role)) {
    return NextResponse.json({ error: 'Acesso não permitido.' }, { status: 403 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });

  const admin = createSupabaseAdminClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: technicians, error } = await admin.from('perfis')
    .select('user_id,nome').eq('cargo', 'TECNICO').eq('status', 'ATIVO')
    .not('user_id', 'is', null).order('nome', { ascending: true });

  if (error) {
    console.error('[tickets/tecnicos] Falha ao carregar técnicos:', error);
    return NextResponse.json({ error: 'Não foi possível carregar os técnicos ativos.' }, { status: 500 });
  }

  return NextResponse.json({ tecnicos: (technicians || []).map(({ user_id, nome }) => ({ id: user_id, nome })) });
}
