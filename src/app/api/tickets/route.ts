import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Verificação de autenticação com Supabase SSR
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.set({ name, value: '', ...options });
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    let parsedData: any = {};
    let uploadedUrls: string[] = [];

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const payloadString = formData.get('payload') as string;
      parsedData = JSON.parse(payloadString);
      const files = formData.getAll('files') as File[];
      
      for (const file of files) {
        if (!file.name) continue;
        
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('anexos')
          .upload(`tickets/${fileName}`, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error('Erro ao fazer upload para o Supabase Storage:', uploadError);
          continue;
        }
        
        const { data: urlData } = supabase.storage.from('anexos').getPublicUrl(`tickets/${fileName}`);
        uploadedUrls.push(urlData.publicUrl);
      }
    } else {
      parsedData = await req.json();
    }

    const { titulo, descricao, cliente, departamento, prioridade, status, tecnico_id, protocolo_origem } = parsedData;

    if (!titulo || !descricao) {
      return NextResponse.json({ error: 'Campos título e descrição são obrigatórios' }, { status: 400 });
    }

    // Insere no banco Supabase
    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        titulo,
        descricao,
        departamento: departamento || 'Suporte',
        categoria: 'Geral',
        prioridade: prioridade || 'Normal',
        status: status || 'NOVO',
        cliente: cliente || 'Cliente Padrão',
        tecnico_id: tecnico_id || null
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Erro ao inserir ticket no Supabase:', ticketError);
      throw new Error(ticketError.message);
    }

    // Adiciona anexos se houver
    if (uploadedUrls.length > 0 && ticketData) {
      const anexosPayload = uploadedUrls.map(url => ({
        ticket_id: ticketData.id,
        url,
        nome_arquivo: url.split('/').pop() || 'anexo',
        tipo_arquivo: 'desconhecido'
      }));

      const { error: anexosError } = await supabase
        .from('ticket_anexos')
        .insert(anexosPayload);
        
      if (anexosError) {
        console.error('Erro ao inserir anexos:', anexosError);
      }
    }

    // Event Sourcing
    await supabase.from('ticket_transitions').insert({
      ticket_id: ticketData.id,
      from_status: null,
      to_status: ticketData.status,
      changed_by: user.id,
      reason: 'Criação do chamado'
    });

    return NextResponse.json({ success: true, ticketId: ticketData.id }, { status: 201 });

  } catch (error: any) {
    console.error('Erro na API POST /api/tickets:', error);
    return NextResponse.json({ error: 'Falha interna ao criar chamado', details: error.message }, { status: 500 });
  }
}
