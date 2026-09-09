import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com permissões de Admin (Service Role) para furar o RLS
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const { nome_loja, telefone_whatsapp } = await request.json();

    if (!nome_loja || !telefone_whatsapp) {
      return NextResponse.json({ error: 'Faltam dados' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('lojas_contatos')
      .upsert({
        nome_loja,
        telefone_whatsapp
      }, { onConflict: 'nome_loja' });

    if (error) {
      console.error('Erro no Supabase:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erro na API de salvar contato:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
