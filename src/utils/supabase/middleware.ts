import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const publicRoutes = [
    '/', 
    '/certificacoes', 
    '/clientes', 
    '/contato', 
    '/privacidade', 
    '/sobre', 
    '/solucoes', 
    '/termos',
    '/login'
  ];
  
  const pathname = request.nextUrl.pathname;
  // Remove o prefixo de idioma (/pt ou /en) para verificar a rota real
  const pathWithoutLang = pathname.replace(/^\/(pt|en)/, '') || '/';

  const isPublicPath = 
    publicRoutes.some(route => pathWithoutLang === route || pathWithoutLang.startsWith(`${route}/`)) ||
    pathname.includes('/api/auth') || 
    pathname.includes('/api/webhooks') ||
    pathname.match(/\.(.*)$/); // Allow static files like .png, .js, .css

  const isPrivatePath = !isPublicPath;
  
  if (!user && isPrivatePath) {
    // Redireciona para o login
    const url = request.nextUrl.clone()
    const segments = url.pathname.split('/').filter(Boolean);
    const lang = segments[0] || 'pt';
    url.pathname = `/${lang}/login`
    return NextResponse.redirect(url)
  }

  // Se o usuário está logado e tenta acessar a página de login, redireciona para o painel
  if (user && request.nextUrl.pathname.includes('/login')) {
    const url = request.nextUrl.clone()
    const segments = url.pathname.split('/').filter(Boolean);
    const lang = segments[0] || 'pt';
    url.pathname = `/${lang}/atendimento` // Default path
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
