import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function GET(request: Request) {
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

  const { data: credenciais, error } = await supabaseAdmin
    .from('cofre_credenciais')
    .select('*')
    .eq('sistema', 'Stoq')
    .single()

  if (error || !credenciais) {
    return NextResponse.json({ error: 'Credenciais não encontradas no cofre' }, { status: 404 })
  }

  // 3. Fazer requisição de Login para a plataforma de destino (Stoq) a partir do Backend
  // Exemplo estrutural de login (os endpoints exatos dependem da plataforma alvo)
  /*
  const loginResponse = await fetch('https://ajuda.stoq.com.br/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: credenciais.usuario_login,
      password: credenciais.senha_criptografada // Descriptografar se aplicável
    })
  })
  
  const targetCookies = loginResponse.headers.get('set-cookie')
  */

  // 4. Retornar resposta injetando cookies ou redirecionando para a rota de proxy
  // O payload da senha NUNCA desce para o front-end (Prevenção de vazamento de DOM)
  const response = NextResponse.redirect(new URL('/(painel)/atendimento', request.url))
  
  // response.headers.set('Set-Cookie', `stoq_session=token_gerado_no_backend; HttpOnly; Secure; Path=/`)

  return response
}
