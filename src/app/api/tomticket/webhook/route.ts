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
      const match = rawBody.match(/"id"\s*:\s*"([^"]+)"/);
      const valId = payload.id || (match ? match[1] : 'ID_NAO_ENCONTRADO');
      console.log(`\n========================================\nCOPIE E COLE ESTE CÓDIGO NO TOMTICKET:\n\n${valId}\n\n========================================\n`);
      return new NextResponse(valId, { status: 200 });
    }

    // --- PROTEÇÃO DE SEGURANÇA PARA CRIAÇÃO DE TICKETS ---
    /*
    // Removemos a trava HMAC estrita porque o TomTicket não envia o x-hub-signature no padrão GitHub.
    // Vamos logar os headers para ver como o TomTicket realmente manda a chave:
    console.log('Headers recebidos do TomTicket:', Object.fromEntries(request.headers.entries()));
    */
    console.log('⚠️ Verificação de assinatura (HMAC) desativada para debug.');

    if (payload.type === 'ticket') {
      const supabase = getSupabaseAdmin();
      
      const ticket = payload.data || payload;
      const protocolo = ticket.id || ticket.protocolo || `N-A-${Date.now()}`;
      const clienteNome = ticket.client?.name || ticket.cliente?.nome || 'Desconhecido';
      const titulo = ticket.subject || ticket.titulo || `Chamado #${protocolo}`;
      const descricao = ticket.description || ticket.descricao || '';
      const departamento = ticket.department?.name || ticket.departamento?.nome || null;
      const categoria = ticket.category?.name || ticket.categoria?.nome || null;
      const prioridade = ticket.priority?.name || ticket.prioridade?.nome || null;
      const emailCliente = ticket.client?.email || ticket.cliente?.email || null;

      try {
        const { error } = await supabase.from('tickets').insert({
          protocolo_origem: protocolo.toString(),
          cliente: clienteNome,
          titulo: titulo,
          descricao: descricao,
          departamento: departamento,
          categoria: categoria,
          prioridade: prioridade,
          email_cliente: emailCliente,
          status: 'NOVO'
        });
        if (error) {
          console.error('❌ Erro no Supabase:', error);
          return new NextResponse(JSON.stringify({ error }), { status: 500, headers: {'content-type': 'application/json'} });
        }
        else console.log(`✅ Chamado ${protocolo} salvo!`);
      } catch (err) {
        console.error('Crash ao inserir:', err);
      }
    } else {
      console.log('Evento não mapeado do TomTicket recebido:', payload.type, payload.action);
      // DEBUG: Salvar o payload inteiro no banco para entendermos o formato que o TomTicket envia!
      const supabase = getSupabaseAdmin();
      await supabase.from('tickets').insert({
        protocolo_origem: `DEBUG-${Date.now()}`,
        cliente: 'DEBUG TOMTICKET',
        titulo: `Tipo: ${payload.type} | Ação: ${payload.action}`,
        descricao: rawBody,
        status: 'NOVO'
      });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('❌ Erro:', error);
    return new NextResponse('OK', { status: 200 }); // Sempre retorna 200 pra nao dar URL Invalida
  }
}
