import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/utils/supabase/server';

const APPROVER_ROLES = new Set(['ANALISTA', 'ADMIN', 'SUPER_ADMIN']);

function normalizeRole(role: string | null) {
  return role
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase() || '';
}

export async function POST(request: Request) {
  const sessionClient = await createSessionClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { data: approver, error: approverError } = await sessionClient
    .from('perfis')
    .select('cargo,status')
    .eq('user_id', user.id)
    .maybeSingle();

  if (
    approverError
    || approver?.status !== 'ATIVO'
    || !APPROVER_ROLES.has(normalizeRole(approver?.cargo || null))
  ) {
    return NextResponse.json({ error: 'Apenas analistas e administradores ativos podem aprovar técnicos.' }, { status: 403 });
  }
  const approverRole = normalizeRole(approver.cargo);

  let perfilId: unknown;
  try {
    ({ perfilId } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Corpo da solicitação inválido.' }, { status: 400 });
  }

  if (typeof perfilId !== 'string' || !perfilId.trim()) {
    return NextResponse.json({ error: 'Informe o perfil do técnico.' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase não configurado para aprovação de técnicos.');
    return NextResponse.json({ error: 'Serviço de aprovação indisponível.' }, { status: 500 });
  }

  const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: target, error: targetError } = await admin
    .from('perfis')
    .select('cargo,status')
    .eq('id', perfilId.trim())
    .maybeSingle();

  if (targetError) {
    console.error('Erro ao localizar perfil para aprovação:', targetError);
    return NextResponse.json({ error: 'Não foi possível consultar o cadastro.' }, { status: 500 });
  }

  if (
    !target
    || (approverRole === 'ANALISTA' && normalizeRole(target.cargo) !== 'TECNICO')
    || target.status !== 'PENDENTE'
  ) {
    return NextResponse.json({ error: 'A solicitação não está pendente ou não pode ser aprovada por este perfil.' }, { status: 409 });
  }

  const { data: updated, error: updateError } = await admin
    .from('perfis')
    .update({ status: 'ATIVO' })
    .eq('id', perfilId.trim())
    .eq('status', 'PENDENTE')
    .select('id')
    .maybeSingle();

  if (updateError) {
    console.error('Erro ao aprovar perfil técnico:', updateError);
    return NextResponse.json({ error: 'Não foi possível aprovar o técnico.' }, { status: 500 });
  }

  if (!updated) {
    return NextResponse.json({ error: 'A solicitação já foi processada.' }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
