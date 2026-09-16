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

// GET: Verificação inicial do Webhook pela Meta
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const VERIFY_TOKEN = process.env.META_WEBHOOK_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verificado pela Meta!');
      return new NextResponse(challenge, { status: 200 });
    } else {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
  return new NextResponse('Bad Request', { status: 400 });
}

// POST: Recebimento de mensagens (Inbound)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Verifica se é um evento válido do WhatsApp
    if (body.object !== 'whatsapp_business_account') {
      return new NextResponse('Not Found', { status: 404 });
    }

    const supabase = getSupabaseAdmin();

    for (const entry of body.entry) {
      const changes = entry.changes[0];
      const value = changes.value;
      const messages = value.messages;

      if (messages && messages.length > 0) {
        const message = messages[0];
        const contact = value.contacts[0];
        
        const telefone = message.from; // Número de quem enviou
        const wamid = message.id; // ID da mensagem da Meta
        const nomePerfil = contact.profile.name || telefone;
        let conteudo = '';
        const tipo_mensagem = message.type;

        if (tipo_mensagem === 'text') {
          conteudo = message.text.body;
        } else if (tipo_mensagem === 'image' || tipo_mensagem === 'document' || tipo_mensagem === 'audio') {
          conteudo = `[Mídia recebida: ${tipo_mensagem}]`;
          // Na v2, poderemos baixar a mídia usando a Graph API e salvar no Storage
        } else {
          conteudo = `[Mensagem não suportada: ${tipo_mensagem}]`;
        }

        // 1. Procurar se a conversa já existe
        let { data: conversa } = await supabase
          .from('whatsapp_conversas')
          .select('id')
          .eq('telefone', telefone)
          .single();

        let conversaId = conversa?.id;

        // 2. Se não existir, criar a conversa
        if (!conversaId) {
          const { data: novaConv, error: errCria } = await supabase
            .from('whatsapp_conversas')
            .insert({
              telefone: telefone,
              nome_perfil: nomePerfil,
              ultimo_status: 'ABERTA'
            })
            .select()
            .single();
            
          if (errCria) {
            console.error('Erro ao criar conversa no webhook:', errCria);
            continue;
          }
          conversaId = novaConv.id;
        } else {
          // Atualiza a data da última mensagem
          await supabase
            .from('whatsapp_conversas')
            .update({ ultima_mensagem_data: new Date().toISOString(), ultimo_status: 'ABERTA' })
            .eq('id', conversaId);
        }

        // 3. Inserir a mensagem como INBOUND
        // O Supabase vai disparar o evento em Realtime pro Front-end automaticamente!
        const { error: errMsg } = await supabase
          .from('whatsapp_mensagens')
          .insert({
            conversa_id: conversaId,
            wa_message_id: wamid,
            direcao: 'INBOUND',
            tipo_mensagem: tipo_mensagem,
            conteudo: conteudo,
            status: 'delivered'
          });

        if (errMsg) {
          console.error('Erro ao salvar mensagem no Supabase:', errMsg);
        } else {
          console.log(`✅ Mensagem recebida de ${telefone}: ${conteudo}`);
        }
      }
    }

    return new NextResponse('EVENT_RECEIVED', { status: 200 });

  } catch (error) {
    console.error('❌ Erro no Webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
