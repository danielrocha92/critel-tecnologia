import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VERIFY_TOKEN = 'critel_whatsapp_verificacao';

// Cliente Supabase com permissões de Admin (Service Role)
const getSupabaseAdmin = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase environment variables are missing');
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ Webhook da Meta verificado com sucesso!');
    return new NextResponse(challenge, { status: 200 });
  }

  return new NextResponse('Forbidden', { status: 403 });
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseAdmin();
    const body = await request.json();

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          
          // MENSAGEM RECEBIDA
          if (change.value && change.value.messages) {
            const message = change.value.messages[0];
            const contact = change.value.contacts[0];
            
            const telefoneContato = contact.wa_id;
            const nomeContato = contact.profile.name;
            const textoMensagem = message.text?.body || '[Mídia recebida]';
            const wamid = message.id;

            console.log(`💬 Nova mensagem de ${nomeContato} (${telefoneContato}): ${textoMensagem}`);

            // 1. Garantir que a conversa existe (ou atualizar data)
            const { data: conversa, error: convError } = await supabase
              .from('whatsapp_conversas')
              .upsert({
                telefone: telefoneContato,
                nome_perfil: nomeContato,
                ultimo_status: 'ABERTA',
                ultima_mensagem_data: new Date().toISOString()
              }, { onConflict: 'telefone' })
              .select('id')
              .single();

            if (convError || !conversa) {
              console.error('Erro ao fazer upsert na conversa:', convError);
              continue; // pula pra próxima mensagem se der erro aqui
            }

            // 2. Inserir a mensagem
            await supabase.from('whatsapp_mensagens').insert({
              conversa_id: conversa.id,
              wa_message_id: wamid,
              direcao: 'INBOUND',
              tipo_mensagem: message.type || 'text',
              conteudo: textoMensagem,
              status: 'delivered'
            });
            
          } 
          // STATUS DE MENSAGEM ENVIADA
          else if (change.value && change.value.statuses) {
            const status = change.value.statuses[0];
            const wamid = status.id;
            const statusType = status.status; // sent, delivered, read

            console.log(`✅ Status da mensagem ${wamid} atualizado para: ${statusType}`);

            await supabase
              .from('whatsapp_mensagens')
              .update({ status: statusType })
              .eq('wa_message_id', wamid);
          }
        }
      }

      return NextResponse.json({ success: true }, { status: 200 });
    }
    
    return new NextResponse('Not a WhatsApp Event', { status: 404 });
  } catch (error) {
    console.error('❌ Erro no webhook da Meta:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
