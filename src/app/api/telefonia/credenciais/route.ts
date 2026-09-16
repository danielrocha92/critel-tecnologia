import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Na infraestrutura real, essas informações virão de uma tabela de colaboradores/ramais.
  // Para testes na intranet da Critel, vamos gerar dados estáticos simulando o Issabel:
  const ramalSimulado = session.user.email?.includes('daniel') ? '1001' : '1002';

  return NextResponse.json({
    ramal: ramalSimulado,
    password: 'senha_secreta_pjsip_webrtc',
    domain: 'pabx.critel.com.br' // Domínio configurado no Issabel
  });
}
