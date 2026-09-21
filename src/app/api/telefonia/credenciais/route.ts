import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Na infraestrutura real, essas informações virão de uma tabela de colaboradores/ramais.
  // Para testes na intranet da Critel, vamos gerar dados estáticos simulando o Issabel:
  const ramalSimulado = user.email?.includes('daniel') ? '1001' : '1002';

  return NextResponse.json({
    ramal: ramalSimulado,
    password: 'senha_secreta_pjsip_webrtc',
    domain: 'pabx.critel.com.br' // Domínio configurado no Issabel
  });
}
