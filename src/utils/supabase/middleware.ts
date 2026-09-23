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

  let cargo: string | null = null;
  if (user) {
    const { data: perfil } = await supabase.from('perfis').select('cargo').eq('user_id', user.id).single();
    cargo = perfil?.cargo || null;
  }

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

  // Se o usuário está logado, verificamos as permissões de rota
  if (user) {
    const cargoNormalizado = cargo === 'TÉCNICO' ? 'TECNICO' : (cargo || 'VISITANTE');
    
    const roleBasePaths: Record<string, string> = {
      'TECNICO': '/tecnico',
      'FINANCEIRO': '/financeiro',
      'COMERCIAL': '/comercial',
      'ANALISTA': '/analista',
      'ADMIN': '/dashboard',
      'SUPER_ADMIN': '/dashboard'
    };
    const basePath = roleBasePaths[cargoNormalizado] || '/dashboard';

    const decodedPath = decodeURIComponent(pathWithoutLang);

    // Se o usuário digitou /técnico com acento, redireciona para /tecnico sem acento
    if (decodedPath === '/técnico' || decodedPath.startsWith('/técnico/')) {
      const url = request.nextUrl.clone();
      url.pathname = url.pathname.replace(/t%C3%A9cnico/i, 'tecnico').replace(/técnico/i, 'tecnico');
      return NextResponse.redirect(url);
    }

    const isLoginPath = pathname.includes('/login');

    if (isLoginPath) {
      // Redireciona da página de login para o painel correspondente
      const url = request.nextUrl.clone()
      const segments = url.pathname.split('/').filter(Boolean);
      const lang = segments[0] || 'pt';
      // Se for técnico, usa barra no final por precaução
      url.pathname = cargoNormalizado === 'TECNICO' ? `/${lang}/tecnico/` : `/${lang}${basePath}`;
      return NextResponse.redirect(url)
    }

    if (isPrivatePath) {
      // Admins têm acesso livre
      if (cargoNormalizado !== 'ADMIN' && cargoNormalizado !== 'SUPER_ADMIN') {
        const isAllowedPath = pathWithoutLang === basePath || 
                              pathWithoutLang.startsWith(`${basePath}/`) || 
                              pathWithoutLang === '/conta'; // rotas compartilhadas estritas
                              
        if (!isAllowedPath) {
          const url = request.nextUrl.clone();
          const segments = url.pathname.split('/').filter(Boolean);
          const lang = segments[0] || 'pt';
          url.pathname = cargoNormalizado === 'TECNICO' ? `/${lang}/tecnico/` : `/${lang}${basePath}`;
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse
}
