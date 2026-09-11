import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, registrarAuditoria } from '@/lib/auditoria';
import { decrypt } from '@/lib/crypto';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { sistema } = await req.json();

    if (!sistema) {
      return NextResponse.json({ error: 'Sistema não informado' }, { status: 400 });
    }

    // 1. Validar autenticação do usuário logado via cookies (usando Supabase SSR)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            // Em rotas API route handler podemos apenas definir cookies na resposta se precisarmos atualizar tokens
            // Não é estritamente necessário para getUser se já estiver logado
          }
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // 2. Buscar credenciais no cofre
    const { data: credencial, error: cofreError } = await supabaseAdmin
      .from('cofre_credenciais')
      .select('usuario_login, senha_criptografada')
      .eq('sistema', sistema)
      .single();

    if (cofreError || !credencial) {
      return NextResponse.json({ error: 'Credencial não encontrada' }, { status: 404 });
    }

    // 3. Descriptografar a senha
    const senha = decrypt(credencial.senha_criptografada);

    // 4. Logar auditoria
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';
    await registrarAuditoria(user.id, sistema, ip, userAgent);

    // 5. Autenticar no sistema de destino (Proxy)
    let integracaoResult: { success: boolean; sessionCookie?: string; error?: string };

    if (sistema === 'Milvus') {
      const { loginMilvus } = await import('@/lib/integrations/milvus');
      integracaoResult = await loginMilvus(credencial.usuario_login, senha);
    } else if (sistema === 'Stoq') {
      const { loginStoq } = await import('@/lib/integrations/stoq');
      integracaoResult = await loginStoq(credencial.usuario_login, senha);
    } else {
      // Mock para Gmail (ainda não implementado)
      integracaoResult = { success: true, sessionCookie: `session_${sistema.toLowerCase()}=mock_token; HttpOnly; Secure; Path=/` };
    }

    if (!integracaoResult.success) {
      return NextResponse.json({ error: integracaoResult.error }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, message: `Autenticado com sucesso em ${sistema}` });
    
    if (integracaoResult.sessionCookie) {
      // Para múltiplos cookies (se retornado pela API), seria necessário um parse mais elaborado.
      // O Next.js headers append lidará com isso.
      response.headers.append('Set-Cookie', integracaoResult.sessionCookie);
    }

    return response;
  } catch (error: any) {
    console.error('Erro na rota SSO:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
