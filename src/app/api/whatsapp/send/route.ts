import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { to, message, conversaId } = await request.json();

    if (!to || !message || !conversaId) {
      return new NextResponse('Faltam parâmetros: to, message, conversaId', { status: 400 });
    }

    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId = process.env.META_PHONE_NUMBER_ID;

    if (!token || !phoneNumberId) {
      console.error('❌ Faltam as chaves da Meta no .env.local');
      return new NextResponse('Internal Server Error: Missing ENV', { status: 500 });
    }

    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

    // 1. Enviar para a Meta
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: {
          preview_url: false,
          body: message
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Erro da Meta ao enviar mensagem:', data);
      return new NextResponse(JSON.stringify(data), { status: response.status });
    }

    const wamid = data.messages[0].id;

    // 2. Gravar no Supabase (OUTBOUND)
    await supabase.from('whatsapp_mensagens').insert({
      conversa_id: conversaId,
      wa_message_id: wamid,
      direcao: 'OUTBOUND',
      tipo_mensagem: 'text',
      conteudo: message,
      status: 'sent'
    });

    // 3. Atualizar a conversa com a data da última mensagem
    await supabase
      .from('whatsapp_conversas')
      .update({ ultima_mensagem_data: new Date().toISOString() })
      .eq('id', conversaId);

    console.log(`✅ Mensagem enviada para ${to} com sucesso! (ID: ${wamid})`);
    return NextResponse.json({ success: true, data }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro interno no Next.js (send message):', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
