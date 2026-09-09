import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  // 1. Validar se quem chama é ADMIN
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

  // Obter perfil do usuário logado
  const { data: perfil } = await supabase
    .from('perfis')
    .select('cargo')
    .eq('user_id', user.id)
    .single()

  if (!perfil || perfil.cargo !== 'ADMIN') {
    return NextResponse.json({ error: 'Acesso negado. Apenas administradores podem usar o Botão de Pânico.' }, { status: 403 })
  }

  // 2. Extrair ID do usuário alvo
  const { targetUserId } = await request.json()

  if (!targetUserId) {
    return NextResponse.json({ error: 'ID do usuário alvo é obrigatório' }, { status: 400 })
  }

  // 3. Revogar sessões usando Service Role (Admin API)
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Deslogar de todas as sessões ativas (Supabase signOut for other user is not directly exposed in JS client,
  // mas podemos banir temporariamente ou deletar os refresh tokens).
  // Uma forma eficaz no Supabase é atualizar o usuário para banido (Desligamento em cadeia).
  const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(
    targetUserId,
    { ban_duration: '876000h' } // Bane por 100 anos, invalidando o acesso imediatamente
  )

  if (banError) {
    return NextResponse.json({ error: banError.message }, { status: 500 })
  }

  return NextResponse.json({ message: 'Acesso revogado com sucesso. Todas as sessões foram invalidadas (Botão de Pânico acionado).' })
}
