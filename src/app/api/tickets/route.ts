import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
  }

  // Usar service_role key para ignorar RLS e permitir a inserção
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await request.json();
    
    // Inserir o ticket na tabela
    const { data, error } = await supabase.from('tickets').insert(payload).select().single();
    
    if (error) {
      console.error('Erro ao inserir ticket (API):', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, ticket: data });
  } catch (error: any) {
    console.error('Erro no processamento da API de tickets:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
