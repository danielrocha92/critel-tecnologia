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

    if (payload.type === 'ticket' && payload.id) {
      const supabase = getSupabaseAdmin();
      let ticketData = null;

      try {
        // O webhook do TomTicket só manda o ID. Precisamos buscar os dados na API!
        const apiToken = process.env.TOMTICKET_API_TOKEN;
        if (apiToken) {
          console.log(`Buscando detalhes do ticket ${payload.id} na API do TomTicket...`);
          const res = await fetch(`https://api.tomticket.com/v2.0/ticket/detail?ticket_id=${payload.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Accept': 'application/json'
            }
          });
          
          if (res.ok) {
            const apiResp = await res.json();
            // A API geralmente retorna os dados dentro de um objeto, vamos tentar pegar o raiz ou o 'data'
            ticketData = apiResp.data || apiResp.ticket || apiResp;
            console.log('✅ Dados do TomTicket recebidos com sucesso!');
          } else {
            console.error('❌ Falha ao buscar na API do TomTicket:', res.status, await res.text());
          }
        } else {
          console.error('❌ TOMTICKET_API_TOKEN não está configurado!');
        }
      } catch (err) {
        console.error('Crash ao buscar na API do TomTicket:', err);
      }

      // Se não achou na API, tenta usar o que veio no payload (fallback)
      const ticket = ticketData || payload.data || payload;
      
      const protocolo = ticket.protocol || ticket.id || ticket.protocolo || `N-A-${Date.now()}`;
      // Tratamento robusto para os nomes de campos que a API do TomTicket pode retornar
      const clienteNome = ticket.client?.name || ticket.cliente?.nome || ticket.client_name || ticket.organization?.name || 'Desconhecido';
      const titulo = ticket.subject || ticket.titulo || ticket.title || `Chamado #${protocolo}`;
      const descricao = ticket.description || ticket.descricao || ticket.message || '';
      const departamento = ticket.department?.name || ticket.departamento?.nome || ticket.department_name || null;
      const categoria = ticket.category?.name || ticket.categoria?.nome || ticket.category_name || null;
      const prioridade = ticket.priority?.name || ticket.prioridade?.nome || ticket.priority_name || null;
      const emailCliente = ticket.client?.email || ticket.cliente?.email || ticket.client_email || null;

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
