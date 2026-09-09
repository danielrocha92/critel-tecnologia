import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sistema: string }> }
) {
  // Extract dynamic segment
  const { sistema } = await params;
  
  // 1. Validar se o usuário está logado na Intranet
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Buscar credenciais no Cofre (Usando Service Role para bypass no RLS)
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Map URLs dynamically based on the system
  let targetUrl = '';
  // Resolve case insensitivity for 'Stoq', 'Zendesk', 'Milvus'
  const targetSistema = sistema.charAt(0).toUpperCase() + sistema.slice(1).toLowerCase();

  const { data: credenciais, error } = await supabaseAdmin
    .from('cofre_credenciais')
    .select('*')
    .eq('sistema', targetSistema)
    .single()

  if (error || !credenciais) {
    return NextResponse.json({ error: `Credenciais não encontradas no cofre para a plataforma: ${targetSistema}` }, { status: 404 })
  }

  // 3. Definir URL de Redirecionamento
  if (targetSistema === 'Stoq') {
    targetUrl = 'https://ajuda.stoq.com.br/hc/pt-br';
  } else if (targetSistema === 'Milvus') {
    targetUrl = 'https://app.milvus.com.br';
  } else {
    targetUrl = 'https://intranet.critel.com.br/pt/atendimento';
  }

  // 4. Retornar resposta injetando cookies (Simulação Proxy SSO Backend)
  // O payload da senha NUNCA desce para o front-end (Prevenção de vazamento de DOM)
  const response = NextResponse.redirect(new URL(targetUrl))
  
  // Set proxy authenticated session cookie logically in a real world proxy implementation.
  response.headers.set('Set-Cookie', `${targetSistema.toLowerCase()}_session=proxy_token_backend_injected; HttpOnly; Secure; Path=/`)

  return response
}
