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

    if (!secret) {
      console.error('❌ Segredo TOMTICKET_SECRET não configurado no .env.local');
      return new NextResponse('Internal Server Error', { status: 500 });
    }

    if (!signature) {
      return new NextResponse('Forbidden: No signature', { status: 403 });
    }

    // 1. Verificação de Autenticidade (HMAC-SHA1)
    const hmac = crypto.createHmac('sha1', secret).update(rawBody).digest('hex');
    if (hmac !== signature) {
      console.error('❌ Assinatura inválida do TomTicket', { recebida: signature, esperada: hmac });
      return new NextResponse('Forbidden: Invalid signature', { status: 403 });
    }

    // 2. Parse do payload seguro
    const payload = JSON.parse(rawBody);

    // 3. Validação Inicial da URL pelo TomTicket
    if (payload.action === 'validation' && payload.type === 'account') {
      console.log('✅ TomTicket enviou um código de validação!');
      console.log(`\n========================================\nCOPIE E COLE ESTE CÓDIGO NO TOMTICKET:\n\n${payload.id}\n\n========================================\n`);
      return NextResponse.json({ success: true, message: 'Validacao registrada no console.' }, { status: 200 });
    }

    // 4. Processar criação/atualização de chamados (Tickets)
    // O payload exato depende da documentação, mas vamos extrair os dados comuns:
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
        status: 'NOVO' // Todo ticket do TomTicket entra como NOVO no nosso painel
      });

      if (error) {
        console.error('❌ Erro ao salvar ticket no Supabase:', error);
        return new NextResponse('Error saving ticket', { status: 500 });
      }

      console.log(`✅ Chamado do TomTicket importado com sucesso: ${protocolo}`);
    } else {
      console.log('Evento não mapeado do TomTicket recebido:', payload.type, payload.action);
    }

    return new NextResponse('OK', { status: 200 });

  } catch (error) {
    console.error('❌ Erro no Webhook do TomTicket:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
