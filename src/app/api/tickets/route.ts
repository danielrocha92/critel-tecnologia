import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type TicketPayload = {
  title: string;
  description: string;
  department: string;
  category: string;
  priority: string;
};

function parseTicketPayload(value: unknown): TicketPayload | null {
  if (!value || typeof value !== 'object') return null;

  const payload = value as Record<string, unknown>;
  if (typeof payload.title !== 'string' || !payload.title.trim()) return null;
  if (typeof payload.description !== 'string' || !payload.description.trim()) return null;

  return {
    title: payload.title.trim(),
    description: payload.description.trim(),
    department: typeof payload.department === 'string' && payload.department.trim() ? payload.department.trim() : 'Suporte',
    category: typeof payload.category === 'string' && payload.category.trim() ? payload.category.trim() : 'Geral',
    priority: typeof payload.priority === 'string' && payload.priority.trim() ? payload.priority.trim() : 'Normal',
  };
}

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

    let payloadValue: unknown;
    let files: File[] = [];
    const uploadedUrls: string[] = [];

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const payloadString = formData.get('payload');
      if (typeof payloadString !== 'string') {
        return NextResponse.json({ error: 'Payload do chamado inválido' }, { status: 400 });
      }

      try {
        payloadValue = JSON.parse(payloadString) as unknown;
      } catch {
        return NextResponse.json({ error: 'Payload do chamado contém JSON inválido' }, { status: 400 });
      }

      files = formData.getAll('files').filter((file): file is File => file instanceof File);

      for (const file of files) {
        if (!file.name) continue;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

        const { error: uploadError } = await supabase.storage
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
      try {
        payloadValue = await req.json();
      } catch {
        return NextResponse.json({ error: 'Corpo da requisição contém JSON inválido' }, { status: 400 });
      }
    }

    const payload = parseTicketPayload(payloadValue);
    if (!payload) {
      return NextResponse.json({ error: 'Campos título e descrição são obrigatórios' }, { status: 400 });
    }

    const { data: ticketData, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        titulo: payload.title,
        descricao: payload.description,
        departamento: payload.department,
        categoria: payload.category,
        prioridade: payload.priority,
        status: 'NOVO',
        cliente: 'Cliente Padrão',
        analista_id: user.id,
        protocolo_origem: `WEB-${Date.now()}`
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

  } catch (error) {
    console.error('Erro na API POST /api/tickets:', error);
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Falha interna ao criar chamado', details }, { status: 500 });
  }
}
