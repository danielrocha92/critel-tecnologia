import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const TECHNICIAN_DOMAIN = 'criteltecnologia.com.br';

function normalizeRole(role: string | null) {
  return role
    ?.normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toUpperCase() || '';
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/pt/login?error=login_google`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string) {
          cookieStore.delete(name);
        },
      },
    }
  );

  const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);
  const loginUrl = (error: string) => NextResponse.redirect(`${origin}/pt/login?error=${error}`);
  const clearSession = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Erro ao encerrar sessão OAuth:', error);
  };

  if (authError || !authData.user) {
    return loginUrl('login_google');
  }

  const email = authData.user.email?.trim().toLowerCase();
  const emailParts = email?.split('@') || [];
  if (emailParts.length !== 2 || emailParts[1] !== TECHNICIAN_DOMAIN) {
    await clearSession();
    return loginUrl('dominio_restrito');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Supabase não configurado para provisionamento seguro de perfil OAuth.');
    await clearSession();
    return loginUrl('erro_perfil');
  }

  const admin = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: perfilEncontrado, error: perfilError } = await admin
    .from('perfis')
    .select('cargo,status')
    .eq('user_id', authData.user.id)
    .maybeSingle();
  let perfil = perfilEncontrado;

  if (perfilError) {
    console.error('Erro ao consultar perfil do usuário OAuth:', perfilError);
    await clearSession();
    return loginUrl('erro_perfil');
  }

  if (!perfil) {
    const { data: perfilExistente, error: buscaError } = await admin
      .from('perfis')
      .select('id,user_id,cargo,status')
      .eq('email', email)
      .maybeSingle();

    if (buscaError) {
      console.error('Erro ao localizar cadastro pelo e-mail OAuth:', buscaError);
      await clearSession();
      return loginUrl('erro_perfil');
    }

    if (perfilExistente?.user_id && perfilExistente.user_id !== authData.user.id) {
      await clearSession();
      return loginUrl('perfil_vinculado');
    }

    if (perfilExistente) {
      const { error } = await admin
        .from('perfis')
        .update({ user_id: authData.user.id })
        .eq('id', perfilExistente.id);

      if (error) {
        console.error('Erro ao vincular conta Google ao pré-cadastro:', error);
        await clearSession();
        return loginUrl('erro_perfil');
      }

      perfil = { cargo: perfilExistente.cargo, status: perfilExistente.status };
    } else {
      const nome = authData.user.user_metadata.full_name
        || authData.user.user_metadata.name
        || emailParts[0];
      const { data: novoPerfil, error } = await admin
        .from('perfis')
        .insert({
          user_id: authData.user.id,
          email,
          nome,
          cargo: 'TECNICO',
          status: 'PENDENTE',
        })
        .select('cargo,status')
        .single();

      if (error || !novoPerfil) {
        console.error('Erro ao criar perfil técnico pendente para OAuth:', error);
        await clearSession();
        return loginUrl('erro_perfil');
      }

      perfil = novoPerfil;
    }
  }

  if (perfil.status?.trim().toUpperCase() === 'PENDENTE') {
    return NextResponse.redirect(`${origin}/pt/pendente`);
  }

  if (perfil.status?.trim().toUpperCase() !== 'ATIVO') {
    await clearSession();
    return loginUrl('acesso_negado');
  }

  const cargoNormalizado = normalizeRole(perfil.cargo);
  const roleBasePaths: Record<string, string> = {
    TECNICO: '/tecnico/os',
    FINANCEIRO: '/financeiro',
    COMERCIAL: '/comercial',
    ANALISTA: '/analista',
    ADMIN: '/dashboard',
    SUPER_ADMIN: '/dashboard',
  };
  const basePath = roleBasePaths[cargoNormalizado];

  if (!basePath) {
    await clearSession();
    return loginUrl('acesso_negado');
  }

  const response = NextResponse.redirect(`${origin}/pt${basePath}`);
  response.cookies.set('user_cargo', perfil.cargo, { path: '/', maxAge: 60 * 60 * 8 });
  return response;
}
