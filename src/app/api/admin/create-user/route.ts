import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/utils/supabase/server';

const ADMIN_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);
const ALLOWED_ROLES = new Set(['TECNICO', 'ADMIN', 'SUPER_ADMIN', 'COMERCIAL', 'FINANCEIRO', 'ANALISTA']);

type CreateUserPayload = {
  nome?: unknown;
  email?: unknown;
  senha?: unknown;
  cargo?: unknown;
};

function normalizeRole(role: string | null) {
  return role
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase() || '';
}

function isDuplicateEmailError(error: { code?: string; message: string }) {
  return error.code === 'email_exists'
    || error.code === 'user_already_exists'
    || error.message.toLowerCase().includes('already been registered');
}

export async function POST(request: Request) {
  const sessionClient = await createSessionClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { data: requester, error: requesterError } = await sessionClient
    .from('perfis')
    .select('cargo,status')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (
    requesterError
    || requester?.status !== 'ATIVO'
    || !ADMIN_ROLES.has(normalizeRole(requester?.cargo || null))
  ) {
    return NextResponse.json({ error: 'Apenas administradores ativos podem criar usuários.' }, { status: 403 });
  }

  let payload: CreateUserPayload;
  try {
    payload = await request.json() as CreateUserPayload;
  } catch {
    return NextResponse.json({ error: 'Corpo da solicitação inválido.' }, { status: 400 });
  }

  const nome = typeof payload.nome === 'string' ? payload.nome.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const senha = typeof payload.senha === 'string' ? payload.senha : '';
  const cargo = typeof payload.cargo === 'string' ? payload.cargo.trim().toUpperCase() : '';

  if (!nome || !email || !senha || !cargo) {
    return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || senha.length < 8 || !ALLOWED_ROLES.has(cargo)) {
    return NextResponse.json({ error: 'E-mail, senha ou cargo inválido.' }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase não configurado para criação de usuários.');
    return NextResponse.json({ error: 'Serviço de criação de usuários indisponível.' }, { status: 500 });
  }

  const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: createdAuth, error: createAuthError } = await admin.auth.admin.createUser({
    email,
    password: senha,
    email_confirm: true,
    user_metadata: { nome, cargo },
  });

  let userId = createdAuth.user?.id;
  let accountAlreadyExisted = false;

  if (createAuthError) {
    if (!isDuplicateEmailError(createAuthError)) {
      console.error('Erro ao criar usuário no Auth:', createAuthError);
      return NextResponse.json(
        { error: createAuthError.message },
        { status: createAuthError.status && createAuthError.status >= 400 ? createAuthError.status : 500 }
      );
    }

    accountAlreadyExisted = true;
    const { data: existingProfile, error: profileLookupError } = await admin
      .from('perfis')
      .select('id,user_id,cargo,status')
      .eq('email', email)
      .limit(1)
      .maybeSingle();

    if (profileLookupError) {
      console.error('Erro ao localizar perfil pelo e-mail existente:', profileLookupError);
      return NextResponse.json({ error: 'Não foi possível localizar o cadastro existente.' }, { status: 500 });
    }

    if (existingProfile?.user_id) {
      return NextResponse.json({
        error: `Este e-mail já possui uma conta (${existingProfile.cargo}, ${existingProfile.status}). O cadastro e a senha foram mantidos; consulte a tela de aprovação se estiver pendente.`,
        code: 'user_already_registered',
      }, { status: 409 });
    }

    let existingAuthUser: { id: string } | undefined;
    for (let page = 1; !existingAuthUser; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) {
        console.error('Erro ao localizar conta Auth existente:', error);
        return NextResponse.json({ error: 'Não foi possível localizar a conta Auth existente.' }, { status: 500 });
      }

      existingAuthUser = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
      if (existingAuthUser || page >= data.lastPage) break;
    }

    if (!existingAuthUser) {
      console.error('O Auth informou e-mail duplicado, mas a conta não foi encontrada.');
      return NextResponse.json({ error: 'A conta já existe, mas não foi possível localizá-la para concluir o cadastro.' }, { status: 409 });
    }

    userId = existingAuthUser.id;

    if (existingProfile) {
      const { error } = await admin
        .from('perfis')
        .update({ user_id: userId })
        .eq('id', existingProfile.id)
        .is('user_id', null);

      if (error) {
        console.error('Erro ao vincular conta existente ao pré-cadastro:', error);
        return NextResponse.json({ error: 'Não foi possível vincular a conta ao pré-cadastro.' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        linkedExistingAccount: true,
        message: `Conta existente vinculada ao pré-cadastro. Cargo e status foram preservados (${existingProfile.cargo}, ${existingProfile.status}); a senha não foi alterada.`,
      });
    }
  }

  if (!userId) {
    console.error('O Supabase Auth não retornou o identificador do usuário criado.');
    return NextResponse.json({ error: 'Não foi possível confirmar o usuário criado.' }, { status: 500 });
  }

  const { data: linkedProfile, error: linkedProfileError } = await admin
    .from('perfis')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (linkedProfileError) {
    console.error('Erro ao consultar perfil do usuário criado:', linkedProfileError);
    return NextResponse.json({ error: 'Não foi possível consultar o perfil do usuário.' }, { status: 500 });
  }

  const profileValues = {
    user_id: userId,
    nome,
    email,
    cargo,
    status: cargo === 'TECNICO' ? 'PENDENTE' : 'ATIVO',
  };
  const profileWrite = linkedProfile
    ? await admin.from('perfis').update(profileValues).eq('id', linkedProfile.id)
    : await admin.from('perfis').insert(profileValues);

  if (profileWrite.error) {
    console.error('Erro ao salvar perfil do usuário:', profileWrite.error);
    return NextResponse.json({ error: 'A conta foi localizada, mas não foi possível salvar o perfil.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    linkedExistingAccount: accountAlreadyExisted,
    pendingApproval: cargo === 'TECNICO',
    message: accountAlreadyExisted
      ? 'Conta existente vinculada. A senha não foi alterada.'
      : cargo === 'TECNICO'
        ? 'Técnico cadastrado e aguardando aprovação.'
        : 'Usuário criado com sucesso.',
  });
}
