import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, 
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { 
      ticket_id, 
      hora_inicio, 
      hora_termino, 
      descricao_servicos, 
      materiais_utilizados, 
      latitude, 
      longitude, 
      assinatura_base64,
      evidencia_antes_base64,
      evidencia_depois_base64,
      despesas_json,
      assinatura_datahora
    } = body;

    if (!ticket_id || !latitude || !longitude || !descricao_servicos) {
      return NextResponse.json({ error: 'Dados obrigatórios ausentes (GPS, Descrição ou Ticket)' }, { status: 400 });
    }

    // Check if it's already finalized to prevent duplicate financial records
    const { data: existingTicket } = await supabaseAdmin
      .from('tickets')
      .select('status')
      .eq('id', ticket_id)
      .single();

    if (existingTicket?.status === 'FINALIZADO') {
      return NextResponse.json({ error: 'Este chamado já foi finalizado.' }, { status: 400 });
    }

    // 1. Update Ticket Status
    const { error: ticketError } = await supabaseAdmin
      .from('tickets')
      .update({ 
        status: 'FINALIZADO', 
        atualizado_em: new Date().toISOString(),
        checkout_lat: latitude,
        checkout_lng: longitude,
        checkout_at: new Date().toISOString(),
        evidencia_antes_base64,
        evidencia_depois_base64,
        despesas_json,
        assinatura_datahora
      })
      .eq('id', ticket_id);

    if (ticketError) throw ticketError;

    // 2. Insert into servicos_concluidos
    const { data: servico, error: servicoError } = await supabaseAdmin
      .from('servicos_concluidos')
      .insert({
        ticket_id,
        tecnico_id: user.id,
        hora_inicio,
        hora_termino,
        descricao_servicos,
        materiais_utilizados,
        latitude,
        longitude,
        assinatura_base64
      })
      .select('id')
      .single();

    if (servicoError) {
      console.error('Erro ao inserir servicos_concluidos:', servicoError);
      throw new Error('Falha ao registrar relatório do serviço.');
    }

    // Calcular total de despesas
    let totalDespesas = 0;
    if (despesas_json && Array.isArray(despesas_json)) {
      totalDespesas = despesas_json.reduce((sum, d) => sum + (d.valor_numerico || 0), 0);
    }

    // 3. Insert into financeiro (valor_servico removido das inputs do técnico, assume-se 0)
    const { error: finError } = await supabaseAdmin
      .from('financeiro')
      .insert({
        ticket_id,
        tecnico_id: user.id,
        servico_id: servico?.id || null,
        valor_servico: 0,
        valor_despesas: totalDespesas,
        status_faturamento: 'PENDENTE'
      });

    if (finError) {
      console.error('Erro ao inserir financeiro:', finError);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro em finalizar-chamado:', error);
    return NextResponse.json({ error: error.message || 'Erro interno do servidor' }, { status: 500 });
  }
}
