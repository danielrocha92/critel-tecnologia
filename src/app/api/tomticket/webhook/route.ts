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
      let debugApiError = '';

      try {
        const apiToken = process.env.TOMTICKET_API_TOKEN;
        if (apiToken) {
          const res = await fetch(`https://api.tomticket.com/v2.0/ticket/detail?ticket_id=${payload.id}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${apiToken}`,
              'Accept': 'application/json'
            }
          });
          
          if (res.ok) {
            const apiResp = await res.json();
            ticketData = apiResp.data || apiResp.ticket || apiResp;
          } else {
            debugApiError = `ERRO API HTTP ${res.status}`;
          }
        } else {
          debugApiError = 'ERRO: TOMTICKET_API_TOKEN faltando na Vercel';
        }
      } catch (err: any) {
        debugApiError = `CRASH FETCH: ${err.message}`;
      }

      const ticket = ticketData || payload.data || payload;
      
      const protocolo = ticket.protocol || ticket.id || ticket.protocolo || `N-A-${Date.now()}`;
      
      // O TomTicket retorna os dados do cliente dentro de 'customer'
      const clienteNome = ticket.customer?.name || ticket.client?.name || ticket.cliente?.nome || 'Desconhecido';
      
      // Se deu erro na API, mostramos no título para ficar fácil de debugar na tela
      const titulo = debugApiError 
        ? `[${debugApiError}] Chamado #${protocolo}` 
        : (ticket.subject || ticket.titulo || ticket.title || `Chamado #${protocolo}`);
        
      const descricao = ticket.message || ticket.description || ticket.descricao || '';
      const departamento = ticket.department?.name || ticket.departamento?.nome || null;
      const categoria = ticket.category?.name || ticket.categoria?.nome || null;
      const prioridade = ticket.priority ? String(ticket.priority) : null;
      const emailCliente = ticket.customer?.email || ticket.client?.email || null;
      
      // Captura de status e atendente, caso o TomTicket envie
      // No TomTicket, ticket.status ou ticket.situation costuma vir com os dados da situação atual
      const statusOrigem = ticket.status?.name || ticket.status || 'NOVO';
      
      let analistaId = null;
      const atendenteObj = ticket.attendant || ticket.atendente || ticket.operator;
      if (atendenteObj) {
        const nomeToSearch = typeof atendenteObj === 'string' ? atendenteObj : (atendenteObj.name || atendenteObj.nome || atendenteObj.email);
        if (nomeToSearch) {
          // Tenta extrair a primeira parte se vier formatado como "Nome | Empresa"
          const searchName = nomeToSearch.split('|')[0].trim();
          
          const { data: perfilData } = await supabase
            .from('perfis')
            .select('id')
            .ilike('nome', `%${searchName}%`)
            .limit(1);
            
          if (perfilData && perfilData.length > 0) {
            analistaId = perfilData[0].id;
          }
        }
      }

      try {
        // Verifica se o chamado já existe
        const { data: chamadosExistentes } = await supabase
          .from('tickets')
          .select('id')
          .eq('protocolo_origem', protocolo.toString())
          .order('criado_em', { ascending: true });

        if (chamadosExistentes && chamadosExistentes.length > 0) {
          // Atualiza o chamado existente mais antigo (e ignoramos/podemos limpar os duplicados depois)
          const ticketId = chamadosExistentes[0].id;
          const { error } = await supabase
            .from('tickets')
            .update({
              cliente: clienteNome,
              titulo: titulo,
              descricao: descricao,
              departamento: departamento,
              categoria: categoria,
              prioridade: prioridade,
              email_cliente: emailCliente,
              analista_id: analistaId,
              tomticket_id: ticket.id,
              // Opcional: Atualizar status e atendente_id aqui se conseguirmos mapear com nosso banco
              atualizado_em: new Date().toISOString()
            })
            .eq('id', ticketId);

          if (error) {
            console.error('❌ Erro no Supabase Update:', error);
            return new NextResponse(JSON.stringify({ error }), { status: 500, headers: {'content-type': 'application/json'} });
          } else {
            console.log(`✅ Chamado ${protocolo} ATUALIZADO com sucesso!`);
          }
        } else {
          // Inserção nova
          const { error } = await supabase.from('tickets').insert({
            protocolo_origem: protocolo.toString(),
            cliente: clienteNome,
            titulo: titulo,
            descricao: descricao,
            departamento: departamento,
            categoria: categoria,
            prioridade: prioridade,
            email_cliente: emailCliente,
            analista_id: analistaId,
            tomticket_id: ticket.id,
            status: 'NOVO'
          });
          
          if (error) {
            console.error('❌ Erro no Supabase Insert:', error);
            return new NextResponse(JSON.stringify({ error }), { status: 500, headers: {'content-type': 'application/json'} });
          } else {
            console.log(`✅ Chamado ${protocolo} SALVO com sucesso!`);
          }
        }
      } catch (err) {
        console.error('Crash ao inserir/atualizar:', err);
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
