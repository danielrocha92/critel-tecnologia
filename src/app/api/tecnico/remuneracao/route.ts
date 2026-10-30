import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/server';

const allowedRoles = new Set(['ANALISTA', 'ADMIN', 'SUPER_ADMIN']);

export async function PATCH(request: Request) {
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });

  const { data: profile, error: profileError } = await session.from('perfis')
    .select('id,cargo,status').eq('user_id', user.id).maybeSingle();
  const role = profile?.cargo?.trim().toUpperCase().replace('É', 'E') || '';
  if (profileError || !profile || profile.status !== 'ATIVO' || !allowedRoles.has(role)) {
    return NextResponse.json({ error: 'Apenas analistas e administradores podem alterar a remuneração.' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
  }

  const userId = body.user_id;
  const modalidade = body.modalidade_pagamento;
  const valor = body.valor_pagamento;
  if (typeof userId !== 'string' || !userId || (modalidade !== 'diaria' && modalidade !== 'chamado') || typeof valor !== 'number' || !Number.isFinite(valor) || valor <= 0) {
    return NextResponse.json({ error: 'Informe técnico, modalidade e valor válido.' }, { status: 400 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
  const admin = createSupabaseAdminClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: technician, error } = await admin.from('perfis').update({ modalidade_pagamento: modalidade, valor_pagamento: valor })
    .eq('user_id', userId).eq('cargo', 'TECNICO').select('user_id').maybeSingle();
  if (error) return NextResponse.json({ error: 'Não foi possível atualizar a remuneração.', details: error.message }, { status: 500 });
  if (!technician) return NextResponse.json({ error: 'Técnico não encontrado.' }, { status: 404 });
  return NextResponse.json({ success: true });
}
