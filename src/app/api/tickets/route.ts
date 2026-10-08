import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type TicketPayload = {
  customer: string;
  title: string;
  description: string;
  department: string;
  category: string;
  priority: string;
  technicianId: string | null;
};

function parseTicketPayload(value: unknown): TicketPayload | null {
  if (!value || typeof value !== 'object') return null;

  const payload = value as Record<string, unknown>;
  const customer = payload.cliente ?? payload.customer;
  const title = payload.titulo ?? payload.title;
  const description = payload.descricao ?? payload.description;
  const department = payload.departamento ?? payload.department;
  const category = payload.categoria ?? payload.category;
  const priority = payload.prioridade ?? payload.priority;
  const technicianId = payload.tecnico_id;

  if (typeof customer !== 'string' || !customer.trim()) return null;
  if (typeof title !== 'string' || !title.trim()) return null;
  if (typeof description !== 'string' || !description.trim()) return null;

  return {
    customer: customer.trim(),
    title: title.trim(),
    description: description.trim(),
    department: typeof department === 'string' && department.trim() ? department.trim() : 'Suporte',
    category: typeof category === 'string' && category.trim() ? category.trim() : 'Geral',
    priority: typeof priority === 'string' && priority.trim() ? priority.trim() : 'Normal',
    technicianId: typeof technicianId === 'string' && technicianId.trim() ? technicianId.trim() : null,
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

    const { data: profile, error: profileError } = await supabase
      .from('perfis')
      .select('id, cargo, status')
      .eq('user_id', user.id)
      .maybeSingle();
    const cargo = profile?.cargo?.trim().toUpperCase().replace('É', 'E');
    if (
      profileError ||
      !profile ||
      profile.status !== 'ATIVO' ||
      !['ADMIN', 'SUPER_ADMIN', 'ANALISTA'].includes(cargo || '')
    ) {
      return NextResponse.json({ error: 'Seu perfil não pode abrir chamados.' }, { status: 403 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Configuração do Supabase incompleta.' }, { status: 500 });
    }
    const supabaseAdmin = createSupabaseAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

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

        const { error: uploadError } = await supabaseAdmin.storage
          .from('anexos')
          .upload(`tickets/${fileName}`, buffer, {
            contentType: file.type,
            upsert: false
          });

        if (uploadError) {
          console.error('Erro ao fazer upload para o Supabase Storage:', uploadError);
          continue;
        }

        const { data: urlData } = supabaseAdmin.storage.from('anexos').getPublicUrl(`tickets/${fileName}`);
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

    if (payload.technicianId) {
      const { data: technician, error: technicianError } = await supabaseAdmin
        .from('perfis')
        .select('user_id')
        .eq('user_id', payload.technicianId)
        .eq('cargo', 'TECNICO')
        .eq('status', 'ATIVO')
        .maybeSingle();

      if (technicianError || !technician) {
        return NextResponse.json({ error: 'O técnico selecionado não está ativo ou não possui acesso ao portal.' }, { status: 400 });
      }
    }

    const { data: ticketData, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        titulo: payload.title,
        descricao: payload.description,
        departamento: payload.department,
        categoria: payload.category,
        prioridade: payload.priority,
        status: 'FILA',
        tecnico_id: payload.technicianId,
        cliente: payload.customer,
        analista_id: profile.id,
        protocolo_origem: `OS-${Date.now()}`
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

      const { error: anexosError } = await supabaseAdmin
        .from('ticket_anexos')
        .insert(anexosPayload);

      if (anexosError) {
        console.error('Erro ao inserir anexos:', anexosError);
      }
    }

    // Event Sourcing
    await supabaseAdmin.from('ticket_transitions').insert({
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
