import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
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
        .select('cargo, status')
        .eq('user_id', authData.user.id)
        .single()
        
      if (perfilData?.status === 'PENDENTE') {
        return NextResponse.redirect(`${origin}/pt/pendente`)
      }
        
      const cargo = perfilData?.cargo;
      const cargoStr = cargo || 'VISITANTE';
      const cargoNormalizado = cargoStr
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .trim()
        .toUpperCase();
      const roleBasePaths: Record<string, string> = {
        'TECNICO': '/tecnico/os',
        'FINANCEIRO': '/financeiro',
        'COMERCIAL': '/comercial',
        'ANALISTA': '/analista',
        'ADMIN': '/dashboard',
        'SUPER_ADMIN': '/dashboard'
      };
      const basePath = roleBasePaths[cargoNormalizado] || '/dashboard';

      const response = NextResponse.redirect(`${origin}/pt${basePath}`);
      if (cargo) {
        response.cookies.set('user_cargo', cargo, { path: '/', maxAge: 60 * 60 * 8 });
      }
      return response;
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/pt/login?error=Ocorreu um erro no login`)
}
