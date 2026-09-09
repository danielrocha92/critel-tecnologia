import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Função para iniciar um client Supabase que contorna o RLS
const getSupabaseAdmin = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
};

export async function POST(request: Request) {
  try {
    const { loja } = await request.json();
    if (!loja) return NextResponse.json({ error: 'Loja não informada' }, { status: 400 });

    console.log(`[Milvus On-Demand] Checando status do PDV: ${loja}...`);

    // Aqui faremos a chamada HTTP real para o Milvus usando a API Key no futuro.
    // Simulação por enquanto (Mock): Gerar uma quantidade aleatória de PDVs (1 a 4)
    const qtdPdvs = Math.floor(Math.random() * 4) + 1;
    const pdvsMockados = [];
    for (let i = 1; i <= qtdPdvs; i++) {
      pdvsMockados.push({
        nome: `Caixa 0${i}`,
        status: Math.random() > 0.3 ? 'ONLINE' : 'OFFLINE'
      });
    }

    const supabase = getSupabaseAdmin();
    
    // Atualiza a tabela com o array de PDVs convertido em String (JSON)
    const { error } = await supabase
      .from('status_pdv')
      .upsert({ 
        loja, 
        status_conexao: JSON.stringify(pdvsMockados) 
      }, { onConflict: 'loja' });

    if (error) {
      console.error('[Milvus] Erro ao salvar banco:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, status: statusRandomico });
  } catch (error) {
    console.error('[Milvus] Falha na consulta sob demanda:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
