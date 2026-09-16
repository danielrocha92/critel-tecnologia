import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const getSupabaseAdmin = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are missing');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-hub-signature');
    const secret = process.env.TOMTICKET_SECRET;

    console.log('--- TOMTICKET WEBHOOK DEBUG ---');
    console.log('HEADERS:', Object.fromEntries(request.headers.entries()));
    console.log('BODY:', rawBody);
    console.log('-------------------------------');

    let payload: any = {};
    try {
      if (rawBody) {
        payload = JSON.parse(rawBody);
      }
    } catch (err) {
      console.log('Não foi JSON, ignorando parse.');
    }

    // Se for validação (independente de como vier)
    if (payload.action === 'validation' || rawBody.includes('validation')) {
      console.log('✅ TomTicket enviou um código de validação!');
      // Tenta extrair o ID mesmo se for string
      const match = rawBody.match(/"id"\s*:\s*"([^"]+)"/);
      const valId = payload.id || (match ? match[1] : 'ID_NAO_ENCONTRADO');
      console.log(`\n========================================\nCOPIE E COLE ESTE CÓDIGO NO TOMTICKET:\n\n${valId}\n\n========================================\n`);
      
      // Retorna 200 OK vazio para não confundir o parser do TomTicket
      return new NextResponse(valId, { status: 200 });
    }

    if (payload.type === 'ticket') {
      const supabase = getSupabaseAdmin();
      const protocolo = payload.id || payload.protocolo || 'N/A';
      const titulo = payload.subject || payload.titulo || `Chamado #${protocolo}`;
      const descricao = payload.description || payload.mensagem || payload.historico || '';
      const clienteNome = payload.client?.name || payload.nome_cliente || payload.cliente || 'Desconhecido';
      
      const { error } = await supabase.from('tickets').insert({
        protocolo_origem: protocolo.toString(),
        cliente: clienteNome,
        titulo: titulo,
        descricao: descricao,
        status: 'NOVO'
      });
      if (error) console.error('❌ Erro no Supabase:', error);
      else console.log(`✅ Chamado ${protocolo} salvo!`);
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Erro:', error);
    return new NextResponse('OK', { status: 200 }); // Sempre retorna 200 pra nao dar URL Invalida
  }
}
