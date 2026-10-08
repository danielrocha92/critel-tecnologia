import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/auditoria';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
    }

    const { data: perfil, error: perfilError } = await supabase
      .from('perfis')
      .select('cargo, status')
      .eq('user_id', user.id)
      .maybeSingle();

    const cargo = perfil?.cargo
      ?.normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .trim()
      .toUpperCase();
    const permitido = ['SUPER_ADMIN', 'ADMIN', 'ANALISTA'].includes(cargo ?? '')
      && perfil?.status?.trim().toUpperCase() === 'ATIVO';

    if (perfilError || !permitido) {
      return NextResponse.json({ error: 'Sem permissão para acessar o monitoramento.' }, { status: 403 });
    }

    const pdvs = [];
    const pageSize = 1000;
    for (let offset = 0; ; offset += pageSize) {
      const { data, error } = await supabaseAdmin
        .from('bacio_pdv_status')
        .select('loja_codigo, pdv_codigo, pdv_nome, status_conexao, ultima_verificacao')
        .order('loja_codigo')
        .order('pdv_codigo')
        .range(offset, offset + pageSize - 1);

      if (error) {
        console.error('[Monitoramento Bacio] Falha ao consultar status:', error.message);
        return NextResponse.json({ error: 'Não foi possível carregar os status dos PDVs.' }, { status: 503 });
      }

      pdvs.push(...(data ?? []));
      if (!data || data.length < pageSize) break;
    }

    return NextResponse.json({ pdvs }, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    console.error('[Monitoramento Bacio] Erro inesperado:', error);
    return NextResponse.json({ error: 'Falha ao consultar o monitoramento.' }, { status: 500 });
  }
}
