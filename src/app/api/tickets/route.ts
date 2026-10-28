import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient as createSupabaseAdminClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { isTicketTeam, isValidProblemSelection, OTHER_ROOT_CAUSE, type TicketTeam } from '@/lib/tickets/problemCatalog';

type TicketPayload = {
  team: TicketTeam;
  customer: string;
  title: string;
  description: string;
  department: string;
  category: string;
  rootCause: string;
  rootCauseDetail: string;
  priority: string;
  technicianId: string | null;
};

function parseTicketPayload(value: unknown): TicketPayload | null {
  if (!value || typeof value !== 'object') return null;

  const payload = value as Record<string, unknown>;
  const customer = payload.cliente ?? payload.customer;
  const team = payload.equipe_responsavel;
  const title = payload.titulo ?? payload.title;
  const description = payload.descricao ?? payload.description;
  const department = payload.departamento ?? payload.department;
  const category = payload.categoria ?? payload.category;
  const rootCause = payload.causa_raiz ?? payload.rootCause;
  const rootCauseDetail = payload.causa_raiz_detalhe ?? payload.rootCauseDetail;
  const priority = payload.prioridade ?? payload.priority;
  const technicianId = payload.tecnico_id;

  if (typeof customer !== 'string' || !customer.trim()) return null;
  if (typeof title !== 'string' || !title.trim()) return null;
  if (typeof description !== 'string' || !description.trim()) return null;
  if (!isTicketTeam(team)) return null;
  if (team === 'SUPORTE_TECNICO') {
    if (typeof department !== 'string' || !department.trim()) return null;
    if (typeof category !== 'string' || !category.trim()) return null;
    if (typeof rootCause !== 'string' || !rootCause.trim()) return null;
    if (rootCause === OTHER_ROOT_CAUSE && (typeof rootCauseDetail !== 'string' || !rootCauseDetail.trim())) return null;
    if (!isValidProblemSelection(department, category, rootCause)) return null;
  }

  return {
    team,
    customer: customer.trim(),
    title: title.trim(),
    description: description.trim(),
    department: team === 'SUPORTE_TECNICO' && typeof department === 'string' ? department.trim() : '',
    category: team === 'SUPORTE_TECNICO' && typeof category === 'string' ? category.trim() : '',
    rootCause: team === 'SUPORTE_TECNICO' && typeof rootCause === 'string' ? rootCause.trim() : '',
    rootCauseDetail: team === 'SUPORTE_TECNICO' && typeof rootCauseDetail === 'string' ? rootCauseDetail.trim() : '',
    priority: typeof priority === 'string' && priority.trim() ? priority.trim() : 'Normal',
    technicianId: team === 'SUPORTE_TECNICO' && typeof technicianId === 'string' && technicianId.trim() ? technicianId.trim() : null,
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
    const uploadedObjectPaths: string[] = [];
    const uploadedAttachments: Array<{ url: string; nome_arquivo: string; tipo_arquivo: string; tamanho_bytes: number }> = [];

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

      files = formData.getAll('files').filter((value): value is File =>
        typeof value !== 'string' && typeof value.arrayBuffer === 'function' && value.size > 0,
      );

    } else {
      try {
        payloadValue = await req.json();
      } catch {
        return NextResponse.json({ error: 'Corpo da requisição contém JSON inválido' }, { status: 400 });
      }
    }

    const payload = parseTicketPayload(payloadValue);
    if (!payload) {
      return NextResponse.json({ error: 'Confira cliente, departamento, categoria, causa raiz e descrição da causa não listada.' }, { status: 400 });
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

    if (files.length > 20) {
      return NextResponse.json({ error: 'Envie no máximo 20 anexos por chamado.' }, { status: 400 });
    }

    for (const file of files) {
      if (file.size > 20 * 1024 * 1024) {
        return NextResponse.json({ error: `O arquivo ${file.name} excede o limite de 20 MB.` }, { status: 400 });
      }

      const safeOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-${safeOriginalName}`;
      const objectPath = `tickets/${fileName}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from('anexos')
        .upload(objectPath, Buffer.from(await file.arrayBuffer()), {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        });

      if (uploadError) {
        if (uploadedObjectPaths.length) await supabaseAdmin.storage.from('anexos').remove(uploadedObjectPaths);
        console.error('Erro ao fazer upload para o Supabase Storage:', uploadError);
        return NextResponse.json({ error: `Falha ao enviar o anexo ${file.name}.`, details: uploadError.message }, { status: 500 });
      }

      uploadedObjectPaths.push(objectPath);
      const { data: urlData } = supabaseAdmin.storage.from('anexos').getPublicUrl(objectPath);
      uploadedAttachments.push({
        url: urlData.publicUrl,
        nome_arquivo: file.name,
        tipo_arquivo: file.type || 'application/octet-stream',
        tamanho_bytes: file.size,
      });
    }

    const { data: ticketData, error: ticketError } = await supabaseAdmin
      .from('tickets')
      .insert({
        titulo: payload.title,
        descricao: payload.description,
        equipe_responsavel: payload.team,
        departamento: payload.department || null,
        categoria: payload.category || null,
        causa_raiz: payload.rootCause || null,
        causa_raiz_detalhe: payload.rootCauseDetail || null,
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
      if (uploadedObjectPaths.length) await supabaseAdmin.storage.from('anexos').remove(uploadedObjectPaths);
      console.error('Erro ao inserir ticket no Supabase:', ticketError);
      throw new Error(ticketError.message);
    }

    // Adiciona anexos se houver
    if (uploadedAttachments.length > 0 && ticketData) {
      const anexosPayload = uploadedAttachments.map(anexo => ({
        ticket_id: ticketData.id,
        ...anexo,
      }));

      const { error: anexosError } = await supabaseAdmin
        .from('ticket_anexos')
        .insert(anexosPayload);

      if (anexosError) {
        console.error('Erro ao inserir anexos:', anexosError);
        if (uploadedObjectPaths.length) await supabaseAdmin.storage.from('anexos').remove(uploadedObjectPaths);
        await supabaseAdmin.from('tickets').delete().eq('id', ticketData.id);
        return NextResponse.json({ error: 'O chamado foi criado, mas não foi possível registrar os anexos.', details: anexosError.message, ticketId: ticketData.id }, { status: 500 });
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
