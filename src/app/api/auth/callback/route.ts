import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // if "next" is in param, use it as the redirect URL
  // Default to /pt/login but immediately redirecting to dashboard or tecnico
  const next = searchParams.get('next') ?? '/pt/login'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    const { data: authData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && authData.user) {
      // Verificar qual é o cargo do usuário para redirecionar corretamente
      const { data: perfilData } = await supabase
        .from('perfis')
        .select('cargo')
        .eq('user_id', authData.user.id)
        .single()
        
      if (perfilData?.cargo === 'TECNICO') {
        return NextResponse.redirect(`${origin}/pt/tecnico`)
      } else {
        return NextResponse.redirect(`${origin}/pt/dashboard`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/pt/login?error=Ocorreu um erro no login`)
}
