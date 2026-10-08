import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient as createSessionClient } from '@/utils/supabase/server';

const READ_ROLES = new Set(['ANALISTA', 'FINANCEIRO', 'ADMIN', 'SUPER_ADMIN']);
const WRITE_ROLES = new Set(['ADMIN', 'SUPER_ADMIN']);

async function authorize(allowedRoles: Set<string>) {
  const sessionClient = await createSessionClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return { error: NextResponse.json({ error: 'Não autorizado.' }, { status: 401 }) };

  const { data: perfil, error: perfilError } = await sessionClient
    .from('perfis')
    .select('cargo,status')
    .eq('user_id', user.id)
    .maybeSingle();
  const cargo = perfil?.cargo?.trim().toUpperCase().replace('É', 'E') || '';

  if (perfilError || perfil?.status !== 'ATIVO' || !allowedRoles.has(cargo)) {
    return { error: NextResponse.json({ error: 'Acesso não permitido.' }, { status: 403 }) };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return { error: NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 }) };
  }

  return {
    user,
    cargo,
    admin: createSupabaseAdmin(url, key, { auth: { autoRefreshToken: false, persistSession: false } }),
  };
}

function cleanText(value: unknown, maxLength = 500) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

function extractGmail(value: string | null) {
  return value?.match(/(?:^|[\s,;<])([A-Z0-9._%+-]+@gmail\.com)(?=$|[\s,;>])/i)?.[1]?.toLowerCase() || null;
}

export async function GET() {
  const access = await authorize(READ_ROLES);
  if ('error' in access) return access.error;

  const { data: profiles, error: profilesError } = await access.admin
    .from('perfis')
    .select('id,nome,email,cargo,status,user_id')
    .eq('cargo', 'TECNICO')
    .order('nome');

  if (profilesError) {
    return NextResponse.json({ error: 'Não foi possível carregar os técnicos.' }, { status: 500 });
  }

  const profileIds = (profiles || []).map((profile) => profile.id);
  const { data: details, error: detailsError } = profileIds.length
    ? await access.admin.from('tecnicos_detalhes').select('*').in('perfil_id', profileIds)
    : { data: [], error: null };

  if (detailsError) {
    return NextResponse.json({ error: 'Não foi possível carregar os detalhes dos técnicos. Aplique a migração do banco.' }, { status: 500 });
  }

  const detailsByProfile = new Map((details || []).map((detail) => [detail.perfil_id, detail]));
  return NextResponse.json({
    permissoes: { podeEditar: WRITE_ROLES.has(access.cargo) },
    tecnicos: (profiles || []).map(({ id, nome, email, status, user_id }) => ({
      id,
      nome,
      email: detailsByProfile.get(id)?.email_contato || email,
      status,
      contaCriada: Boolean(user_id),
      detalhes: detailsByProfile.get(id) || null,
    })),
  });
}

export async function POST(request: Request) {
  const access = await authorize(WRITE_ROLES);
  if ('error' in access) return access.error;

  try {
    const payload = await request.json();
    const profileId = cleanText(payload.id, 80);
    const nome = cleanText(payload.nome, 150);
    const emailContato = cleanText(payload.email_contato, 500);
    const gmail = extractGmail(emailContato);
    const emailPerfil = gmail || emailContato?.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0]?.toLowerCase() || null;

    if (!nome) return NextResponse.json({ error: 'Informe o nome do técnico.' }, { status: 400 });

    let existingProfile: { id: string; user_id: string | null; cargo: string } | null = null;
    if (profileId) {
      const { data, error } = await access.admin
        .from('perfis')
        .select('id,user_id,cargo')
        .eq('id', profileId)
        .maybeSingle();
      if (error || !data || data.cargo !== 'TECNICO') {
        return NextResponse.json({ error: 'O perfil do técnico não foi encontrado.' }, { status: 404 });
      }
      existingProfile = data;
    } else if (emailContato) {
      const { data: detailMatch, error: detailMatchError } = await access.admin
        .from('tecnicos_detalhes')
        .select('perfil_id')
        .eq('email_contato', emailContato)
        .maybeSingle();
      if (detailMatchError) return NextResponse.json({ error: 'Não foi possível conferir o cadastro existente. Aplique a migração do banco.' }, { status: 500 });

      if (detailMatch?.perfil_id) {
        const { data, error } = await access.admin.from('perfis').select('id,user_id,cargo').eq('id', detailMatch.perfil_id).maybeSingle();
        if (error || !data) return NextResponse.json({ error: 'O perfil associado ao cadastro não foi encontrado.' }, { status: 500 });
        existingProfile = data;
      } else if (emailPerfil) {
        const { data, error } = await access.admin.from('perfis').select('id,user_id,cargo').eq('email', emailPerfil).maybeSingle();
        if (error) return NextResponse.json({ error: 'Não foi possível conferir o e-mail informado.' }, { status: 500 });
        if (data && data.cargo !== 'TECNICO') {
          return NextResponse.json({ error: 'Este e-mail já pertence a um usuário de outro cargo.' }, { status: 409 });
        }
        existingProfile = data;
      }
    }

    let profileIdToSave = existingProfile?.id || null;
    if (existingProfile) {
      const updates: Record<string, unknown> = { nome };
      const { error } = await access.admin.from('perfis').update(updates).eq('id', existingProfile.id);
      if (error) return NextResponse.json({ error: 'Não foi possível atualizar o perfil do técnico.' }, { status: 500 });
    } else {
      const { data, error } = await access.admin
        .from('perfis')
        .insert({ nome, email: null, cargo: 'TECNICO', status: 'PENDENTE' })
        .select('id')
        .single();
      if (error || !data) return NextResponse.json({ error: 'Não foi possível criar o pré-cadastro do técnico.' }, { status: 500 });
      profileIdToSave = data.id;
    }

    let conviteEnviado = false;
    let avisoConvite: string | null = null;
    if (gmail && !existingProfile?.user_id) {
      const origin = new URL(request.url).origin;
      const { data: inviteData, error: inviteError } = await access.admin.auth.admin.inviteUserByEmail(gmail, {
        data: { nome, cargo: 'TECNICO' },
        redirectTo: `${origin}/api/auth/callback?next=/pt/pendente`,
      });

      if (inviteError) {
        avisoConvite = 'O pré-cadastro foi salvo, mas o convite não pôde ser enviado. Verifique se este Gmail já possui conta e tente novamente.';
      } else if (inviteData.user && profileIdToSave) {
        const { error } = await access.admin.from('perfis').update({ user_id: inviteData.user.id }).eq('id', profileIdToSave);
        if (error) {
          avisoConvite = 'O convite foi enviado, mas não foi possível vincular a conta ao perfil. Revise o cadastro antes de reenviar.';
        } else {
          conviteEnviado = true;
        }
      }
    }

    const detailPayload = {
      perfil_id: profileIdToSave,
      situacao_cadastro: cleanText(payload.situacao_cadastro, 150),
      empresa: cleanText(payload.empresa, 250),
      situacao_faiston: cleanText(payload.situacao_faiston, 150),
      cpf: cleanText(payload.cpf, 30),
      rg: cleanText(payload.rg, 50),
      endereco: cleanText(payload.endereco, 500),
      cidade: cleanText(payload.cidade, 150),
      estado: cleanText(payload.estado, 2),
      cep: cleanText(payload.cep, 20),
      telefone: cleanText(payload.telefone, 80),
      email_contato: emailContato,
      codigo_parceiro: cleanText(payload.codigo_parceiro, 100),
      especialidades: cleanText(payload.especialidades, 1000),
      atualizado_em: new Date().toISOString(),
    };
    const { error: detailError } = await access.admin
      .from('tecnicos_detalhes')
      .upsert(detailPayload, { onConflict: 'perfil_id' });

    if (detailError) {
      return NextResponse.json({ error: 'O perfil foi salvo, mas os detalhes não foram gravados. Aplique a migração e tente novamente.', parcial: true }, { status: 500 });
    }

    return NextResponse.json({ success: true, conviteEnviado, avisoConvite });
  } catch (error) {
    console.error('[tecnicos-parceiros] Falha ao salvar cadastro:', error);
    return NextResponse.json({ error: 'Não foi possível salvar o cadastro.' }, { status: 500 });
  }
}
