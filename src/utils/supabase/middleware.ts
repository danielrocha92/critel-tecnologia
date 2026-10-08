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
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
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

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname;
  const pathWithoutLang = pathname.replace(/^\/(pt|en)/, '') || '/';

  const publicRoutes = [
    '/', '/certificacoes', '/clientes', '/contato',
    '/privacidade', '/sobre', '/solucoes', '/termos', '/login'
  ];

  const isPublicPath =
    publicRoutes.some(route => pathWithoutLang === route || pathWithoutLang.startsWith(`${route}/`)) ||
    pathname.includes('/api/') ||
    pathname.match(/\.(.*)$/);

  const isLoginPath = pathWithoutLang === '/login';

  // 1. Redireciona usuários não logados que tentam acessar rotas privadas
  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    const lang = url.pathname.split('/')[1] || 'pt';
    url.pathname = `/${lang}/login`;
    return NextResponse.redirect(url);
  }

  // 2. Lógica para usuários logados
  if (user) {
    // Fetch cargo and status directly from DB to avoid stale cookies leading to redirect loops
    const { data: perfil } = await supabase.from('perfis').select('cargo, status').eq('user_id', user.id).single();
    const cargo = perfil?.cargo || null;
    const status = perfil?.status || null;

    // Se estiver bloqueado ou pendente e não for rota pública, desloga ou deixa no login
    if (status && status !== 'ATIVO' && !isPublicPath) {
      const url = request.nextUrl.clone();
      const lang = url.pathname.split('/')[1] || 'pt';
      url.pathname = `/${lang}/login`;
      return NextResponse.redirect(url);
    }

    const cargoNormalizado = (cargo || 'VISITANTE').trim().toUpperCase().replace('É', 'E');

    const roleBasePaths: Record<string, string> = {
      'TECNICO': '/tecnico/os',
      'FINANCEIRO': '/financeiro',
      'COMERCIAL': '/comercial',
      'ANALISTA': '/analista',
      'ADMIN': '/dashboard',
      'SUPER_ADMIN': '/dashboard'
    };
    const basePath = roleBasePaths[cargoNormalizado] || '/dashboard';
    const canViewTechnicianDashboard = ['ANALISTA', 'FINANCEIRO', 'ADMIN', 'SUPER_ADMIN'].includes(cargoNormalizado);
    const isTechnicianDashboardRoute = pathWithoutLang === '/tecnico'
      || pathWithoutLang === '/tecnicos-parceiros'
      || pathWithoutLang.startsWith('/tecnicos-parceiros/');

    if (isTechnicianDashboardRoute && !canViewTechnicianDashboard) {
      const url = request.nextUrl.clone();
      const lang = url.pathname.split('/')[1] || 'pt';
      url.pathname = `/${lang}${basePath}`;
      return NextResponse.redirect(url);
    }

    // 2.a Redireciona da página de login para o painel correto
    if (isLoginPath) {
      if (status === 'ATIVO') {
        const url = request.nextUrl.clone();
        const lang = url.pathname.split('/')[1] || 'pt';
        url.pathname = `/${lang}${basePath}`;
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    // 2.b Restringe acesso a rotas privadas baseadas no cargo
    if (!isPublicPath) {
      if (cargoNormalizado !== 'ADMIN' && cargoNormalizado !== 'SUPER_ADMIN') {
        const isOwnBasePath = pathWithoutLang === basePath || pathWithoutLang.startsWith(`${basePath}/`);

        let isShared = false;
        // Técnicos ficam isolados no portal operacional (/tecnico/os).
        if (cargoNormalizado !== 'TECNICO') {
          const sharedRoutes = ['/conta', '/all-tickets', '/my-tickets', '/atendimentos', '/atendimento', '/analista', '/os', '/clientes', '/relatorios', '/base-conhecimento', '/ajuda', '/tecnicos-parceiros'];
          isShared = pathWithoutLang === '/tecnico'
            || sharedRoutes.some(route => pathWithoutLang === route || pathWithoutLang.startsWith(`${route}/`));
        }

        if (!isOwnBasePath && !isShared) {
          const url = request.nextUrl.clone();
          const lang = url.pathname.split('/')[1] || 'pt';
          url.pathname = `/${lang}${basePath}`;
          return NextResponse.redirect(url);
        }
      }
    }
  }

  return supabaseResponse;
}
