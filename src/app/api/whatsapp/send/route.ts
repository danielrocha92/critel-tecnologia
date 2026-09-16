import { NextResponse } from 'next/server';
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
    const supabase = getSupabaseAdmin();
    const { to, message, conversaId, nomePerfil } = await request.json();

    if (!to || !message || !conversaId) {
      return new NextResponse('Faltam parâmetros: to, message, conversaId', { status: 400 });
    }

    let finalConversaId = conversaId;

    // Se for uma nova conversa, cria no banco primeiro
    if (finalConversaId === 'nova') {
      const { data: novaConv, error: convError } = await supabase
        .from('whatsapp_conversas')
        .insert({
          telefone: to,
          nome_perfil: nomePerfil || to,
          ultimo_status: 'ABERTA'
        })
        .select()
        .single();
        
      if (convError) {
        console.error('❌ Erro ao criar nova conversa:', convError);
        return new NextResponse('Erro ao criar conversa', { status: 500 });
      }
      finalConversaId = novaConv.id;
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
      conversa_id: finalConversaId,
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
      .eq('id', finalConversaId);

    console.log(`✅ Mensagem enviada para ${to} com sucesso! (ID: ${wamid})`);
    return NextResponse.json({ success: true, data, conversaId: finalConversaId }, { status: 200 });

  } catch (error) {
    console.error('❌ Erro interno no Next.js (send message):', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
