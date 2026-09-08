import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';



export async function POST(request: Request) {
  // Usar a service role key para ter permissão de escrita segura no servidor
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('ERRO: Chaves do Supabase ausentes no .env.local');
    return NextResponse.json({ error: 'Configuração do servidor ausente' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const payload = await request.json();
    
    // Validação básica do payload (exemplo: TomTicket)
    if (!payload || !payload.id) {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const { id, protocolo, cliente, titulo, descricao } = payload;
    
    // RF06: Radar de Obras
    // Regex para detectar obras/mobilização: /(obra|reforma).*?(aprovação|mobilização|desmobilização)/i
    const radarRegex = /(obra|reforma).*?(aprovação|mobilização|desmobilização)/i;
    const textToTest = `${titulo} ${descricao}`;
    
    if (radarRegex.test(textToTest)) {
      console.log(`[Radar de Obras] Chamado ${id} interceptado e desviado.`);
      
      // Inserir primeiro o ticket base (já que a tabela de radar exige a foreign key)
      const { data: ticketBase, error: errBase } = await supabase.from('tickets').insert({
        protocolo_origem: protocolo || id,
        cliente: cliente || 'Não identificado',
        titulo: titulo || 'Sem título',
        descricao: descricao,
        status: 'RADAR_OBRAS'
      }).select().single();

      if (errBase) {
        console.error('Erro ao inserir ticket base para o radar:', errBase);
      } else if (ticketBase) {
        // Agora insere o alerta no radar
        await supabase.from('radar_obras_mobilizacao').insert({
          ticket_origem_id: ticketBase.id,
          loja_afetada: cliente || 'Desconhecida',
          trecho_detectado: textToTest.substring(0, 200),
          status_oportunidade: 'PENDENTE'
        });
      }
      
      return NextResponse.json({ success: true, message: 'Desviado para Radar de Obras' });
    } else {
      console.log(`[Fila Normal] Chamado ${id} processado.`);
      
      // Inserir na tabela normal de tickets (onde a UI está escutando)
      const { error } = await supabase.from('tickets').insert({
        protocolo_origem: protocolo || id,
        cliente: cliente || 'Não identificado',
        titulo: titulo || 'Sem título',
        descricao: descricao,
        status: 'NOVO'
      });
      
      if (error) {
        console.error('Erro ao inserir ticket:', error);
        throw error;
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook processado com sucesso' });

  } catch (error: any) {
    console.error('Erro no processamento do webhook:', error);
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 });
  }
}
